export const state = () => ({
  funds: {}
})

export const mutations = {
  setFunds(state, value) {
    state.funds = value
  }
}

export const actions = {
  async nuxtServerInit ({ commit }, { $axios }) {
		const { data } = await $axios('/funds')

		commit('setFunds', data)
  }
}