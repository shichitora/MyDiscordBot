import { Events, PermissionsBitField, EmbedBuilder } from 'discord.js';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
const reactionHistory = new Map();
const settingsPath = join(process.cwd(), 'settings.json');
const pointsPath = join(process.cwd(), 'points.json');

// MainHandler
// ここは非公開
