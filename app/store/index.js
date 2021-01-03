export const state = () => ({
  funds: {},
  fundsTable: []
})

export const mutations = {
  setFunds (state, value) {
    state.funds = value
  },
  setFundsTable (state, value) {
    state.fundsTable = value
  }
}

const formatFundsTable = funds => {
  let data = []

  for (let fundTitle in funds) {
    const fund = funds[fundTitle]
    const fundClone = [...fund]
    const count = fundClone.length
    const { date, price } = fundClone.splice(-1)[0]
    const { price: prevPrice } = fundClone.splice(-1)[0] || {} 
    const priceDiff = Math.round((price - prevPrice) * 100) / 100
    const percDiff = Math.round((price / prevPrice - 1) * 100 * 100) / 100
    
    data.push({
      name: fundTitle,
      date,
      price,
      priceDiff,
      percDiff,
      count
    })
  }

  return data
}

export const actions = {
  async getFunds ({ commit }) {
		const { data } = await this.$axios('/funds')

		commit('setFunds', data)
		commit('setFundsTable', formatFundsTable(data))
  },
  async nuxtServerInit ({ dispatch }) {
    await dispatch('getFunds')
  }
}