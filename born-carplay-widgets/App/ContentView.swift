import SwiftUI
import WidgetKit

/// Écran unique de l'appli : saisie de la batterie, suivi de charge, météo, budget, réglages.
/// À utiliser à l'arrêt. En roulant, passe par Siri.
struct ContentView: View {
    @State private var state = SharedStore.load()
    @State private var socInput: Double = 80
    @State private var target: Double = 80
    @State private var charger: ChargerType = .ac11
    @State private var weatherMessage: String?
    @StateObject private var locator = LocationProvider()
    @Environment(\.scenePhase) private var scenePhase

    var body: some View {
        NavigationStack {
            Form {
                if !SharedStore.isGroupAvailable { groupWarning }
                batterySection
                chargeSection
                weatherSection
                monthSection
                settingsSection
                carPlaySection
            }
            .navigationTitle("Born")
        }
        .onAppear(perform: reload)
        .onChange(of: scenePhase) { _, phase in
            if phase == .active { reload() }
        }
    }

    // MARK: - Données

    private func reload() {
        state = SharedStore.update { Estimator.autoFinishIfDone(&$0) }
        if let soc = state.battery?.soc { socInput = soc.rounded() }
        WidgetCenter.shared.reloadAllTimelines()
    }

    private func commit(_ change: (inout AppState) -> Void) {
        state = SharedStore.update(change)
        WidgetCenter.shared.reloadAllTimelines()
    }

    private func settingBinding(_ path: WritableKeyPath<BornSettings, Double>) -> Binding<Double> {
        Binding(
            get: { state.settings[keyPath: path] },
            set: { value in commit { $0.settings[keyPath: path] = value } }
        )
    }

    private func num(_ v: Double, _ digits: Int = 0) -> String {
        v.formatted(.number.precision(.fractionLength(digits)))
    }

    private func duration(_ seconds: TimeInterval) -> String {
        let m = Int((seconds / 60).rounded())
        return m < 60 ? "\(m) min" : "\(m / 60) h \(String(format: "%02d", m % 60))"
    }

    // MARK: - Sections

    private var groupWarning: some View {
        Section {
            Label {
                Text("Le partage avec les widgets ne fonctionne pas : vérifie la capacité « App Groups » dans Xcode (voir le README).")
            } icon: {
                Image(systemName: "exclamationmark.triangle.fill").foregroundStyle(.orange)
            }
        }
    }

    private var batterySection: some View {
        Section {
            if let b = state.battery {
                let range = Estimator.rangeKm(soc: b.soc, settings: state.settings, temperature: state.weather?.temperature)
                LabeledContent("Dernière saisie") {
                    Text("\(num(b.soc)) % · \(num(range)) km")
                }
                LabeledContent("Saisie") { Text(b.date, style: .relative) }
            }
            VStack(alignment: .leading) {
                Text("Niveau affiché par la voiture : \(num(socInput)) %").font(.headline)
                Slider(value: $socInput, in: 0...100, step: 1)
            }
            Button("Enregistrer le niveau") {
                commit { s in
                    s.battery = BatteryReading(soc: socInput, date: Date())
                    if var session = s.session {
                        session.start = Date()
                        session.startSoc = socInput
                        s.session = session
                    }
                }
            }
        } header: {
            Text("Batterie")
        } footer: {
            Text("Astuce : « Dis Siri, batterie dans Born » pour le faire à la voix.")
        }
    }

    private var chargeSection: some View {
        Section("Charge") {
            if let session = state.session {
                TimelineView(.periodic(from: .now, by: 30)) { context in
                    let soc = Estimator.soc(at: context.date, session: session, settings: state.settings)
                    let end = Estimator.endDate(session, settings: state.settings)
                    let cost = Estimator.gridEnergy(from: session.startSoc, to: soc, charger: session.charger, settings: state.settings) * session.pricePerKwh
                    VStack(alignment: .leading, spacing: 6) {
                        Text("\(num(soc)) % → \(num(session.targetSoc)) %").font(.title2.bold())
                        ProgressView(value: soc, total: 100)
                        Text("\(session.charger.label) · fin vers \(end.formatted(date: .omitted, time: .shortened)) · \(num(cost, 2)) €")
                            .font(.subheadline).foregroundStyle(.secondary)
                    }
                }
                Button("Arrêter la charge", role: .destructive) {
                    commit { Estimator.finishSession(&$0) }
                }
            } else {
                Picker("Borne", selection: $charger) {
                    ForEach(ChargerType.allCases) { Text($0.label).tag($0) }
                }
                VStack(alignment: .leading) {
                    Text("Objectif : \(num(target)) %").font(.headline)
                    Slider(value: $target, in: 20...100, step: 5)
                }
                if let soc = state.battery?.soc, soc < target {
                    let preview = ChargeSession(start: Date(), startSoc: soc, targetSoc: target, charger: charger,
                                                pricePerKwh: charger.isAC ? state.settings.homePriceKwh : state.settings.publicPriceKwh)
                    let end = Estimator.endDate(preview, settings: state.settings)
                    let kwh = Estimator.gridEnergy(from: soc, to: target, charger: charger, settings: state.settings)
                    LabeledContent("Estimation") {
                        Text("\(duration(end.timeIntervalSinceNow)) · \(num(kwh * preview.pricePerKwh, 2)) €")
                    }
                    Button("Démarrer le suivi de charge") {
                        commit { $0.session = preview }
                    }
                } else if state.battery == nil {
                    Text("Enregistre d'abord le niveau de batterie.").foregroundStyle(.secondary)
                } else {
                    Text("Objectif déjà atteint.").foregroundStyle(.secondary)
                }
            }
        }
    }

