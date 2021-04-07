<template>
	<div class="text-center">
		<v-dialog
			ref="dialog"
			v-model="openDialog"
			:return-value.sync="dates"
			persistent
			width="290px"
		>
			<template v-slot:activator="{ on, attrs }">
				<v-text-field
					v-model="dateRange"
					label="Period (DD/MM)"
					prepend-icon="mdi-calendar"
					class="text-center mt-3"
					readonly
					v-bind="attrs"
					v-on="on"
					style="width: 175px; margin: 0 auto"
				></v-text-field>
			</template>
			<v-date-picker
				v-model="dates"
				range
			>
				<v-spacer></v-spacer>
				<v-btn
					text
					color="primary"
					@click="openDialog = false"
				>
					Cancel
				</v-btn>
				<v-btn
					text
					color="primary"
					@click="$refs.dialog.save(dates)"
				>
					OK
				</v-btn>
			</v-date-picker>
		</v-dialog>

		<p v-if="periodInDays">Days: {{periodInDays}}</p>
		<v-data-table
			:headers="headers"
			:items="items"
			class="elevation-1 text-left"
			disable-pagination
		>
       <template v-slot:[`item.profitLoss`]="{ item }">
				 <span
						v-if="!isNaN(item.profitLoss)"
						:class="getClass(item.profitLoss)"
					>{{item.profitLoss}}%</span>
			 </template>
       <template v-slot:[`item.actualYear`]="{ item }">
					<span
						v-if="!isNaN(item.actualYear)"
						:class="getClass(item.actualYear)"
					>{{item.actualYear}}%</span>
			 </template>
       <template v-slot:[`item.etaYear`]="{ item }">
					<span
						v-if="!isNaN(item.etaYear)"
						:class="getClass(item.etaYear)"
					>{{item.etaYear}}%</span>
			 </template>
		</v-data-table>
	</div>
</template>

<script>
export default {
	props: {
		funds: Array
	},
	data () {
		return {
			openDialog: false,
			dates: [],
			items: [],
			headers: [
				{
					text: 'Year',
					value: 'year'
				},
				{
					text: 'Period',
					value: 'period'
				},
				{
					text: 'Period P/L',
					value: 'profitLoss'
				},
				{
					text: 'Actual Year P/L',
					value: 'actualYear'
				},
				{
					text: 'ETA Year P/L',
					value: 'etaYear'
				},
			]
		}
	},

	computed: {
		dateRange () {
			const dates = this.sortDates(this.dates)
			
			return dates.map(({ str }) => {
				const [ _, month, day ] = str.split('-')

				return `${day}/${month}`
			}).join(' ~ ')
		},
		periodInDays () {
			if (this.dates.length < 2) return ''
			
			const dates = this.sortDates(this.dates)
			const currentYear = new Date().getFullYear()
			const [_, sMonth, sDay] = dates[0].str.split('-')
			const [__, eMonth, eDay] = dates[1].str.split('-')
			const timestamp1 = new Date(currentYear, Number(sMonth) - 1, sDay).getTime()
			const timestamp2 = new Date(currentYear, Number(eMonth) - 1, eDay).getTime()
			const msDiff = timestamp2 - timestamp1
			const days = msDiff / (1000 * 60 * 60 * 24)

			return days
		}
	},
	methods: {
		sortDates (dates) {
			return dates.map(date => {
				const [ year, month, day ] = date.split('-')
				
				return {
					str: date,
					timestamp: new Date(year, month - 1, day).getTime()
				}
			}).sort((a, b) => a.timestamp - b.timestamp)
		},
		getPercent (startDate, endDate) {
      const day = 23 * 60 * 60 * 1000
      const [ sYear, sMonth, sDay ] = startDate.split('-')
      const startTimestamp = startDate
        ? this.$dateFns.getTime(new Date(sYear, sMonth - 1, sDay)) - day
        : 0
      const [ eYear, eMonth, eDay ] = endDate.split('-')
      const endTimestamp = this.$dateFns.getTime(new Date(eYear, eMonth - 1, eDay)) + day
      const filteredFunds = this.funds.filter(fund => fund.timestamp > startTimestamp && fund.timestamp <= endTimestamp)
      const prices = filteredFunds.map(fund => fund.price)
      const currentPrice = prices.slice(-1)[0]

      const firstPrice = prices[0]
			const percDiff = Math.round((currentPrice / firstPrice - 1) * 100 * 100) / 100

      return {
				filteredFunds,
				percDiff
			}
		},
		getClass (val) {
			return val === 0 
				? ''
				: val > 0
					? 'green--text'
					: 'red--text'
		},
		getEtaYear (filteredFunds, profitLoss) {
			const firstPoint = filteredFunds[0]
			const lastPoint = filteredFunds.slice(-1)[0]
			
			if (!firstPoint || !lastPoint) return NaN

      const msDiff = lastPoint.timestamp - firstPoint.timestamp
      const days = Math.round(msDiff / (1000 * 60 * 60 * 24))
      let etaPerc = (profitLoss / days) * 360
      etaPerc =  Math.round(etaPerc * 100) / 100

      return etaPerc
    },
		updateTable () {
			if (!this.periodInDays) {
				this.items = []

				return
			}

			const dates = this.sortDates(this.dates)
			const [_, sMonth, sDay] = dates[0].str.split('-')
			const [__, eMonth, eDay] = dates[1].str.split('-')
			const firstYear = Number(this.funds[0].date.split('/')[2])
			const lastYear = Number(this.funds.slice(-1)[0].date.split('/')[2])
			const years = lastYear - firstYear

			this.items = Array(years + 1).fill().map((_, index) => {
				const currYear = firstYear + index
				const nextYear = currYear + 1
				const startDate = `${currYear}-${sMonth}-${sDay}`
				const endDate = `${currYear}-${eMonth}-${eDay}`

				const { percDiff: profitLoss, filteredFunds } = this.getPercent(startDate, endDate)

				const actualYearS = `${currYear}-01-01`
				const actualYearE = `${nextYear}-01-01`
				const { percDiff: actualYear } = this.getPercent(actualYearS, actualYearE)
				const etaYear = this.getEtaYear(filteredFunds, profitLoss)
				
				return {
					year: currYear,
					period: `${startDate} ~ ${endDate}`,
					profitLoss,
					actualYear,
					etaYear,
				}
			})

		}
	},
	watch: {
		periodInDays () {
			this.updateTable()
		}
	}
}
</script>	