const { lowdb: db } = require('./lowdb-connection')

const getFunds = async (req, res) => {
	try {
		res.send(db.value())
	} catch (e) {
		// logger.error(``)
		res.status(500).send({
			error: 'An error has occurred' + e.message
		})
	}
}

const getExcel = async (req, res) => {
	try {

	} catch (e) {

	}
}

module.exports = {
	getFunds,
	getExcel
}