    private var weatherSection: some View {
        Section {
            if let w = state.weather {
                let info = WeatherService.describe(w.code)
                LabeledContent {
                    Text("\(num(w.temperature)) °C · \(info.label)")
                } label: {
                    Label("Actuellement", systemImage: info.symbol)
                }
                let loss = (1 - Estimator.temperatureFactor(w.temperature)) * 100
                LabeledContent("Effet sur l'autonomie") { Text(loss >= 1 ? "−\(num(loss)) %" : "aucun") }
                if WeatherService.iceRisk(w) {
                    Label("Risque de verglas", systemImage: "snowflake").foregroundStyle(.blue)
                }
            }
            Button {
                weatherMessage = nil
                locator.request { result in
                    switch result {
                    case .failure(let error):
                        weatherMessage = error.localizedDescription
                    case .success(let coord):
                        commit { $0.location = coord }
                        Task {
                            do {
                                let w = try await WeatherService.fetch(coord)
                                await MainActor.run { commit { $0.weather = w } }
                            } catch {
                                await MainActor.run { weatherMessage = "Météo indisponible pour le moment." }
                            }
                        }
                    }
                }
            } label: {
                Label(locator.busy ? "Localisation…" : "Localiser et mettre à jour la météo", systemImage: "location.fill")
            }
            .disabled(locator.busy)
            if let weatherMessage { Text(weatherMessage).font(.footnote).foregroundStyle(.red) }
        } header: {
            Text("Météo")
        } footer: {
            Text("Ensuite, les widgets rafraîchissent la météo d'eux-mêmes (toutes les 30 min environ) pour cette zone. Relocalise-toi si tu changes de région.")
        }
    }

    private var monthSection: some View {
        let month = state.thisMonth
        let recent = Array(month.reversed()) // plus récentes en premier
        return Section {
            LabeledContent("Total") {
                Text("\(num(month.reduce(0) { $0 + $1.cost }, 2)) € · \(num(month.reduce(0) { $0 + $1.kwh })) kWh")
            }
            ForEach(recent) { r in
                LabeledContent(r.date.formatted(date: .abbreviated, time: .shortened)) {
                    Text("\(num(r.kwh, 1)) kWh · \(num(r.cost, 2)) €")
                }
            }
            .onDelete { offsets in
                let ids = offsets.map { recent[$0].id }
                commit { s in s.history.removeAll { ids.contains($0.id) } }
            }
        } header: {
            Text("Ce mois-ci")
        } footer: {
            Text("Montants estimés à partir des réglages de prix ci-dessous. Glisse une ligne vers la gauche pour la supprimer.")
        }
    }

    private var settingsSection: some View {
        Section {
            field("Capacité utile (kWh)", settingBinding(\.capacityKwh))
            field("Consommation moyenne (kWh/100 km)", settingBinding(\.avgConsumption))
            field("Puissance DC max (kW)", settingBinding(\.maxDcKw))
            field("Prix à domicile (€/kWh)", settingBinding(\.homePriceKwh))
            field("Prix borne publique (€/kWh)", settingBinding(\.publicPriceKwh))
        } header: {
            Text("Véhicule")
        } footer: {
            Text("Valeurs par défaut indicatives : vérifie la capacité de ta batterie et la puissance de charge de ta version. La consommation moyenne figure dans les données de trajet de la voiture.")
        }
    }

    private func field(_ title: String, _ value: Binding<Double>) -> some View {
        LabeledContent(title) {
            TextField(title, value: value, format: .number)
                .keyboardType(.decimalPad)
                .multilineTextAlignment(.trailing)
                .frame(maxWidth: 90)
        }
    }

    private var carPlaySection: some View {
        Section("Afficher sur l'écran de la voiture") {
            Text("1. Sur l'iPhone : Réglages › Général › CarPlay › ta voiture › Widgets.")
            Text("2. Ajoute « Autonomie », « Charge », « Météo & route » et « Budget du mois » (app Born).")
            Text("3. Dans CarPlay, balaie vers l'écran des widgets.")
            Text("Rien ne vient directement de la voiture : le niveau de batterie est celui que tu saisis, le reste est estimé.")
                .font(.footnote).foregroundStyle(.secondary)
        }
    }
}
