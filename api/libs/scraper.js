const request = require('request-promise')
const path = require('path')
const { lowdb } = require('./lowdb-connection')
const logger = require('./logger')
const ExcelJS = require('exceljs')

const saveExcel = async () => {
	const workbook = new ExcelJS.Workbook();
	const filename = 'cib_funds.xsls'
	const filepath = path.join(__dirname, '..', 'public', filename)
	workbook.created = new Date(2020, 8, 30);
	workbook.modified = new Date();
	workbook.lastPrinted = new Date(2016, 9, 27);

	const data = lowdb.value()

	for (let fundTitle in data) {
		const rows = data[fundTitle]
		const worksheet = workbook.addWorksheet(fundTitle)

		worksheet.columns = [
			{ header: 'Date', key: 'date', width: 20 },
			{ header: 'Net Assest', key: 'price', width: 20 },
		]

		await worksheet.addRows(rows)
	}

	await workbook.xlsx.writeFile(filepath)

	logger.info(`[Xsls] created spreadsheet`)
}

const scrape = async () => {
	const response = await request.post('https://www.cibeg.com/_layouts/15/LINKDev.CIB.CurrenciesFunds/FundsCurrencies.aspx/GetFunds', {
		json: {
			lang: 'en'
		}
	})

	return response.d
}

const startScraper = async () => {
	try {
		const json = await scrape()
		let dataChanged = false
	
		for (let value of json) {
			const { FundTitle, FundCode, Nav } = value
			const lastRow = lowdb.get(FundTitle).takeRight(1).value()[0]
			const shouldSave = !lastRow || lastRow.date !== FundCode
			const [ day, month, year ] = FundCode.split('/')

			if (shouldSave) {
				dataChanged = true
				logger.info(`[Scraper] Saving FundTitle="${FundTitle}" Date="${FundCode}" Price="${Nav}"`)
	
				lowdb
					.get(FundTitle)
					.push({
						date: FundCode,
						timestamp: new Date(year, month - 1, day).getTime(),
						price: Nav,
						scrapedAt: Date.now()
					})
					.write()
			}
		}

		if (dataChanged) {
			saveExcel()
		}
	} catch (e) {
		logger.error(`[Scraper]`, e)
	}
}

module.exports = {
	startScraper
}