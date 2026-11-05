import AppIntents
import WidgetKit

// Commandes Siri / Raccourcis : on peut tout mettre à jour à la voix, sans toucher l'iPhone.
// Exemples : « Dis Siri, batterie dans Born », « Dis Siri, démarrer une charge dans Born ».

extension ChargerType: AppEnum {
    static var typeDisplayRepresentation: TypeDisplayRepresentation = "Type de borne"
    static var caseDisplayRepresentations: [ChargerType: DisplayRepresentation] = [
        .ac7: "AC 7,4 kW",
        .ac11: "AC 11 kW",
        .dc50: "DC 50 kW",
        .dcMax: "DC rapide",
    ]
}

struct SetBatteryIntent: AppIntent {
    static var title: LocalizedStringResource = "Niveau de batterie"
    static var description = IntentDescription("Enregistre le niveau de batterie affiché par la voiture.")

    @Parameter(title: "Niveau (%)", requestValueDialog: IntentDialog("Quel niveau de batterie affiche la voiture, en pourcentage ?"))
    var level: Int

    func perform() async throws -> some IntentResult & ProvidesDialog {
        let soc = Double(min(100, max(0, level)))
        let state = SharedStore.update { s in
            s.battery = BatteryReading(soc: soc, date: Date())
            // Pendant une charge, la saisie recale l'estimation.
            if var session = s.session {
                session.start = Date()
                session.startSoc = soc
                s.session = session
            }
        }
        WidgetCenter.shared.reloadAllTimelines()
        let km = Int(Estimator.rangeKm(soc: soc, settings: state.settings, temperature: state.weather?.temperature).rounded())
        return .result(dialog: "C'est noté : \(Int(soc)) %, soit environ \(km) kilomètres d'autonomie.")
    }
}

struct StartChargeIntent: AppIntent {
    static var title: LocalizedStringResource = "Démarrer une charge"
    static var description = IntentDescription("Lance le suivi estimé d'une charge (progression, heure de fin, coût).")

    @Parameter(title: "Objectif (%)", default: 80)
    var target: Int

    @Parameter(title: "Borne", default: .ac11)
    var charger: ChargerType

    func perform() async throws -> some IntentResult & ProvidesDialog {
        var message = ""
        SharedStore.update { s in
            guard let battery = s.battery else {
                message = "Indique d'abord le niveau de batterie : dis « batterie dans Born »."
                return
            }
            if s.session != nil { Estimator.finishSession(&s) }
            let start = s.battery?.soc ?? battery.soc
            let goal = Double(min(100, max(Int(start) + 1, target)))
            let price = charger.isAC ? s.settings.homePriceKwh : s.settings.publicPriceKwh
            let session = ChargeSession(start: Date(), startSoc: start, targetSoc: goal, charger: charger, pricePerKwh: price)
            s.session = session
            let end = Estimator.endDate(session, settings: s.settings)
            let time = end.formatted(date: .omitted, time: .shortened)
            message = "Charge lancée sur \(charger.label), de \(Int(start)) à \(Int(goal)) %. Fin estimée vers \(time)."
        }
        WidgetCenter.shared.reloadAllTimelines()
        return .result(dialog: "\(message)")
    }
}

struct StopChargeIntent: AppIntent {
    static var title: LocalizedStringResource = "Arrêter la charge"
    static var description = IntentDescription("Termine la charge en cours et l'ajoute au budget du mois.")

    func perform() async throws -> some IntentResult & ProvidesDialog {
        var message = "Aucune charge en cours."
        SharedStore.update { s in
            guard s.session != nil else { return }
            Estimator.finishSession(&s)
            if let last = s.history.last, let soc = s.battery?.soc {
                let cost = last.cost.formatted(.number.precision(.fractionLength(2)))
                message = "Charge terminée à \(Int(soc)) %. Coût estimé : \(cost) euros."
            } else {
                message = "Charge terminée."
            }
        }
        WidgetCenter.shared.reloadAllTimelines()
        return .result(dialog: "\(message)")
    }
}

struct BornShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: SetBatteryIntent(),
            phrases: ["Batterie dans \(.applicationName)", "Mettre à jour la batterie dans \(.applicationName)"],
            shortTitle: "Batterie",
            systemImageName: "battery.75percent"
        )
        AppShortcut(
            intent: StartChargeIntent(),
            phrases: ["Démarrer une charge dans \(.applicationName)", "Je charge dans \(.applicationName)"],
            shortTitle: "Démarrer la charge",
            systemImageName: "bolt.fill"
        )
        AppShortcut(
            intent: StopChargeIntent(),
            phrases: ["Arrêter la charge dans \(.applicationName)", "Fin de charge dans \(.applicationName)"],
            shortTitle: "Arrêter la charge",
            systemImageName: "bolt.slash.fill"
        )
    }
}
