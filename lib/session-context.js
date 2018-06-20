'use strict'

module.exports = (function () {
  const fs = require('fs-extra')
  const rp = require('request-promise-native')
  const prompt = require('prompt')
  const environment = require('./environment')

  const loginSchema = {
    properties: {
      email: {
        message: 'Email',
        required: true
      },
      password: {
        hidden: true,
        replace: '*',
        required: true
      }
    }
  }

  const _loginPrompt = () => {
    return new Promise((resolve, reject) => {
      prompt.start()

      prompt.get(loginSchema, (err, result) => {
        if (err) return reject(err)
        resolve(result)
      })
    })
  }

  const login = async (baseUrl) => {
    if (await environment.isLoggedIn()) throw new Error('You are already logged in')

    let loginData = await _loginPrompt()

    let options = {
      method: 'POST',
      uri: `${baseUrl}/sessions`,
      json: true,
      body: {
        email: loginData.email,
        password: loginData.password
      }
    }

    let response = await rp(options)

    return fs.outputJson(environment.tokenFile, response)
  }

  const logout = async (baseUrl) => {
    await fs.remove(environment.tokenFile)

    let token = await environment.getLoginToken()

    let options = {
      method: 'DELETE',
      uri: `${baseUrl}/sessions`,
      json: true,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }

    return rp(options)
  }

  var mod = {
    login: login,
    logout: logout
  }

  return mod
}())
