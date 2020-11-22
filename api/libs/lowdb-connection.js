/**
 * Lowdb is a simple database that uses JSON file
 * we mainly use it to set simple config values
 */

const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('lowdb.json')
const db = low(adapter)

// Set some defaults (required if your JSON file is empty)
db.defaults({
	OSOUL: [],
	Istethmar: [],
	Aman: [],
	Hemaya: [],
	Thabat: [],
	'Misr ElMostakbal': [],
	Takamol: [],
}).write()

module.exports = {
  lowdb: db
}