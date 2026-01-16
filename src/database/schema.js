import SQLite from 'react-native-sqlite-storage';
SQLite.enablePromise(true);

export const getDBConnection = async () => {
  return SQLite.openDatabase({ name: 'trips.db', location: 'default' });
};

export const createTables = async (db) => {
  const query = `
    CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      duration REAL,
      distance REAL,
      points TEXT
    );
  `;
  await db.executeSql(query);
};
