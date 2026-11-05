import Foundation

/// Stockage partagé appli ↔ widgets via un App Group.
/// L'identifiant du groupe est lu dans Info.plist (clé AppGroupID, fixée par project.yml).
enum SharedStore {
    private static let key = "born.state.v1"

    static var groupID: String {
        Bundle.main.object(forInfoDictionaryKey: "AppGroupID") as? String ?? ""
    }

    /// true si le conteneur partagé est accessible (sinon les widgets ne verront pas les données).
    static var isGroupAvailable: Bool {
        !groupID.isEmpty &&
            FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: groupID) != nil
    }

    private static var defaults: UserDefaults {
        UserDefaults(suiteName: groupID) ?? .standard
    }

    static func load() -> AppState {
        guard let data = defaults.data(forKey: key),
              let state = try? JSONDecoder().decode(AppState.self, from: data)
        else { return AppState() }
        return state
    }

    static func save(_ state: AppState) {
        guard let data = try? JSONEncoder().encode(state) else { return }
        defaults.set(data, forKey: key)
    }

    /// Lecture-modification-écriture en une étape.
    @discardableResult
    static func update(_ change: (inout AppState) -> Void) -> AppState {
        var state = load()
        change(&state)
        save(state)
        return state
    }
}
