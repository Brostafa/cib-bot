<script>
import { Line } from 'vue-chartjs'

export default {
	extends: Line,
  props: ['data', 'options'],
  watch: {
    data: {
      deep: true,
      handler () {
        this.renderChart(this.data, this.options)
      }
    },
    options: {
      deep: true,
      handler () {
        this.renderChart(this.data, this.options)
      }
    },
  },
	mounted () {
    this.renderChart(this.data, this.options)
  }
}
</script>