'use strict'

module.exports = (function () {
  const rp = require('request-promise-native')
  const fs = require('fs')
  const prompt = require('prompt')
  const environment = require('./environment')
  const { table } = require('table')
  const CLISelect = require('list-selector-cli')

  const yesnoSchema = {
    name: 'yesno',
    message: 'are you sure?',
    validator: /y[es]*|n[o]?/,
    warning: 'Must respond yes or no',
    default: 'no'
  }

  const _yesnoPrompt = () => {
    return new Promise((resolve, reject) => {
      prompt.start()

      prompt.get(yesnoSchema, (err, result) => {
        if (err) return reject(err)
        resolve(result)
      })
    })
  }

  const _fmtProcessed = (val) => {
    let state

    switch (val) {
      case 0:
        state = 'Processing'
        break
      case 1:
        state = 'Complete'
        break
      case 2:
        state = 'Error'
        break
      default:
        state = 'Unknown'
        break
    }

    return state
  }

  const createPackage = async (baseUrl, appVersion, beVersion, feVersion) => {
    let token = await environment.getLoginToken()

    let options = {
      method: 'POST',
      uri: `${baseUrl}/packages`,
      json: true,
      body: {
        application_version: appVersion,
        be_version: beVersion,
        fe_version: feVersion
      },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }

    let newPkg = await rp(options)

    let data = []

    data.push([ 'Version', newPkg.application_version ])
    data.push([ 'Timestamp', newPkg.timestamp ])
    data.push([ 'BE Version', newPkg.be_version ])
    data.push([ 'FE Version', newPkg.fe_version ])

    console.log(table(data))
  }

  const listPackages = async (baseUrl, longFormat) => {
    let token = await environment.getLoginToken()

    let options = {
      method: 'GET',
      uri: `${baseUrl}/packages`,
      json: true,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }

    let packages = await rp(options)

    let data = []

    if (longFormat) {
      data.push([ 'User', 'Version', 'Timestamp', 'BE Version', 'FE Version', 'Processed', 'Created' ])

      for (let pkg of packages) {
        data.push([ pkg.email, pkg.application_version, pkg.build_timestamp, pkg.be_version, pkg.fe_version, _fmtProcessed(pkg.processed), pkg.createdAt ])
      }
    } else {
      data.push([ 'User', 'Version', 'Timestamp', 'Processed', 'Created' ])
      for (let pkg of packages) {
        data.push([ pkg.email, pkg.application_version, pkg.build_timestamp, _fmtProcessed(pkg.processed), pkg.createdAt ])
      }
    }

    console.log(table(data))
  }

  const _selectPackage = async (packages) => {
    let options = packages.map((pkg) => `${pkg.email}: ${pkg.application_version} - ${pkg.build_timestamp}`)

    let packageChoice = new CLISelect(options)

    console.log('Which package do you want to show?')

    let selection = await packageChoice.prompt()

    // if (selection.length !== 1) throw new Error('Selected too many!')

    // return options.findIndex((v) => v === selection[0])
    return selection.map((sel) => options.findIndex((o) => sel === o))
  }

  const showPackage = async (baseUrl, applicationVersion) => {
    let token = await environment.getLoginToken()

    let options = {
      method: 'GET',
      uri: `${baseUrl}/packages`,
      json: true,
      qs: {
        applicationVersion: applicationVersion
      },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }

    let packages = await rp(options)

    let pkg

    if (packages.length === 0) {
      console.log(`No package with version ${applicationVersion} found`)
      return
    } else if (packages.length > 1) {
      let selection = await _selectPackage(packages)
      if (selection.length !== 1) {
        console.error('Invalid selection')
        return
      }
      pkg = packages[selection[0]]
    } else {
      pkg = packages[0]
    }

    let data = []
    data.push([ 'User', pkg.email ])
    data.push([ 'Version', pkg.application_version ])
    data.push([ 'Timestamp', pkg.build_timestamp ])
    data.push([ 'BE Version', pkg.be_version ])
    data.push([ 'FE Version', pkg.fe_version ])
    data.push([ 'Status', pkg.processed.toString() ])
    data.push([ 'Error', (pkg.error_message) ? pkg.error_message.toString() : '' ])
    data.push([ 'Completed At', pkg.processingCompletedAt.toString() ])
    data.push([ 'Created At', pkg.createdAt.toString() ])

    console.log(table(data))

    if (pkg.stdout) {
      console.log('')
      console.log('stdout')
      console.log(pkg.stdout)
    }

    if (pkg.stderr) {
      console.log('')
      console.log('stderr')
      console.log(pkg.stderr)
    }
  }

  const removePackage = async (baseUrl, applicationVersion, forceRemove) => {
    let token = await environment.getLoginToken()

    let options = {
      method: 'GET',
      uri: `${baseUrl}/packages`,
      json: true,
      qs: {
        applicationVersion: applicationVersion
      },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }

    let packages = await rp(options)

    let selectedPkgs = []

    if (packages.length === 0) {
      console.log(`No package with version ${applicationVersion} found`)
      return
    } else {
      let selection = await _selectPackage(packages)
      selectedPkgs = selection.map((s) => packages[s])
    }

    let deletePackages = false
    if (forceRemove) {
      deletePackages = true
    } else {
      let response = await _yesnoPrompt()
      deletePackages = response.yesno === 'yes'
    }

    if (!deletePackages) {
      return
    }

    console.log('Delete package(s)')

    for (let pkg of selectedPkgs) {
      let options = {
        method: 'DELETE',
        uri: `${baseUrl}/packages/${pkg.id}`,
        json: true,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }

      await rp(options)

      let data = []
      data.push([ 'User', pkg.email ])
      data.push([ 'Version', pkg.application_version ])
      data.push([ 'Timestamp', pkg.build_timestamp ])
      data.push([ 'BE Version', pkg.be_version ])
      data.push([ 'FE Version', pkg.fe_version ])
      data.push([ 'Status', pkg.processed.toString() ])
      data.push([ 'Error', (pkg.error_message) ? pkg.error_message.toString() : '' ])
      data.push([ 'Completed At', pkg.processingCompletedAt.toString() ])
      data.push([ 'Created At', pkg.createdAt.toString() ])

      console.log(table(data))
    }
  }

  const _downloadFile = (options, outputFile) => {
    return new Promise((resolve, reject) => {
      rp(options)
        .on('response', (response) => {
          console.log('Got response from server')
          resolve()
        })
        .on('error', (err) => {
          reject(err)
        })
        .pipe(fs.createWriteStream(outputFile))
    })
  }

  const downloadPackage = async (baseUrl, applicationVersion, outputFile) => {
    let token = await environment.getLoginToken()

    let options = {
      method: 'GET',
      uri: `${baseUrl}/packages`,
      json: true,
      qs: {
        applicationVersion: applicationVersion
      },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }

    let packages = await rp(options)

    let pkg

    if (packages.length === 0) {
      console.log(`No package with version ${applicationVersion} found`)
      return
    } else if (packages.length > 1) {
      let selection = await _selectPackage(packages)
      if (selection.length !== 1) {
        console.error('Invalid selection')
        return
      }
      pkg = packages[selection[0]]
    } else {
      pkg = packages[0]
    }

    options = {
      method: 'GET',
      uri: `${baseUrl}/packages/${pkg.id}/download`,
      qs: {
        applicationVersion: applicationVersion
      },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }

    await _downloadFile(options, outputFile)

    console.log('Complete')
  }

  var mod = {
    createPackage: createPackage,
    downloadPackage: downloadPackage,
    listPackages: listPackages,
    removePackage: removePackage,
    showPackage: showPackage
  }

  return mod
}())
