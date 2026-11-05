import Foundation

/// Calculs d'estimation. Ce sont des approximations, pas des mesures du véhicule.
enum Estimator {

    // MARK: Autonomie

    /// Effet de la température extérieure sur l'autonomie (chauffage, chimie de la batterie).
    /// Approximation : environ −1,2 % par degré sous 15 °C (plafonné à −35 %),
    /// et une légère baisse au-dessus de 28 °C (climatisation).
    static func temperatureFactor(_ temp: Double?) -> Double {
        guard let t = temp else { return 1 }
        if t < 15 { return max(0.65, 1 - (15 - t) * 0.012) }
        if t > 28 { return max(0.85, 1 - (t - 28) * 0.008) }
        return 1
    }

    /// Autonomie estimée en km pour un état de charge donné.
    static func rangeKm(soc: Double, settings: BornSettings, temperature: Double?) -> Double {
        let energy = soc / 100 * settings.capacityKwh
        guard settings.avgConsumption > 0 else { return 0 }
        return energy / settings.avgConsumption * 100 * temperatureFactor(temperature)
    }

    // MARK: Charge

    /// Puissance de charge estimée (kW, côté borne) selon l'état de charge.
    /// Courbe type : pleine puissance jusqu'à ~35 %, puis baisse progressive en DC.
    static func chargePower(soc: Double, charger: ChargerType, maxDcKw: Double) -> Double {
        let p = charger.powerKw(maxDc: maxDcKw)
        if charger.isAC {
            let ac = min(p, 11) // chargeur embarqué AC
            return soc < 95 ? ac : ac * (1 - (soc - 95) / 5 * 0.7)
        }
        let f: Double
        if soc <= 35 { f = 1 }
        else if soc <= 80 { f = 1 - (soc - 35) / 45 * 0.55 }
        else { f = 0.45 - (soc - 80) / 20 * 0.37 }
        return max(1, min(p, maxDcKw * f))
    }

    static func efficiency(_ charger: ChargerType) -> Double { charger.isAC ? 0.9 : 0.95 }

    /// Simule la session minute par minute jusqu'à `date` (ou jusqu'à l'objectif).
    private static func simulate(_ s: ChargeSession, settings: BornSettings, until date: Date?) -> (soc: Double, end: Date) {
        var soc = s.startSoc
        var t = s.start
        let step: TimeInterval = 60
        let limit = s.start.addingTimeInterval(48 * 3600)
        let eff = efficiency(s.charger)
        while soc < s.targetSoc && t < limit {
            if let date, t >= date { break }
            let kw = chargePower(soc: soc, charger: s.charger, maxDcKw: settings.maxDcKw)
            soc += kw * eff * (step / 3600) / settings.capacityKwh * 100
            t += step
        }
        return (min(soc, s.targetSoc), t)
    }

    /// État de charge estimé à un instant donné de la session.
    static func soc(at date: Date, session: ChargeSession, settings: BornSettings) -> Double {
        simulate(session, settings: settings, until: date).soc
    }

    /// Heure estimée d'atteinte de l'objectif.
    static func endDate(_ session: ChargeSession, settings: BornSettings) -> Date {
        simulate(session, settings: settings, until: nil).end
    }

    /// Énergie prélevée sur le réseau (kWh) pour passer de `from` à `to` %.
    static func gridEnergy(from: Double, to: Double, charger: ChargerType, settings: BornSettings) -> Double {
        max(0, to - from) / 100 * settings.capacityKwh / efficiency(charger)
    }

    // MARK: Lecture combinée

    /// État de charge "actuel" : estimé si une charge est en cours, sinon dernière saisie.
    static func currentSoc(_ state: AppState, at date: Date = Date()) -> Double? {
        if let s = state.session { return soc(at: date, session: s, settings: state.settings) }
        return state.battery?.soc
    }

    /// Termine la session : enregistre le coût et met à jour la batterie.
    static func finishSession(_ state: inout AppState, at date: Date = Date()) {
        guard let s = state.session else { return }
        let reached = soc(at: date, session: s, settings: state.settings)
        let kwh = gridEnergy(from: s.startSoc, to: reached, charger: s.charger, settings: state.settings)
        if kwh > 0.05 {
            state.history.append(ChargeRecord(date: date, kwh: kwh, cost: kwh * s.pricePerKwh))
        }
        state.battery = BatteryReading(soc: reached, date: date)
        state.session = nil
        // On garde un an d'historique au maximum.
        let yearAgo = date.addingTimeInterval(-365 * 24 * 3600)
        state.history.removeAll { $0.date < yearAgo }
    }

    /// Clôture automatiquement une session dont l'objectif est atteint.
    static func autoFinishIfDone(_ state: inout AppState, now: Date = Date()) {
        guard let s = state.session else { return }
        let end = endDate(s, settings: state.settings)
        if now >= end { finishSession(&state, at: end) }
    }
}
