const { lowdb: db } = require('./lowdb-connection')
const logger = require('./logger')
const { scrapeBloomberg } = require('./scraper')

const getFunds = async (req, res) => {
	try {
		res.send(db.value())
	} catch (e) {
		logger.error('[API] GET /funds', e)

		res.status(500).send({
			error: 'An error has occurred' + e.message
		})
	}
}

const updateData = async (req, res) => {
	const { source } = req.body
	
	try {
		if (source === 'bloomberg') {
			await scrapeBloomberg()
			
			res.send({
				data: true
			})

			return
		}

		res.status(422).send({
			error: `Invalid source="${source}"`
		})
	} catch (e) {
		logger.error('[API] POST /update', e)

		res.status(500).send({
			error: 'An error has occurred' + e.message
		})
	}
}

module.exports = {
	getFunds,
	updateData
}