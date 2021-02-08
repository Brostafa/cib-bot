<template>
	<div>
		<h1 class="text-center">Year over Year</h1>
		<div class="back-icon">
      <v-icon @click="$router.push('/')">mdi-arrow-left</v-icon>
    </div>
    <v-simple-table>
      <template v-slot:default>
        <thead>
					<tr>
						<th
							class="text-left"
							v-for="item in funds"
							:key="item.name"
						>
							{{ item.name }}
						</th>
					</tr>
        </thead>
        <tbody>
          <tr
            v-for="item in years"
            :key="item.year"
          >
            <td>{{ item.year }}</td>
            <td
							v-for="(percent, index) in item.percents"
							:key="index"
						>
              <span
                v-if="!isNaN(percent)"
                style="font-size: 14px;"
                :class="percent < 0 ? 'red--text' : 'green--text'"
              >
							{{ percent }}%
              </span>
            </td>

          </tr>
        </tbody>
      </template>
    </v-simple-table>
		<v-divider></v-divider>
		<v-card class="mt-5">
			<v-card-title>Investment Calculator</v-card-title>
			<v-card-text style="color: black">
				<v-row>
					<v-col>
						<v-text-field
							v-model="principle"
							@keyup="handlePrinciple"
							label="Principle"
						></v-text-field>
					</v-col>
					<v-col>
						<v-select
							v-model="fundName"
							:items="$store.state.fundTitles"
							label="Fund Name"
							outlined
						></v-select>
					</v-col>
					<v-col>
						<v-select
							v-model="startYear"
							:items="availableYears"
							label="Starting Year"
							outlined
						></v-select>
					</v-col>
					<v-col>
						<v-select
							v-model="endYear"
							:items="availableYears"
							label="Ending Year"
							outlined
						></v-select>
					</v-col>
				</v-row>
				<p>You may notice different percentage than if you were to calculate them by hand. This comes from missing some data points that may throw it off by +/- 2%</p>
				
				<v-row class="font-weight-bold">
					<v-col>Start Principle: {{ principle }}</v-col>
					<v-col>End Principle: {{ calc.endPrinciple }}</v-col>
					<v-col>Total Profits: {{ calc.profit }} ({{ calc.profitPerc }}%)</v-col>
				</v-row>
				<p>Period: {{ calc.firstPoint.date }} - {{ calc.lastPoint.date }} (Includes actual first price and last price found)</p>
				<p>Purchase at: {{ calc.firstPoint.price }} EGP</p>
				<p>Sell at: {{ calc.lastPoint.price }} EGP</p>
				<p>Sell difference: {{ calc.priceDiff }} EGP</p>
			</v-card-text>
		</v-card>
	</div>
</template>

<script>
export default {
	data: () => {
		const startYear = 2015
		const endYear = new Date().getFullYear()
		const availableYears = Array(endYear - startYear + 1).fill().map((_, i) => i + startYear)
		
		return {
			year: 2015,
			fundName: 'OSOUL',
			principle: '100,000',
			startYear,
			endYear,
			availableYears,
		}
	},
	computed: {
    funds () {
			// make first cell empty
			const fundTitles = [{}, ...this.$store.state.fundsTable ]

      return fundTitles
		},
		calc () {
			const {
				priceDiff,
				percDiff,
				firstPoint = {},
				lastPoint = {}
			} = this.getDiff({
				startYear: this.startYear,
				endYear: this.endYear,
				fundTitle: this.fundName,
			})

			const princNum = Number(this.principle.replace(/\D/g, ''))
			const profit = Math.ceil(princNum * percDiff / 100)
			const endPrinciple = princNum + profit

			return {
				endPrinciple: this.addComma(endPrinciple),
				profit: this.addComma(profit),
				profitPerc: percDiff,
				priceDiff,
				firstPoint,
				lastPoint
			}
		},
		years () {
			const currentYear = new Date().getFullYear()
			const data = Array(currentYear - this.year + 1).fill().map((val, i) => {
				const year = this.year + i
				const percents = this.getPercents(year)
				
				return {
					year,
					percents
				}
			})


			return data
		}
	},
	methods: {
		handlePrinciple (e) {
			const price = e.target.value.replace(/\D/g, '')

			this.principle = this.addComma(price)
		},
		getDiff ({ startYear, endYear, fundTitle }) {
			const dayMs = 23 * 60 * 60 * 1000
			const startTimestamp = new Date(startYear, 0, 1).getTime() - (dayMs * 2)
			const endTimestamp = new Date(endYear, 0, 1).getTime() + (dayMs * 2)

			const fundPrices = this.$store.state.funds[fundTitle]
			const filteredFunds = fundPrices.filter(val => val.timestamp > startTimestamp && val.timestamp <= endTimestamp)
			const prices = filteredFunds.map(fund => fund.price)
			const currentPrice = prices.slice(-1)[0]
			const firstPrice = prices[0]
			const priceDiff = Math.round((currentPrice - firstPrice) * 100) / 100
			const percDiff = Math.round((currentPrice / firstPrice - 1) * 100 * 100) / 100

			return {
				priceDiff,
				percDiff,
				firstPoint: filteredFunds[0],
				lastPoint: filteredFunds.slice(-1)[0]
			}
		},
		addComma (num) {
			return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
		},
		getPercents (startYear) {
			const endYear = startYear + 1 
			const percents = []

			for (let fund of this.funds) {
				if (!fund.name) continue

				const { percDiff } = this.getDiff({
					startYear,
					endYear: startYear + 1,
					fundTitle:
					fund.name
				})

				percents.push(percDiff)
			}

			return percents
		},
	}
}
</script>

<style scoped>
.back-icon {
	position: absolute;
	top: 25px;
	left: 25px;
}
</style>