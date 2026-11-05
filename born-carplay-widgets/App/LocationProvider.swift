import CoreLocation

/// Position ponctuelle (précision ~1 km), uniquement pour la météo locale.
final class LocationProvider: NSObject, ObservableObject, CLLocationManagerDelegate {
    @Published var busy = false

    private let manager = CLLocationManager()
    private var completion: ((Result<Coordinate, Error>) -> Void)?

    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyKilometer
    }

    func request(_ done: @escaping (Result<Coordinate, Error>) -> Void) {
        completion = done
        busy = true
        switch manager.authorizationStatus {
        case .notDetermined: manager.requestWhenInUseAuthorization()
        case .denied, .restricted: finish(.failure(LocationError.denied))
        default: manager.requestLocation()
        }
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        guard completion != nil else { return }
        switch manager.authorizationStatus {
        case .authorizedWhenInUse, .authorizedAlways: manager.requestLocation()
        case .denied, .restricted: finish(.failure(LocationError.denied))
        default: break
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let l = locations.last else { return }
        finish(.success(Coordinate(lat: l.coordinate.latitude, lon: l.coordinate.longitude)))
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        finish(.failure(error))
    }

    private func finish(_ result: Result<Coordinate, Error>) {
        DispatchQueue.main.async {
            self.busy = false
            self.completion?(result)
            self.completion = nil
        }
    }
}

enum LocationError: LocalizedError {
    case denied
    var errorDescription: String? {
        "Localisation refusée. Autorise-la dans Réglages › Confidentialité › Service de localisation › Born."
    }
}
