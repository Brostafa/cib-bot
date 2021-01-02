const express = require('express')
const app = express()
const cors = require('cors')
const compression = require('compression')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const { getFunds, getExcel } = require('./libs/api')
const { startScraper } = require('./libs/scraper')
const logger = require('./libs/logger')
const { scheduleJob } = require('node-schedule')

const PORT = process.env.PORT || 8080
const morganFormat = `:remote-addr - :remote-user :method :url :status :res[content-length] :referrer :user-agent`

// Warn about status code that are within 400 < statusCode < 499
app.use(morgan(morganFormat, {
	skip: (req, res) => res.statusCode < 400 || res.statusCode > 499,
	stream: logger.morganWarn,
}))

// Error about status code > 500
app.use(morgan(morganFormat, {
	skip: (req, res) => res.statusCode < 500,
	stream: logger.morganError,
}))

// if in development mode then log statusCode < 400
if (process.env.NODE_ENV === 'development') {
	app.use(morgan(morganFormat, {
		skip: (req, res) => res.statusCode > 400,
		stream: logger.morganInfo
	}))
}

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(compression())
app.use(cors())
app.get('/funds', getFunds)
app.get('/excel', getExcel)
app.use(express.static('public'))

app.listen(PORT, () => logger.success(`[Server] started on port ${PORT}`))

scheduleJob('* 0 * * * *', startScraper)
startScraper()