const request = require('request-promise')
const path = require('path')
const { lowdb } = require('./lowdb-connection')
const logger = require('./logger')
const ExcelJS = require('exceljs')

const BLOOMBERG_CODES = {
	OSOUL: 'CIBMMOS:EY',
	Istethmar: 'CIBSMAR:EY',
	Aman: 'CIBAMAN:EY',
	Hemaya: 'HAMAYAA:EY',
	Thabat: 'THABATT:EY',
	'Misr ElMostakbal': 'MISRALM:EY',
	Takamol: 'TAKAMOL:EY'
}

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

const fetchBloomberg = async fundCode => {
	const url = `https://www.bloomberg.com/markets2/api/history/${fundCode}/PX_LAST?timeframe=5_YEAR&period=daily&volumePeriod=daily`

	const [ data ] = JSON.parse(await request(url, {
		headers: {
			'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.61 Safari/537.36',
			gzip: true,
			'sec-fetch-dest': 'empty'
		}
	}))

	return data.price
}

const scrapeBloomberg = async () => {
	for (let fundName in BLOOMBERG_CODES) {
		const fundCode = BLOOMBERG_CODES[fundName]
		const prices = (await fetchBloomberg(fundCode)).map(priceData => {
			const [year, month, day] = priceData.dateTime.split('-')
			
			return {
				date: `${day}/${month}/${year}`,
				timestamp: new Date(year, month - 1, day).getTime(),
				price: priceData.value,
				scrapedAt: Date.now()
			}
		})
		
		const existingPrices = lowdb.get(fundName).value()
		const existingDates = existingPrices.map(r => r.date)
		const existingTimestamps = existingPrices.map(r => r.timestamp)
		const uniquePrices = prices.filter(priceData =>
			!existingTimestamps.includes(priceData.timestamp) &&
			!existingDates.includes(priceData.date)
		)

		logger.info(`[Scrape Bloomberg] fundName="${fundName}" fundCode="${fundCode}" bloombergPriceCount="${prices.length}" existingPriceCount="${existingPrices.length}" uniquePricesCount="${uniquePrices.length}"`)
		const allPrices = uniquePrices.concat(existingPrices).sort((a, b) => a.timestamp - b.timestamp)

		
		if (uniquePrices.length) {
			lowdb.set(fundName, allPrices).write()

			logger.success(`[Scrape Bloomberg] fundName="${fundName}" added ${uniquePrices.length} new dates. allDateCount="${allPrices.length}"`)
		}
	}
}

module.exports = {
	startScraper,
	scrapeBloomberg
}