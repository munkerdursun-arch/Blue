import WidgetKit
import SwiftUI

// Widgets pensés pour CarPlay : un seul chiffre principal, gros caractères,
// fort contraste, lisibles d'un coup d'œil. Ils apparaissent aussi sur l'iPhone.
// Pour CarPlay, seule la taille "petite" (systemSmall) est utilisée par le système.

@main
struct BornWidgetBundle: WidgetBundle {
    var body: some Widget {
        RangeWidget()
        ChargeWidget()
        WeatherWidget()
        BudgetWidget()
    }
}

// MARK: - Styles communs

enum Palette {
    static let copper = Color(red: 0.84, green: 0.56, blue: 0.38)
    static let ok = Color(red: 0.31, green: 0.82, blue: 0.55)
    static let warn = Color(red: 0.95, green: 0.72, blue: 0.29)
    static let bad = Color(red: 1.0, green: 0.42, blue: 0.37)
    static let ice = Color(red: 0.45, green: 0.78, blue: 1.0)

    static func soc(_ v: Double) -> Color { v < 15 ? bad : v < 30 ? warn : ok }
}

struct WidgetCard<Content: View>: View {
    let title: String
    let symbol: String
    @ViewBuilder var content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 5) {
                Image(systemName: symbol).foregroundStyle(Palette.copper)
                Text(title).foregroundStyle(.secondary)
                Spacer(minLength: 0)
            }
            .font(.system(size: 14, weight: .semibold))
            .lineLimit(1)
            content
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .containerBackground(for: .widget) {
            LinearGradient(colors: [Color(white: 0.11), Color(white: 0.05)], startPoint: .top, endPoint: .bottom)
        }
        .environment(\.colorScheme, .dark)
    }
}

/// Barre de progression simple (plus lisible qu'une jauge circulaire en voiture).
struct Bar: View {
    let value: Double // 0…1
    let color: Color
    var body: some View {
        GeometryReader { g in
            ZStack(alignment: .leading) {
                Capsule().fill(Color.white.opacity(0.12))
                Capsule().fill(color).frame(width: max(6, g.size.width * min(1, max(0, value))))
            }
        }
        .frame(height: 7)
    }
}

struct BigValue: View {
    let value: String
    let unit: String
    var color: Color = .primary
    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: 3) {
            Text(value)
                .font(.system(size: 40, weight: .bold, design: .rounded))
                .foregroundStyle(color)
                .minimumScaleFactor(0.6)
                .lineLimit(1)
                .contentTransition(.numericText())
            Text(unit).font(.system(size: 16, weight: .semibold)).foregroundStyle(.secondary)
        }
    }
}

private func fmt(_ v: Double, _ digits: Int = 0) -> String {
    v.formatted(.number.precision(.fractionLength(digits)).locale(Locale(identifier: "fr_FR")))
}

// MARK: - 1. Autonomie

struct RangeWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "BornRange", provider: BornProvider()) { RangeView(entry: $0) }
            .configurationDisplayName("Autonomie")
            .description("Batterie et autonomie estimée, corrigée selon la température.")
            .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct RangeView: View {
    let entry: BornEntry
    var body: some View {
        WidgetCard(title: "Autonomie", symbol: "bolt.car.fill") {
            if let soc = entry.soc, let range = entry.rangeKm {
                Spacer(minLength: 0)
                BigValue(value: fmt(range), unit: "km")
                Bar(value: soc / 100, color: Palette.soc(soc))
                HStack {
                    Text("\(fmt(soc)) %").foregroundStyle(Palette.soc(soc))
                    Spacer(minLength: 4)
                    footer
                }
                .font(.system(size: 13, weight: .semibold))
                .lineLimit(1)
            } else {
                Spacer(minLength: 0)
                Text("Batterie non saisie").font(.system(size: 16, weight: .semibold))
                Text("« Dis Siri, batterie dans Born »").font(.system(size: 12)).foregroundStyle(.secondary)
            }
        }
    }

    @ViewBuilder private var footer: some View {
        if entry.state.session != nil {
            Text("en charge").foregroundStyle(Palette.ok)
        } else if let t = entry.state.weather?.temperature, Estimator.temperatureFactor(t) < 0.99 {
            Text("\(fmt(t)) °C · −\(fmt((1 - Estimator.temperatureFactor(t)) * 100)) %").foregroundStyle(Palette.ice)
        } else if let d = entry.state.battery?.date {
            Text(d, style: .relative).foregroundStyle(.secondary)
        }
    }
}

// MARK: - 2. Charge

