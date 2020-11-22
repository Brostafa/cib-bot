// Logger file
const { Signale } = require('signale')

const loggerOptions = {
	disabled: process.env.DISABLE_LOGGER === 'true' ? true : false,
	config: {
		// Display date MM/DD/YYYY
		displayDate: true,
		// Displays time HH:MM:SS
		displayTimestamp: true,
		// Displays icons (e.g: logger.info has an 'i', success has a checkmark,...etc)
		displayBadge: true,
		// Display filename for each logged line
		displayFilename: true
	}
}

const logger = new Signale(loggerOptions)

// Prefix API logger with [API]
logger.morganInfo = {
	write: (message) => {
		logger.info('[API]', message)
	}
}
logger.morganWarn = {
	write: (message) => {
		logger.warn('[API]', message)
	}
}
logger.morganError = {
	write: (message) => {
		logger.error('[API]', message)
	}
}

// supress debug messages  on production
logger.debug = process.env.NODE_ENV === 'production' ? () => {} : logger.debug

module.exports = logger
