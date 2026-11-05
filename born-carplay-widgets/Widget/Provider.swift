import WidgetKit
import Foundation

struct BornEntry: TimelineEntry {
    let date: Date
    let state: AppState

    /// Batterie à l'instant de l'entrée (estimée si une charge est en cours).
    var soc: Double? { Estimator.currentSoc(state, at: date) }

    var rangeKm: Double? {
        guard let soc else { return nil }
        return Estimator.rangeKm(soc: soc, settings: state.settings, temperature: state.weather?.temperature)
    }

    static var sample: BornEntry {
        var s = AppState()
        s.battery = BatteryReading(soc: 72, date: Date().addingTimeInterval(-3600))
        s.weather = WeatherSnapshot(temperature: 7, code: 3, minTemp: 2, maxTemp: 11, rainChance: 40, date: Date())
        s.history = [ChargeRecord(date: Date(), kwh: 38, cost: 9.5), ChargeRecord(date: Date(), kwh: 22, cost: 9.9)]
        return BornEntry(date: Date(), state: s)
    }
}

/// Fournisseur commun aux quatre widgets.
struct BornProvider: TimelineProvider {
    func placeholder(in context: Context) -> BornEntry { .sample }

    func getSnapshot(in context: Context, completion: @escaping (BornEntry) -> Void) {
        completion(context.isPreview ? .sample : BornEntry(date: Date(), state: SharedStore.load()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<BornEntry>) -> Void) {
        Task {
            var state = SharedStore.update { Estimator.autoFinishIfDone(&$0) }

            // Météo rafraîchie toutes les 30 min au plus, si une position a été enregistrée dans l'appli.
            let stale = state.weather.map { Date().timeIntervalSince($0.date) > 1800 } ?? true
            if stale, let loc = state.location, let w = try? await WeatherService.fetch(loc) {
                state.weather = w
                SharedStore.update { $0.weather = w }
            }

            let now = Date()
            var entries: [BornEntry] = []
            let policy: TimelineReloadPolicy

            if let session = state.session {
                // Charge en cours : une entrée toutes les 5 min jusqu'à l'objectif.
                let end = Estimator.endDate(session, settings: state.settings)
                var t = now
                while t < end && entries.count < 72 {
                    entries.append(BornEntry(date: t, state: state))
                    t = t.addingTimeInterval(300)
                }
                entries.append(BornEntry(date: max(end, now), state: state))
                policy = .after(max(end, now).addingTimeInterval(60))
            } else {
                entries = [BornEntry(date: now, state: state)]
                policy = .after(now.addingTimeInterval(1800))
            }
            completion(Timeline(entries: entries, policy: policy))
        }
    }
}
