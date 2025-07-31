import fs from 'fs';
import path from 'path';
const DB_PATH = './currency.json';

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
      balance: 0,
      lastWork: 0,
      lastLottery: 0,
      lastSlot: 0,
      lastLife: 0,
      lastGive: 0
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

// Ranking
export function getGuildRanking(guildId) {
  const db = loadDB();
  return Object.values(db)
    .filter(user => user.guildId === guildId && user.userId)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 10);
}

// PanelDeta
export function getShopPanels(guildId, channelId) {
  const db = loadDB();
  if (!db.shops) db.shops = {};
  if (!db.shops[guildId]) db.shops[guildId] = {};
  if (!db.shops[guildId][channelId]) db.shops[guildId][channelId] = { panels: [] };
  return db.shops[guildId][channelId].panels;
}
export function addShopPanel(guildId, channelId, panelData) {
  const db = loadDB();
  if (!db.shops) db.shops = {};
  if (!db.shops[guildId]) db.shops[guildId] = {};
  if (!db.shops[guildId][channelId]) db.shops[guildId][channelId] = { panels: [] };
  db.shops[guildId][channelId].panels.push(panelData);
  saveDB(db);
}
export function removeShopPanel(guildId, channelId, messageId) {
  const db = loadDB();
  if (db.shops?.[guildId]?.[channelId]) {
    db.shops[guildId][channelId].panels = db.shops[guildId][channelId].panels.filter(
      panel => panel.messageId !== messageId
    );
    saveDB(db);
  }
}
