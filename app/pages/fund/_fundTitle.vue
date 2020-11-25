<template>
	<div>
		<h1 class="text-center">Fund - {{fundTitle}}</h1>
    <div class="back-icon">
      <v-icon @click="goBack">mdi-arrow-left</v-icon>
    </div>

    <div class="text-center mt-3">
      <v-chip
        :class="period === '5D' ? 'primary' : ''"
        @click="pickPeriod('5D')"
      >5D</v-chip>
      <v-chip
        :class="period === '1M' ? 'primary' : ''"
        @click="pickPeriod('1M')"
      >1M</v-chip>
      <v-chip
        :class="period === '3M' ? 'primary' : ''"
        @click="pickPeriod('3M')"
      >3M</v-chip>
      <v-chip
        :class="period === '6M' ? 'primary' : ''"
        @click="pickPeriod('6M')"
      >6M</v-chip>
      <v-chip
        :class="period === '1Y' ? 'primary' : ''"
        @click="pickPeriod('1Y')"
      >1Y</v-chip>
      <v-chip
        :class="period === '2Y' ? 'primary' : ''"
        @click="pickPeriod('2Y')"
      >2Y</v-chip>
      <v-chip
        :class="period === '3Y' ? 'primary' : ''"
        @click="pickPeriod('3Y')"
      >3Y</v-chip>
      <v-chip
        :class="period === '5Y' ? 'primary' : ''"
        @click="pickPeriod('5Y')"
      >5Y</v-chip>
      <v-chip
        :class="period === 'All' ? 'primary' : ''"
        @click="pickPeriod('All')"
      >All</v-chip>
    </div>
    <v-row style="max-width: 300px; margin: 10px auto" align="center" justify="center">
      <v-col>
        <v-dialog
          ref="startDateDialog"
          v-model="startDateDialog"
          :return-value.sync="startDate"
          persistent
          width="290px"
        >
          <template v-slot:activator="{ on, attrs }">
            <v-text-field
              v-model="startDate"
              label="Start date"
              prepend-icon="mdi-calendar"
              readonly
              v-bind="attrs"
              v-on="on"
               style="width: 125px"
            ></v-text-field>
          </template>
          <v-date-picker
            v-model="startDate"
            scrollable
          >
            <v-spacer></v-spacer>
            <v-btn
              text
              color="primary"
              @click="startDateDialog = false"
            >
              Cancel
            </v-btn>
            <v-btn
              text
              color="primary"
              @click="$refs.startDateDialog.save(startDate); pickPeriod('Custom')"
            >
              OK
            </v-btn>
          </v-date-picker>
        </v-dialog>
      </v-col>
      <v-col>
        <v-dialog
          ref="endDateDialog"
          v-model="endDateDialog"
          :return-value.sync="endDate"
          persistent
          width="290px"
        >
          <template v-slot:activator="{ on, attrs }">
            <v-text-field
              v-model="endDate"
              label="End date"
              prepend-icon="mdi-calendar"
              readonly
              v-bind="attrs"
              v-on="on"
               style="width: 125px"
            ></v-text-field>
          </template>
          <v-date-picker
            v-model="endDate"
            scrollable
          >
            <v-spacer></v-spacer>
            <v-btn
              text
              color="primary"
              @click="endDateDialog = false"
            >
              Cancel
            </v-btn>
            <v-btn
              text
              color="primary"
              @click="$refs.endDateDialog.save(endDate); pickPeriod('Custom')"
            >
              OK
            </v-btn>
          </v-date-picker>
        </v-dialog>
      </v-col>
    </v-row>
		<Chart :data="barChartData" :options="barChartOptions" :height="height" />

      <v-container>
        <v-row class="text-center">
          <v-col>
            Current: {{current}}
            <span
              v-if="!isNaN(priceDiff)"
              style="font-size: 14px;"
              :class="priceDiff < 0 ? 'red--text' : 'green--text'"
            >
              <v-icon size="16" class="mb-1" color="error" v-if="priceDiff < 0">mdi-arrow-down-thick</v-icon>
              <v-icon size="16" class="mb-1" color="success" v-else>mdi-arrow-up-thick</v-icon>
              {{priceDiff}}
              ({{percDiff}}%)
            </span>
          </v-col>
          <v-col>High: {{high}}</v-col>
          <v-col>Low: {{low}}</v-col>
        </v-row>
      </v-container>
    <section class="mt-2" style="font-size: 17px; font-weight: 500px">
    </section>
	</div>
