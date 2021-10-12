const request = require('request-promise')
const path = require('path')
const { lowdb } = require('./lowdb-connection')
const logger = require('./logger')
const { uniqBy } = require('lodash')
const ExcelJS = require('exceljs')
const getProxies = require('get-free-https-proxy') 

const MAX_HTTP_RETRIES = 3

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

/**
 * Return a normalized response from CIB website
 * 
 * @returns {Promise<array>} [{ "FundCode": "OSOUL", "FundDate": "25/08/2021", "Nav": 500 }]
 * 
 */
const scrape = async () => {
	const response = await request.get('https://www.cibeg.com/api/fund/getfunds')

	const { fundNavList: { navList: json } } = JSON.parse(response)

	return json.map(entry => {
		const { fundCode, nav, navDate } = entry
		const year = String(navDate).substr(0, 4)
		const month = String(navDate).substr(4, 2)
		const day = String(navDate).substr(6, 2)
		
		const funds = {
			'2': 'OSOUL',
			'3': 'Istethmar',
			'4': 'Aman',
			'5': 'Hemaya',
			'6': 'Thabat',
			'7': 'Misr ElMostakbal',
			'8': 'Takamol',
		}
		
		return {
			FundCode: funds[fundCode],
			FundDate: `${day}/${month}/${year}`,
			Nav: nav
		}
	})
}

const startScraper = async () => {
	try {
		const json = await scrape()
		let dataChanged = false
	
		for (let value of json) {
			const { FundCode, FundDate, Nav } = value
			const dateIndex = lowdb.get(FundCode).findIndex({date: FundDate}).value
			const shouldSave = !dateIndex || dateIndex === -1
			const [ day, month, year ] = FundDate.split('/')

			if (shouldSave) {
				dataChanged = true
				logger.info(`[Scraper] Saving FundCode="${FundCode}" Date="${FundDate}" Price="${Nav}"`)
	
				lowdb
					.get(FundCode)
					.push({
						date: FundDate,
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

const makeRequest = async (url, proxies, _retry = 1) => {
	try {
		let proxy = null
		
		// if it wasn't last try then use proxy
		if (_retry !== MAX_HTTP_RETRIES) {
			const randomIndex = Math.floor(Math.random() * proxies.length)
			proxy = proxies[randomIndex]
		}

		const response = JSON.parse(await request(url, {
			headers: {
				'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.61 Safari/537.36',
				gzip: true,
				proxy,
				timeout: 7500
			}
		}))

		return response
	} catch (e) {
		if (_retry <= MAX_HTTP_RETRIES) {
			return makeRequest(url, proxies, _retry + 1)
		}

		throw e
	}
}

const fetchBloomberg = async (fundCode, proxies) => {
	const urls = [
		`https://www.bloomberg.com/markets2/api/history/${fundCode}/PX_LAST?timeframe=5_YEAR&period=daily&volumePeriod=daily`,
		`https://www.bloomberg.com/markets/api/bulk-time-series/price/${fundCode}?timeFrame=5_YEAR`,
	]

	const promises = urls.map(async url => {
		try {
			const [ response ] = await makeRequest(url, proxies)
			return response.price.map(a => ({
				dateTime: a.dateTime || a.date,
				value: a.value
			}))
		} catch (e) {
			logger.error(`[Fetch Bloomberg] url="${url}"`, e)
		}
	})

	const allPrices = (await Promise.all(promises)).flat()
	const uniquePrices = uniqBy(allPrices, 'dateTime')

	return uniquePrices
}

const scrapeBloomberg = async () => {
	const proxies = (await getProxies()).map(proxy => `http://${proxy.host}:${proxy.port}`)

	for (let fundName in BLOOMBERG_CODES) {
		const fundCode = BLOOMBERG_CODES[fundName]
		const prices = (await fetchBloomberg(fundCode, proxies)).map(priceData => {
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