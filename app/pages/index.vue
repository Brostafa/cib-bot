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
              Total Dates
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
            <td>{{ item.count }}</td>
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
    <section class="mt-6">
      <NuxtLink to="/yoy">
        <v-btn class="mr-2 mb-2" color="info">Year over Year</v-btn>
      </NuxtLink>
      <v-btn class="mr-2 mb-2" color="info" @click="downloadData">Download Xsls</v-btn>
      <v-btn
        class="mb-2"
        color="info"
        @click="updateBloomberg"
        :loading="upadtingBloomberg"
        :disabled="true || upadtingBloomberg"
      >Update From Bloomberg</v-btn>
    </section>

    <v-snackbar
      v-model="snackbar.isOpen"
      :color="snackbar.color"
      timeout="-1"
    >
      {{ snackbar.text }}

       <template v-slot:action="{ attrs }">
        <v-btn
          color="white"
          text
          v-bind="attrs"
          @click="snackbar.isOpen = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script>
export default {
  data () {
    return {
      upadtingBloomberg: false,
      snackbar: {
        isOpen: false,
        color: '',
        text: ''
      }
    }
  },
  computed: {
    funds () {
      return this.$store.state.fundsTable 
    }
  },
  methods: {
    downloadData () {
      window.open(`${this.$axios.defaults.baseURL}/cib_funds.xsls`)
    },
    async updateBloomberg () {
      this.upadtingBloomberg = true
      
      try {
        await this.$axios.post('/update', {
          source: 'bloomberg'
        })

        await this.$store.dispatch('getFunds')
        
        this.snackbar = {
          isOpen: true,
          color: 'success',
          text: 'Successfully updated funds from Bloomberg'
        }
      } catch (e) {
        console.error('[Update Bloomberg]', e)
        this.snackbar = {
          isOpen: true,
          color: 'red',
          text: 'Failed to update funds from Bloomberg - ' + e.message + ' - ' + e.response?.data?.error
        }
      }

      this.upadtingBloomberg = false
    }
  },
  head: {
    title: 'Home'
  }
}
</script>
