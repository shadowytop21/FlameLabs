const Keyv = require('keyv');
const db = new Keyv('sqlite://hydrapanel.db');

module.exports = { db }