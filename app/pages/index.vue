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
            <td>{{ item.price }}</td>
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
      const { date, price } = fund.slice(-1)[0]
      
      funds.push({
        name: fundTitle,
        date,
        price
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
  }
}
</script>
