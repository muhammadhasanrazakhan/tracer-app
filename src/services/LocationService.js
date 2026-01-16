import Geolocation from 'react-native-geolocation-service';
import { PermissionsAndroid, Platform } from 'react-native';
import TripTempStorage, { TripPoint } from './TripTempStorage';
import EventEmitter from 'eventemitter3';

class LocationServiceClass {
  constructor() {
    if (LocationServiceClass._inst) return LocationServiceClass._inst;
    this._watchId = null;
    this._listeners = new Set();
    this._lastPoint = null;
    this.events = new EventEmitter();
    LocationServiceClass._inst = this;
  }

  async _requestAndroidPermission() {
    if (Platform.OS !== 'android') return true;
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      { title: 'Location', message: 'We need location permission' }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }

  // start foreground tracking
  async startTracking() {
    if (this._watchId) return;
    const ok = await this._requestAndroidPermission();
    if (!ok) return;

    this._watchId = Geolocation.watchPosition(
      async (pos) => {
        const point = new TripPoint({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: new Date(pos.timestamp).toISOString(),
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed,
        });

        // dedupe: same lat/lng
        if (this._lastPoint && this._lastPoint.lat === point.lat && this._lastPoint.lng === point.lng) {
          return;
        }
        this._lastPoint = { lat: point.lat, lng: point.lng };

        await TripTempStorage.addPoint(point);
        // notify listeners
        this._listeners.forEach((l) => l({ lat: point.lat, lng: point.lng }));
        this.events.emit('point', point);
      },
      (err) => console.warn('FG geolocation error', err),
      { distanceFilter: 5, enableHighAccuracy: true, interval: 5000, fastestInterval: 2000 }
    );
  }

  addListener(fn) { this._listeners.add(fn); }
  removeListener(fn) { this._listeners.delete(fn); }

  async stopTracking() {
    if (this._watchId != null) {
      Geolocation.clearWatch(this._watchId);
      this._watchId = null;
    }
  }

  get isTracking() { return !!this._watchId; }
}

const LocationService = new LocationServiceClass();
export default LocationService;

