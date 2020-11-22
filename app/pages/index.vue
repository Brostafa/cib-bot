<template>
  <div>
    <h1 class="text-center">CIB Funds</h1>
    
    <v-simple-table>
      <template v-slot:default>
        <thead>
          <tr>
            <th class="text-left">
              Name
            </th>
            <th class="text-left">
              Date
            </th>
            <th class="text-left">
              Net Asset (EGP)
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in funds"
            :key="item.name"
          >
            <td><NuxtLink :to="'/fund/' + item.name">{{ item.name }}</NuxtLink></td>
            <td>{{ item.date }}</td>
            <td>
              <span style="font-size: 18px;">{{ item.price }}</span>
              <span
                v-if="!isNaN(item.priceDiff)"
                style="font-size: 14px;"
                :class="item.priceDiff < 0 ? 'red--text' : 'green--text'"
              >
                <v-icon size="16" class="mb-1" color="error" v-if="item.priceDiff < 0">mdi-arrow-down-thick</v-icon>
                <v-icon size="16" class="mb-1" color="success" v-else>mdi-arrow-up-thick</v-icon>
                {{item.priceDiff}}
                ({{item.percDiff}}%)
              </span>
            </td>
          </tr>
        </tbody>
      </template>
    </v-simple-table>
    <v-btn class="mt-6 mb-2" color="info" @click="downloadData">Download Xsls</v-btn>
  </div>
</template>

<script>
export default {
  async asyncData ({ $axios, store }) {
    let funds = []

    for (let fundTitle in store.state.funds) {
      const fund = store.state.funds[fundTitle]
      const fundClone = [...fund]
      const { date, price } = fundClone.splice(-1)[0]
      const { price: prevPrice } = fundClone.splice(-1)[0] || {} 
      const priceDiff = Math.round((price - prevPrice) * 100) / 100
      const percDiff = Math.round((price / prevPrice - 1) * 100 * 100) / 100
      
      funds.push({
        name: fundTitle,
        date,
        price,
        priceDiff,
        percDiff
      })
    }

    return {
      funds
    }
  },
  methods: {
    downloadData () {
      window.open(`${this.$axios.defaults.baseURL}/cib_funds.xsls`)
    }
  },
  meta: {
    title: 'Home'
  }
}
</script>
