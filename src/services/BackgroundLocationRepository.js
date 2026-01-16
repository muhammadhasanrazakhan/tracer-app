import BackgroundGeolocation from 'react-native-background-geolocation';
import TripTempStorage, { TripPoint } from './TripTempStorage';
import EventEmitter from 'eventemitter3';

class BackgroundLocationRepositoryClass {
  constructor() {
    if (BackgroundLocationRepositoryClass._inst) return BackgroundLocationRepositoryClass._inst;
    this._listeners = new Set();
    this.events = new EventEmitter();
    this._isRunning = false;
    BackgroundLocationRepositoryClass._inst = this;
  }

  addListener(fn) { this._listeners.add(fn); }
  removeListener(fn) { this._listeners.delete(fn); }

  async start() {
    if (this._isRunning) return;
    // configure plugin (these defaults are safe; tune as needed)
    BackgroundGeolocation.ready({
      desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
      distanceFilter: 5,
      stopOnTerminate: false,
      startOnBoot: false,
      enableHeadless: true,
      foregroundService: true,
      notification: {
        title: 'Tracking Active',
        text: 'Background location tracking running',
      },
    }, async (state) => {
      // start tracking
      await TripTempStorage.saveBackgroundTrackingState(true);
      this._isRunning = true;
      BackgroundGeolocation.start();
    });

    // listen to location events
    BackgroundGeolocation.on('location', async (location) => {
      const point = new TripPoint({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        timestamp: (new Date(location.timestamp)).toISOString(),
        accuracy: location.coords.accuracy,
        speed: location.coords.speed,
      });

      // write to temp storage
      await TripTempStorage.addPoint(point);

      // notify UI listeners
      this._listeners.forEach((l) => {
        try { l({ lat: point.lat, lng: point.lng }); } catch(e) {}
      });
      this.events.emit('point', point);

      // finish if required by plugin
      BackgroundGeolocation.finish(location.taskId);
    });

    BackgroundGeolocation.on('stop', () => {
      this._isRunning = false;
    });

    BackgroundGeolocation.on('error', (err) => {
      console.warn('BG geolocation error', err);
    });
  }

  async stop() {
    if (!this._isRunning) return;
    await TripTempStorage.saveBackgroundTrackingState(false);
    BackgroundGeolocation.stop();
    this._isRunning = false;
  }

  get isRunning() { return this._isRunning; }
}

const BackgroundLocationRepository = new BackgroundLocationRepositoryClass();
export default BackgroundLocationRepository;