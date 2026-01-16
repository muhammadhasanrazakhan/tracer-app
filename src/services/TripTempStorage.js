import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';

const POINTS_KEY = 'current_trip_points';
const BG_FLAG_KEY = 'bg_tracking_active';
const FILE_NAME = 'current_trip_points.json';

export class TripPoint {
  constructor({ lat, lng, timestamp, accuracy = null, speed = null }) {
    this.lat = lat;
    this.lng = lng;
    this.timestamp = timestamp || new Date().toISOString();
    this.accuracy = accuracy;
    this.speed = speed;
  }
  toJSON() {
    return {
      lat: this.lat,
      lng: this.lng,
      timestamp: this.timestamp,
      accuracy: this.accuracy,
      speed: this.speed,
    };
  }
  static fromJSON(o) {
    return new TripPoint({
      lat: o.lat,
      lng: o.lng,
      timestamp: o.timestamp,
      accuracy: o.accuracy,
      speed: o.speed,
    });
  }
}

let _isTripActive = true;

export default {
  // set active flag to prevent further writes after stop
  setTripActive(active) {
    _isTripActive = active;
  },

  async _isBackgroundMode() {
    // We determine background mode by the saved BG flag (set when started as ALWAYS)
    try {
      const val = await AsyncStorage.getItem(BG_FLAG_KEY);
      return val === 'true';
    } catch (e) {
      return false;
    }
  },

  async addPoint(point) {
    if (!_isTripActive) return;
    const isBg = await this._isBackgroundMode();
    const data = point.toJSON ? point.toJSON() : point;
    if (isBg) {
      // file write
      try {
        const path = `${RNFS.DocumentDirectoryPath}/${FILE_NAME}`;
        let existing = [];
        const exists = await RNFS.exists(path);
        if (exists) {
          const content = await RNFS.readFile(path, 'utf8');
          existing = content ? JSON.parse(content) : [];
        }
        existing.push(data);
        await RNFS.writeFile(path, JSON.stringify(existing), 'utf8');
      } catch (e) {
        console.warn('TripTempStorage BG write error', e);
      }
    } else {
      // AsyncStorage write
      try {
        const list = JSON.parse((await AsyncStorage.getItem(POINTS_KEY)) || '[]');
        list.push(data);
        await AsyncStorage.setItem(POINTS_KEY, JSON.stringify(list));
      } catch (e) {
        console.warn('TripTempStorage FG write error', e);
      }
    }
  },

  async getPoints() {
    try {
      const isBg = await this._isBackgroundMode();
      if (isBg) {
        const path = `${RNFS.DocumentDirectoryPath}/${FILE_NAME}`;
        const exists = await RNFS.exists(path);
        if (!exists) return [];
        const content = await RNFS.readFile(path, 'utf8');
        if (!content) return [];
        const arr = JSON.parse(content);
        return arr.map((o) => TripPoint.fromJSON(o));
      } else {
        const content = await AsyncStorage.getItem(POINTS_KEY);
        if (!content) return [];
        const arr = JSON.parse(content);
        return arr.map((o) => TripPoint.fromJSON(o));
      }
    } catch (e) {
      console.warn('TripTempStorage getPoints error', e);
      return [];
    }
  },

  async hasData() {
    try {
      const fg = await AsyncStorage.getItem(POINTS_KEY);
      if (fg && JSON.parse(fg).length > 0) return true;
      const path = `${RNFS.DocumentDirectoryPath}/${FILE_NAME}`;
      return await RNFS.exists(path);
    } catch (e) {
      return false;
    }
  },

  async clear() {
    try {
      await AsyncStorage.removeItem(POINTS_KEY);
      const path = `${RNFS.DocumentDirectoryPath}/${FILE_NAME}`;
      if (await RNFS.exists(path)) await RNFS.unlink(path);
    } catch (e) {
      console.warn('TripTempStorage clear error', e);
    }
  },

  async saveBackgroundTrackingState(isActive) {
    try {
      await AsyncStorage.setItem(BG_FLAG_KEY, isActive ? 'true' : 'false');
    } catch (e) {
      console.warn('saveBackgroundTrackingState error', e);
    }
  },

  async wasBackgroundTrackingActive() {
    try {
      const val = await AsyncStorage.getItem(BG_FLAG_KEY);
      return val === 'true';
    } catch (e) {
      return false;
    }
  },

  async clearBackgroundTrackingState() {
    try {
      await AsyncStorage.removeItem(BG_FLAG_KEY);
    } catch (e) {}
  },
};
