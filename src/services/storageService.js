import { getDBConnection, createTables } from '../database/schema';

export const saveTrip = async (trip) => {
  const db = await getDBConnection();
  await createTables(db);
  const insertQuery = `
    INSERT INTO trips (date, duration, distance, points)
    VALUES (?, ?, ?, ?);
  `;
  await db.executeSql(insertQuery, [
    trip.date,
    trip.duration,
    trip.distance,
    JSON.stringify(trip.points)
  ]);
};

export const getTrips = async () => {
  const db = await getDBConnection();
  const results = await db.executeSql('SELECT * FROM trips;');
  const rows = results[0].rows;
  const trips = [];
  for (let i = 0; i < rows.length; i++) {
    trips.push(rows.item(i));
  }
  return trips;
};

export const deleteTrip = async (tripId) => {
  const db = await getDBConnection();
  await db.executeSql('DELETE FROM trips WHERE id = ?;', [tripId]);
};
