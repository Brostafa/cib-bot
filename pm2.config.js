module.exports = {
  apps : [
    {
      name: `cib-backend`,
      script: 'index.js',
      cwd: 'api',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      args: ['--colors']
    },
    {
      name: `cib-frontend`,
      script: 'yarn',
      args: ['start', '--colors'],
      cwd: 'app',
      env: {
        NODE_ENV: 'production',
        NUXT_PORT: 3000
      },
    }
  ]
}