'use strict'

module.exports = (function () {
  const rp = require('request-promise-native')
  const prompt = require('prompt')
  const { table } = require('table')
  const environment = require('./environment')

  const passwordSchema = {
    properties: {
      password: {
        hidden: true,
        replace: '*',
        required: true
      }
    }
  }

  const yesnoSchema = {
    name: 'yesno',
    message: 'are you sure?',
    validator: /y[es]*|n[o]?/,
    warning: 'Must respond yes or no',
    default: 'no'
  }

  const _passwordPrompt = () => {
    return new Promise((resolve, reject) => {
      prompt.start()

      prompt.get(passwordSchema, (err, result) => {
        if (err) return reject(err)
        resolve(result)
      })
    })
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

  const completeRegistration = async (baseUrl, token) => {
    let passwordData = await _passwordPrompt()

    let options = {
      method: 'PUT',
      uri: `${baseUrl}/users/register`,
      json: true,
      body: {
        token: token,
        password: passwordData.password
      }
    }

    let user = await rp(options)

    let data = []
    data.push([ 'Email', user.email ])
    data.push([ 'Name', user.name ])
    data.push([ 'Role', user.user_role ])
    data.push([ 'Enabled', user.enabled ])
    data.push([ 'Registered', user.registered ])

    console.log(table(data))
  }

  const listUsers = async (baseUrl) => {
    let token = await environment.getLoginToken()

    let options = {
      method: 'GET',
      uri: `${baseUrl}/users`,
      json: true,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }

    let data = []

    data.push([ 'Email', 'Name', 'Role', 'Enabled', 'Registered' ])

    let users = await rp(options)

    for (let user of users) {
      data.push([ user.email, user.name, user.user_role, user.enabled, user.registered ])
    }

    console.log(table(data))
  }

  const createUser = async (baseUrl, email, name, role) => {
    let token = await environment.getLoginToken()

    let options = {
      method: 'POST',
      uri: `${baseUrl}/users`,
      json: true,
      body: {
        email: email,
        name: name,
        user_role: role
      },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }

    let newUser = await rp(options)

    let data = []
    data.push([ 'Email', newUser.email ])
    data.push([ 'Name', newUser.name ])
    data.push([ 'Role', newUser.user_role ])
    data.push([ 'Enabled', newUser.enabled ])
    data.push([ 'Registered', newUser.registered ])
    data.push([ 'Token', newUser.token ])

    console.log(table(data))
  }

  const enableUser = async (baseUrl, email, enable) => {
    let token = await environment.getLoginToken()

    // First, we need to find the user associated
    // with the specified email.
    let options = {
      method: 'GET',
      uri: `${baseUrl}/users`,
      qs: {
        email: email
      },
      json: true,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }

    let users = await rp(options)

    if (users.length === 0) throw new Error(`User not found: ${email}`)

    let user = users[0]

    options = {
      method: 'PUT',
      uri: `${baseUrl}/users/${user.id}/enable`,
      json: true,
      body: {
        enabled: enable
      },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }

    let newUser = await rp(options)

    let data = []
    data.push([ 'Email', newUser.email ])
    data.push([ 'Name', newUser.name ])
    data.push([ 'Role', newUser.user_role ])
    data.push([ 'Enabled', newUser.enabled ])
    data.push([ 'Registered', newUser.registered ])

    console.log(table(data))
  }

  const removeUser = async (baseUrl, email, force) => {
    let token = await environment.getLoginToken()

    // First, we need to find the user associated
    // with the specified email.
    let options = {
      method: 'GET',
      uri: `${baseUrl}/users`,
      qs: {
        email: email
      },
      json: true,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }

    let users = await rp(options)

    if (users.length === 0) throw new Error(`User not found: ${email}`)

    let user = users[0]

    let deleteUser = false

    if (force) {
      deleteUser = true
    } else {
      let response = await _yesnoPrompt()
      deleteUser = response.yesno === 'yes'
    }

    if (deleteUser) {
      options = {
        method: 'DELETE',
        uri: `${baseUrl}/users/${user.id}`,
        json: true,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }

      await rp(options)

      console.log(`User ${email} deleted.`)
    }
  }

  var mod = {
    completeRegistration: completeRegistration,
    createUser: createUser,
    enableUser: enableUser,
    listUsers: listUsers,
    removeUser: removeUser
  }

  return mod
}())
