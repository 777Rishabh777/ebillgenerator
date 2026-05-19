const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');

function readJson(filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) return [];
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

function writeJson(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function appendJson(filename, entry) {
  const arr = readJson(filename);
  arr.push(entry);
  writeJson(filename, arr);
}

function readObjectJson(filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

module.exports = {
  readJson,
  writeJson,
  appendJson,
  readObjectJson,
};
