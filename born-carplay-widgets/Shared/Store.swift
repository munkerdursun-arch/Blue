import Foundation

/// Stockage partagé appli ↔ widgets via un App Group.
/// L'identifiant du groupe est lu dans Info.plist (clé AppGroupID, fixée par project.yml).
enum SharedStore {
    private static let key = "born.state.v1"

    /// Identifiant du groupe partagé. On lit d'abord celui réellement autorisé par le profil
    /// d'installation (embedded.mobileprovision) : les outils de réinstallation comme AltStore
    /// re-signent l'appli et peuvent ajouter un suffixe à cet identifiant.
    static let groupID: String = {
        let declared = Bundle.main.object(forInfoDictionaryKey: "AppGroupID") as? String ?? ""
        let granted = provisionedGroups()
        if granted.contains(declared) { return declared }
        if !declared.isEmpty, let renamed = granted.first(where: { $0.hasPrefix(declared) }) { return renamed }
        return granted.first ?? declared
    }()

    /// Groupes listés dans le profil de provisionnement embarqué (vide si absent, ex. simulateur).
    private static func provisionedGroups() -> [String] {
        guard let url = Bundle.main.url(forResource: "embedded", withExtension: "mobileprovision"),
              let data = try? Data(contentsOf: url),
              let text = String(data: data, encoding: .isoLatin1),
              let start = text.range(of: "<?xml"),
              let end = text.range(of: "</plist>"),
              let xml = String(text[start.lowerBound..<end.upperBound]).data(using: .isoLatin1),
              let plist = try? PropertyListSerialization.propertyList(from: xml, format: nil) as? [String: Any],
              let entitlements = plist["Entitlements"] as? [String: Any],
              let groups = entitlements["com.apple.security.application-groups"] as? [String]
        else { return [] }
        return groups
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
