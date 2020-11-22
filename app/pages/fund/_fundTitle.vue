<template>
	<div>
		<h1 class="text-center">Fund - {{fundTitle}}</h1>
    <div class="back-icon">
      <v-icon @click="goBack">mdi-arrow-left</v-icon>
    </div>

    <div class="text-center">
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
        :class="period === 'All' ? 'primary' : ''"
        @click="pickPeriod('All')"
      >All</v-chip>
    </div>
		<Chart :data="barChartData" :options="barChartOptions" :height="150" />
	</div>
</template>

<script>

export default {
	data() {
    return {
      period: '3M',
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
    }
  },
  created () {
    const { fundTitle } = this.$route.params
    this.fundTitle = fundTitle
    this.funds = this.$store.state.funds[fundTitle]

    this.updatePeriod()
  },
	methods: {
		goBack () {
			this.$router.push('/')
    },
    pickPeriod (period) {
      this.period = period
      this.updatePeriod()
    },
    updatePeriod () {
      const { period } = this
      let periodInMs = 0

      switch (period) {
        case '5D':
          periodInMs = 5 * 24 * 60 * 60 * 1000
          break
        case '1M':
          periodInMs = 30 * 24 * 60 * 60 * 1000
          break
        case '3M':
          periodInMs = 90 * 24 * 60 * 60 * 1000
          break
        case '6M':
          periodInMs = 180 * 24 * 60 * 60 * 1000
          break
        case '1Y':
          periodInMs = 364 * 24 * 60 * 60 * 1000
          break
        case 'All':
          periodInMs = Date.now()
          break
      }

      const timeDiff = Date.now() - periodInMs
      const filteredFunds = this.funds.filter(fund => fund.timestamp > timeDiff)
      const prices = filteredFunds.map(fund => fund.price)
      const isPositive = prices[0] <= prices.slice(-1)[0]
      this.barChartData.labels = filteredFunds.map(fund => fund.date)
      this.barChartData.datasets[0] = {
        label: 'Net Asset',
        data: prices,
        backgroundColor: isPositive ? '#4caf50' : '#f44336'
      }

    }
	},
}
</script>

<style scoped>
.back-icon {
	position: absolute;
	top: 25px;
	left: 25px;
}
</style>