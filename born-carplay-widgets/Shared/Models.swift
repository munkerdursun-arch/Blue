import Foundation

// MARK: - Données partagées entre l'appli et les widgets
//
// Rien ne vient directement de la voiture : CarPlay ne transmet pas les données
// du véhicule aux applis tierces. Le niveau de batterie est saisi par toi
// (appli ou Siri) ; le reste est calculé à partir de cette saisie.

/// Réglages du véhicule (modifiables dans l'appli).
struct BornSettings: Codable, Equatable {
    /// Capacité utile de la batterie. Valeur indicative : à adapter à ta version.
    var capacityKwh: Double = 58
    /// Consommation moyenne par temps doux (~20 °C), en kWh/100 km.
    var avgConsumption: Double = 16.5
    /// Puissance maximale en charge rapide DC. Valeur indicative.
    var maxDcKw: Double = 120
    var homePriceKwh: Double = 0.25
    var publicPriceKwh: Double = 0.45
}

/// Dernier niveau de batterie connu.
struct BatteryReading: Codable, Equatable {
    var soc: Double
    var date: Date
}

/// Type de borne utilisé pour une charge.
enum ChargerType: String, Codable, CaseIterable, Identifiable {
    case ac7
    case ac11
    case dc50
    case dcMax

    var id: String { rawValue }

    var label: String {
        switch self {
        case .ac7: return "AC 7,4 kW"
        case .ac11: return "AC 11 kW"
        case .dc50: return "DC 50 kW"
        case .dcMax: return "DC rapide"
        }
    }

    var isAC: Bool { self == .ac7 || self == .ac11 }

    func powerKw(maxDc: Double) -> Double {
        switch self {
        case .ac7: return 7.4
        case .ac11: return 11
        case .dc50: return 50
        case .dcMax: return maxDc
        }
    }
}

/// Charge en cours (suivi estimé, pas lu sur la borne).
struct ChargeSession: Codable, Equatable {
    var start: Date
    var startSoc: Double
    var targetSoc: Double
    var charger: ChargerType
    var pricePerKwh: Double
}

/// Charge terminée, pour le budget du mois.
struct ChargeRecord: Codable, Equatable, Identifiable {
    var id = UUID()
    var date: Date
    var kwh: Double
    var cost: Double
}

struct Coordinate: Codable, Equatable {
    var lat: Double
    var lon: Double
}

struct WeatherSnapshot: Codable, Equatable {
    var temperature: Double
    var code: Int
    var minTemp: Double?
    var maxTemp: Double?
    var rainChance: Int?
    var date: Date
}

/// État complet, stocké dans le conteneur partagé (App Group).
struct AppState: Codable, Equatable {
    var settings = BornSettings()
    var battery: BatteryReading?
    var session: ChargeSession?
    var history: [ChargeRecord] = []
    var location: Coordinate?
    var weather: WeatherSnapshot?

    /// Charges du mois en cours.
    var thisMonth: [ChargeRecord] {
        let cal = Calendar.current
        return history.filter { cal.isDate($0.date, equalTo: Date(), toGranularity: .month) }
    }
}

// MARK: - Décodage tolérant
// Si une future version ajoute un champ, les données déjà enregistrées restent lisibles.

extension AppState {
    enum CodingKeys: String, CodingKey { case settings, battery, session, history, location, weather }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.init()
        settings = try c.decodeIfPresent(BornSettings.self, forKey: .settings) ?? BornSettings()
        battery = try c.decodeIfPresent(BatteryReading.self, forKey: .battery)
        session = try c.decodeIfPresent(ChargeSession.self, forKey: .session)
        history = try c.decodeIfPresent([ChargeRecord].self, forKey: .history) ?? []
        location = try c.decodeIfPresent(Coordinate.self, forKey: .location)
        weather = try c.decodeIfPresent(WeatherSnapshot.self, forKey: .weather)
    }
}

extension BornSettings {
    enum CodingKeys: String, CodingKey { case capacityKwh, avgConsumption, maxDcKw, homePriceKwh, publicPriceKwh }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.init()
        capacityKwh = try c.decodeIfPresent(Double.self, forKey: .capacityKwh) ?? capacityKwh
        avgConsumption = try c.decodeIfPresent(Double.self, forKey: .avgConsumption) ?? avgConsumption
        maxDcKw = try c.decodeIfPresent(Double.self, forKey: .maxDcKw) ?? maxDcKw
        homePriceKwh = try c.decodeIfPresent(Double.self, forKey: .homePriceKwh) ?? homePriceKwh
        publicPriceKwh = try c.decodeIfPresent(Double.self, forKey: .publicPriceKwh) ?? publicPriceKwh
    }
}