struct ChargeWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "BornCharge", provider: BornProvider()) { ChargeView(entry: $0) }
            .configurationDisplayName("Charge")
            .description("Progression estimée, heure de fin et coût de la charge en cours.")
            .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct ChargeView: View {
    let entry: BornEntry
    var body: some View {
        WidgetCard(title: "Charge", symbol: "bolt.fill") {
            if let s = entry.state.session {
                let st = entry.state.settings
                let end = Estimator.endDate(s, settings: st)
                let soc = Estimator.soc(at: entry.date, session: s, settings: st)
                let cost = Estimator.gridEnergy(from: s.startSoc, to: soc, charger: s.charger, settings: st) * s.pricePerKwh
                Spacer(minLength: 0)
                BigValue(value: fmt(soc), unit: "%", color: Palette.ok)
                Bar(value: soc / 100, color: Palette.ok)
                HStack {
                    if entry.date >= end {
                        Text("Objectif atteint").foregroundStyle(Palette.ok)
                    } else {
                        Text("Fin ") + Text(end, style: .time)
                    }
                    Spacer(minLength: 4)
                    Text("\(fmt(cost, 2)) €").foregroundStyle(.secondary)
                }
                .font(.system(size: 13, weight: .semibold))
                .lineLimit(1)
            } else if let last = entry.state.history.last {
                Spacer(minLength: 0)
                Text("Débranché").font(.system(size: 22, weight: .bold))
                Text("Dernière : \(fmt(last.kwh, 1)) kWh · \(fmt(last.cost, 2)) €")
                    .font(.system(size: 13, weight: .medium)).foregroundStyle(.secondary).lineLimit(2)
            } else {
                Spacer(minLength: 0)
                Text("Aucune charge").font(.system(size: 18, weight: .bold))
                Text("« Dis Siri, démarrer une charge dans Born »").font(.system(size: 12)).foregroundStyle(.secondary).lineLimit(3)
            }
        }
    }
}

// MARK: - 3. Météo & route

struct WeatherWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "BornWeather", provider: BornProvider()) { WeatherView(entry: $0) }
            .configurationDisplayName("Météo & route")
            .description("Température, risque de verglas et effet sur l'autonomie.")
            .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct WeatherView: View {
    let entry: BornEntry
    var body: some View {
        WidgetCard(title: "Météo", symbol: "thermometer.medium") {
            if let w = entry.state.weather {
                let info = WeatherService.describe(w.code)
                Spacer(minLength: 0)
                HStack(alignment: .center, spacing: 8) {
                    Image(systemName: info.symbol).symbolRenderingMode(.multicolor).font(.system(size: 30))
                    BigValue(value: fmt(w.temperature), unit: "°C")
                }
                if WeatherService.iceRisk(w) {
                    Label("Risque de verglas", systemImage: "snowflake")
                        .font(.system(size: 13, weight: .bold)).foregroundStyle(Palette.ice)
                } else {
                    Text(info.label).font(.system(size: 13, weight: .semibold))
                }
                HStack {
                    if let lo = w.minTemp, let hi = w.maxTemp { Text("\(fmt(lo))° / \(fmt(hi))°") }
                    Spacer(minLength: 4)
                    let loss = (1 - Estimator.temperatureFactor(w.temperature)) * 100
                    Text(loss >= 1 ? "Autonomie −\(fmt(loss)) %" : "Autonomie OK")
                        .foregroundStyle(loss >= 1 ? Palette.ice : Palette.ok)
                }
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(.secondary)
                .lineLimit(1)
            } else {
                Spacer(minLength: 0)
                Text("Météo indisponible").font(.system(size: 16, weight: .semibold))
                Text("Ouvre l'appli Born et touche « Localiser »").font(.system(size: 12)).foregroundStyle(.secondary).lineLimit(2)
            }
        }
    }
}

// MARK: - 4. Budget du mois

struct BudgetWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "BornBudget", provider: BornProvider()) { BudgetView(entry: $0) }
            .configurationDisplayName("Budget du mois")
            .description("Énergie rechargée et dépenses du mois en cours.")
            .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct BudgetView: View {
    let entry: BornEntry
    var body: some View {
        let month = entry.state.thisMonth
        let kwh = month.reduce(0) { $0 + $1.kwh }
        let cost = month.reduce(0) { $0 + $1.cost }
        let st = entry.state.settings
        // Coût aux 100 km = prix moyen payé × consommation moyenne
        let per100 = kwh > 0 ? cost / kwh * st.avgConsumption : st.homePriceKwh * st.avgConsumption
        WidgetCard(title: "Ce mois", symbol: "eurosign.circle.fill") {
            Spacer(minLength: 0)
            BigValue(value: fmt(cost, cost < 100 ? 2 : 0), unit: "€")
            Text("\(fmt(kwh)) kWh · \(month.count) charge\(month.count > 1 ? "s" : "")")
                .font(.system(size: 13, weight: .semibold))
            Text("≈ \(fmt(per100, 2)) € / 100 km")
                .font(.system(size: 12, weight: .medium)).foregroundStyle(.secondary)
        }
    }
}
