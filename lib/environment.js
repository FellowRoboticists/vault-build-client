'use strict'

module.exports = (function () {
  const path = require('path')
  const fs = require('fs-extra')
  const tokenFile = path.join(`${process.env['HOME']}`, '.vault-build-token')

  const isLoggedIn = async () => {
    return fs.pathExists(tokenFile)
  }

  const getLoginToken = async () => {
    if (!await isLoggedIn()) throw new Error('You are not logged in')

    let tokenData = await fs.readJson(tokenFile)

    return tokenData.token
  }

  var mod = {
    getLoginToken: getLoginToken,
    isLoggedIn: isLoggedIn,
    tokenFile: tokenFile
  }

  return mod
}())
