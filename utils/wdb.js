import fs from 'fs';
import path from 'path';
const DB_PATH = './reliability.json';

function initializeDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      console.log(`Creating file: ${DB_PATH}`);
      fs.writeFileSync(DB_PATH, JSON.stringify({}, null, 2));
    }
  } catch (error) {
    console.error('Error initializing DB:', error);
    throw error;
  }
}

export function loadDB() {
  initializeDB();
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading DB:', error);
    return {};
  }
}

export function saveDB(data) {
  initializeDB();
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    console.log('Saved DB:', DB_PATH);
  } catch (error) {
    console.error('Error saving DB:', error);
    throw error;
  }
}

export function getUserData(guildId, userId) {
  const db = loadDB();
  const key = `${guildId}_${userId}`;
  if (!db[key]) {
    db[key] = {
      guildId,
      userId,
      point: 0
    };
    saveDB(db);
  }
  return db[key];
}

export function updateUserData(guildId, userId, data) {
  const db = loadDB();
  const key = `${guildId}_${userId}`;
  db[key] = { ...db[key], ...data };
  saveDB(db);
}