</template>

<script>

export default {
	data() {
    return {
      period: '3M',
      startDateDialog: false,
      startDate: '',
      endDateDialog: false,
      endDate: '',
      funds: [],
      fundTitle: '',
      barChartData: {
        labels: [
        ],
        datasets: [
          {
            label: 'Net Asset',
            data: [],
            backgroundColor: '#aaa'
          },
        ]
      },
      barChartOptions: {
        responsive: true,
      },
      high: 0,
      low: 0,
      current: 0,
      priceDiff: 0,
      percDiff: 0,
    }
  },
  computed: {
    height () {
      if (process.client) {
        const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
        const vh = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
        
        return vw > 1350 
          ? 125
          : vw > 996 
            ? 150
            : vh - 100
      }
    }
  },
  created () {
    const { fundTitle } = this.$route.params
    this.fundTitle = fundTitle
    this.funds = this.$store.state.funds[fundTitle]

    this.setDates()
    this.updatePeriod()
  },
	methods: {
		goBack () {
			this.$router.push('/')
    },
    pickPeriod (period) {
      this.period = period
      
      if (period !== 'Custom') this.setDates()
      
      this.updatePeriod()
    },
    setDates () {
      const date = new Date()
      const number = this.period.replace(/[A-z]+/, '')
      const startDate = this.period.endsWith('D')
        ? this.$dateFns.subDays(date, number)
        : this.period.endsWith('M')
          ? this.$dateFns.subMonths(date, number)
          : this.period.endsWith('Y')
            ? this.$dateFns.subYears(date, number)
            : ''
      this.startDate = startDate ? this.$dateFns.format(startDate) : ''
      this.endDate = this.$dateFns.format(date)
    },
    updatePeriod () {
      const { period } = this
      let periodInMs = 0
      const day = 23 * 60 * 60 * 1000
      const [ sYear, sMonth, sDay ] = this.startDate.split('-')
      const startTimestamp = this.startDate
        ? this.$dateFns.getTime(new Date(sYear, sMonth - 1, sDay)) - day
        : 0
      const [ eYear, eMonth, eDay ] = this.endDate.split('-')
      const endTimestamp = this.$dateFns.getTime(new Date(eYear, eMonth - 1, eDay)) + day
      const filteredFunds = this.funds.filter(fund => fund.timestamp > startTimestamp && fund.timestamp <= endTimestamp)
      const prices = filteredFunds.map(fund => fund.price)
      const currentPrice = prices.slice(-1)[0]
      const isPositive = prices[0] <= currentPrice
      // Get high, low and current
      const sortedPrices = [...prices].sort()
      this.high = sortedPrices.slice(-1)[0]
      this.low = sortedPrices[0]
      this.current = currentPrice

      const firstPrice = prices[0]
      this.priceDiff = Math.round((currentPrice - firstPrice) * 100) / 100
      this.percDiff = Math.round((currentPrice / firstPrice - 1) * 100 * 100) / 100
      
      this.barChartData.labels = filteredFunds.map(fund => fund.date)
      this.barChartData.datasets[0] = {
        label: 'Net Asset',
        data: prices,
        backgroundColor: isPositive ? '#4caf50' : '#f44336'
      }
    }
  },
  head () {
    return {
      title: this.$route.params.fundTitle
    }
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