import SQLite from 'react-native-sqlite-storage';

const db = SQLite.openDatabase({ name: 'trips.db', location: 'default' }, () => {}, (e) => console.warn('db open err', e));

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000.0;
  const toRad = (v) => v * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default {
  init() {
    db.transaction(tx => {
      tx.executeSql(`CREATE TABLE IF NOT EXISTS trips (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT, points TEXT, duration INTEGER, distance REAL);`);
    });
  },

  async insertTripPointsWithMeta(points) {
    if (!points || points.length === 0) return;
    const pointsJson = JSON.stringify(points.map(p => p));
    const start = new Date(points[0].timestamp);
    const end = new Date(points[points.length - 1].timestamp);
    const duration = Math.floor((end - start) / 1000);
    let totalDistance = 0;
    for (let i = 1; i < points.length; i++) {
      totalDistance += haversine(points[i-1].lat, points[i-1].lng, points[i].lat, points[i].lng);
    }
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql('INSERT INTO trips (date, points, duration, distance) VALUES (?, ?, ?, ?)', [start.toISOString(), pointsJson, duration, totalDistance],
          (_, res) => resolve(res),
          (_, err) => { console.warn('insert err', err); reject(err); }
        );
      });
    });
  },

  async getTrips() {
    return new Promise((resolve) => {
      db.transaction(tx => {
        tx.executeSql('SELECT * FROM trips ORDER BY id DESC', [], (_, res) => {
          const rows = [];
          for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
          resolve(rows);
        });
      });
    });
  },

  async clearTrips() {
    return new Promise((resolve) => {
      db.transaction(tx => {
        tx.executeSql('DELETE FROM trips', [], () => resolve(), (_, e) => { console.warn(e); resolve(); });
      });
    });
  }
};