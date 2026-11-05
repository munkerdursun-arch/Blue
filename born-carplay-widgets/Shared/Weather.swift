import Foundation

/// Météo via Open-Meteo (gratuit, sans clé, sans compte) : https://open-meteo.com
enum WeatherService {

    private struct Response: Decodable {
        struct Current: Decodable {
            let temperature_2m: Double
            let weather_code: Int
        }
        struct Daily: Decodable {
            let temperature_2m_min: [Double?]?
            let temperature_2m_max: [Double?]?
            let precipitation_probability_max: [Int?]?
        }
        let current: Current
        let daily: Daily?
    }

    static func fetch(_ c: Coordinate) async throws -> WeatherSnapshot {
        var comps = URLComponents(string: "https://api.open-meteo.com/v1/forecast")!
        comps.queryItems = [
            URLQueryItem(name: "latitude", value: String(format: "%.3f", c.lat)),
            URLQueryItem(name: "longitude", value: String(format: "%.3f", c.lon)),
            URLQueryItem(name: "current", value: "temperature_2m,weather_code"),
            URLQueryItem(name: "daily", value: "temperature_2m_min,temperature_2m_max,precipitation_probability_max"),
            URLQueryItem(name: "forecast_days", value: "1"),
            URLQueryItem(name: "timezone", value: "auto"),
        ]
        var request = URLRequest(url: comps.url!)
        request.timeoutInterval = 10
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw URLError(.badServerResponse)
        }
        let r = try JSONDecoder().decode(Response.self, from: data)
        return WeatherSnapshot(
            temperature: r.current.temperature_2m,
            code: r.current.weather_code,
            minTemp: r.daily?.temperature_2m_min?.first ?? nil,
            maxTemp: r.daily?.temperature_2m_max?.first ?? nil,
            rainChance: r.daily?.precipitation_probability_max?.first ?? nil,
            date: Date()
        )
    }

    /// Libellé et symbole SF Symbols pour un code météo WMO.
    static func describe(_ code: Int) -> (label: String, symbol: String) {
        switch code {
        case 0: return ("Dégagé", "sun.max.fill")
        case 1, 2: return ("Nuageux", "cloud.sun.fill")
        case 3: return ("Couvert", "cloud.fill")
        case 45, 48: return ("Brouillard", "cloud.fog.fill")
        case 51...57: return ("Bruine", "cloud.drizzle.fill")
        case 61...67: return ("Pluie", "cloud.rain.fill")
        case 71...77: return ("Neige", "cloud.snow.fill")
        case 80...82: return ("Averses", "cloud.heavyrain.fill")
        case 85, 86: return ("Averses de neige", "cloud.snow.fill")
        case 95...99: return ("Orage", "cloud.bolt.rain.fill")
        default: return ("—", "cloud.fill")
        }
    }

    /// Risque de verglas : température ≤ 3 °C (prévision minimale ou actuelle).
    static func iceRisk(_ w: WeatherSnapshot) -> Bool {
        min(w.temperature, w.minTemp ?? w.temperature) <= 3
    }
}
