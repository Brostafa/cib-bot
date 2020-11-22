// Automatically pull changes from git
// Every 30 seconds it will pull changes from git
// if it found that git returned a string that starts with 'Already up'
// then it means that our code is 'Already up-to date' and there's
// no new changes to be pulled
// If git returned something different than 'Already up' then it means
// we have pulled a new code and we should runYarn() and reloadPm2()

// Don't forget to also copy pm2.config.js

const exec = require('child_process').exec
const CHECK_EVERY = 30 * 1000 // 30 seconds

const execAsync = (command, logCommand = true) => new Promise((resolve, reject) => {
  exec(command, (error, stdout, stderr) => {
    if (logCommand) console.log(stdout, stderr, error)

    if (error) reject(stderr)
    
    resolve(stdout)
  })
})

const promiseDelay = (interval) => new Promise((r) => setTimeout(r, interval))
const pullChanges = () => execAsync('git pull -X theirs', false)
const runYarnBackend = () => execAsync('cd api && yarn install')
const runYarnFrontend = () => execAsync('cd app && yarn install && yarn build')
const reloadApp = () => execAsync('pm2 reload cib-frontend cib-backend --update-env')
const reloadAutodeploy = () => execAsync('pm2 reload cib-autodeploy')

const start = async () => {
  try {
    const pullData = await pullChanges()
    const hasNewCode = !pullData.startsWith('Already up')
    
    if (hasNewCode) {
      console.log('Found new code!')
      console.log(await runYarn())
      console.log(await runYarnBackend())
      console.log(await runYarnFrontend())
      console.log(await reloadApp())
      console.log(await reloadAutodeploy())
    }
  } catch (e) {
    console.error('[Auto Deploy] error with auto deploy script', e)
  }
  
  await promiseDelay(CHECK_EVERY)
  start()
}

start()
