#!/usr/bin/env node
'use strict'

const program = require('commander')
const sessionCtx = require('../lib/session-context')
const userCtx = require('../lib/user-context')
const packageCtx = require('../lib/package-context')

const vaultBuildHost = 'localhost'
const vaultBuildPort = '3000'

const baseUrl = (secure, host, port) => {
  let protocol = secure ? 'https' : 'http'

  return `${protocol}://${host}:${port}`
}

program
  .version('0.1.0')
  .option('-h --host <host>', `Specify the host of the vault-buildserver (default '${vaultBuildHost}'`, vaultBuildHost)
  .option('-p --port <port>', `Specify the port of the vault-build server (default ${vaultBuildPort}`, vaultBuildPort)
  .option('-s --secure', 'Specify the secure protocol (https)')
  .option('-v --verbose', 'Be noisy')

program
  .command('login')
  .alias('l')
  .action((cmd) => {
    sessionCtx.login(baseUrl(program.secure, program.host, program.port))
      .catch((err) => {
        console.error(err.message)
        if (program.verbose) console.error(err)
        process.exit(1)
      })
  })

program
  .command('logout')
  .action((cmd) => {
    sessionCtx.logout(baseUrl(program.secure, program.host, program.port))
      .catch((err) => {
        console.error(err.message)
        if (program.verbose) console.error(err)
        process.exit(1)
      })
  })

program
  .command('list-users')
  .alias('lu')
  .action((cmd) => {
    userCtx.listUsers(baseUrl(program.secure, program.host, program.port))
      .catch((err) => {
        console.error(err.message)
        if (program.verbose) console.error(err)
        process.exit(1)
      })
  })

program
  .command('create-user <email>')
  .alias('cu')
  .option('-n --name <name>', 'Enter the name of the user')
  .option('-a --admin', 'User is admin user')
  .option('-r --reporter', 'User is report user')
  .option('-d --deployer', 'User is a deployer')
  .action((email, cmd) => {
    let role
    if (cmd.admin) {
      role = 'admin'
    } else if (cmd.reporter) {
      role = 'reporter'
    } else if (cmd.deployer) {
      role = 'deployer'
    }

    if (!role) {
      console.error('Must specify a role type')
      process.exit(1)
    }

    if (!cmd.name) {
      console.error('Must specify a name')
      process.exit(1)
    }

    userCtx.createUser(
      baseUrl(program.secure, program.host, program.port),
      email,
      cmd.name,
      role)
      .catch((err) => {
        console.error(err.message)
        if (program.verbose) console.error(err)
        process.exit(1)
      })
  })

program
  .command('complete-registration <token>')
  .alias('cr')
  .action((token, cmd) => {
    userCtx.completeRegistration(
      baseUrl(program.secure, program.host, program.port),
      token)
      .catch((err) => {
        console.error(err.message)
        if (program.verbose) console.error(err)
        process.exit(1)
      })
  })

program
  .command('enable-user <email>')
  .alias('eu')
  .option('-e --enable', 'Enable the specified user')
  .option('-d --disable', 'Disable the specified user')
  .action((email, cmd) => {
    let enable = true
    if (cmd.enable) enable = true
    if (cmd.disable) enable = false
    userCtx.enableUser(
      baseUrl(program.secure, program.host, program.port),
      email,
      enable)
      .catch((err) => {
        console.error(err.message)
        if (program.verbose) console.error(err)
        process.exit(1)
      })
  })

program
  .command('remove-user <email>')
  .alias('ru')
  .option('-f --force', `Don't ask if sure.`)
  .action((email, cmd) => {
    userCtx.removeUser(
      baseUrl(program.secure, program.host, program.port),
      email,
      cmd.force)
      .catch((err) => {
        console.error(err.message)
        if (program.verbose) console.error(err)
        process.exit(1)
      })
  })

program
  .command('list-packages')
  .alias('lp')
  .option('-l --long', 'Print long form of packages')
  .action((cmd) => {
    packageCtx.listPackages(
      baseUrl(program.secure, program.host, program.port),
      cmd.long)
      .catch((err) => {
        console.error(err.message)
        if (program.verbose) console.error(err)
        process.exit(1)
      })
  })

program
  .command('create-package <app-version>')
  .alias('cp')
  .option('-b --back-end-version <back-end-version>', 'Specify the back-end version (default app-version)')
  .option('-f --front-end-version <front-end-version', 'Specify the front-end versino (default app-version)')
  .action((appVersion, cmd) => {
    packageCtx.createPackage(
      baseUrl(program.secure, program.host, program.port),
      appVersion,
      cmd.backEndVersion,
      cmd.frontEndVersion)
      .catch((err) => {
        console.error(err.message)
        if (program.verbose) console.error(err)
        process.exit(1)
      })
  })

program
  .command('show-package <application-version>')
  .alias('sp')
  .action((applicationVersion, cmd) => {
    packageCtx.showPackage(
      baseUrl(program.secure, program.host, program.port),
      applicationVersion)
      .catch((err) => {
        console.error(err.message)
        if (program.verbose) console.error(err)
        process.exit(1)
      })
  })

program
  .command('remove-package <application-version>')
  .alias('rp')
  .option('-f --force', "Don't ask.")
  .action((applicationVersion, cmd) => {
    packageCtx.removePackage(
      baseUrl(program.secure, program.host, program.port),
      applicationVersion,
      cmd.force)
      .catch((err) => {
        console.error(err.message)
        if (program.verbose) console.error(err)
        process.exit(1)
      })
  })

program
  .command('download-package <application-version>')
  .alias('dp')
  .option('-o --output-file <output-file>', 'Specify the path to download to')
  .action((applicationVersion, cmd) => {
    if (!cmd.outputFile) {
      console.error('Must specify an output file')
      process.exit(1)
    }
    packageCtx.downloadPackage(
      baseUrl(program.secure, program.host, program.port),
      applicationVersion,
      cmd.outputFile)
      .catch((err) => {
        console.error(err.message)
        if (program.verbose) console.error(err)
        process.exit(1)
      })
  })

program.parse(process.argv)
