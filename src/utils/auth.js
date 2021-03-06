import Vue from 'vue'
import axios from 'axios'
import router from '@/router'

var request = axios.create({
  baseURL: '',
  timeout: 10000
})
var jwtDecode = require('jwt-decode')

export default {
  user: {
    authenticated: false,
    details: null
  },

  translateUserDetails (userServerData) {
    localStorage.setItem('userId', userServerData.id)
    return {
      'id': userServerData.id,
      'username': userServerData.username,
      'nickname': userServerData.nickname,
      'email': userServerData.email,
      'dateJoined': userServerData.date_joined,
      'mugshotUrl': userServerData.mugshot_url,
      'ipJoined': userServerData.ip_joined,
      'lastLoginIp': userServerData.last_login_ip,
      'isSuperuser': userServerData.is_superuser,
      'isStaff': userServerData.is_staff,
      'postCount': userServerData.post_count,
      'replyCount': userServerData.reply_count
    }
  },

  login (creds, redirect) {
    return request({
      url: '/proxy/rest-auth/login/',
      data: creds,
      method: 'POST'
    }).then(res => {
      localStorage.setItem('id_jwt', res.data.token)
      Vue.set(this.user, 'authenticated', true)
      Vue.set(this.user, 'details', this.translateUserDetails(res.data.user))

      if (redirect) {
        router.push(redirect)
      } else {
        router.push('/')
      }
    })
  },

  gitHubLogin (code, redirect) {
    return request({
      url: '/proxy/rest-auth/github/login/',
      data: { 'code': code },
      method: 'POST'
    }).then(res => {
      localStorage.setItem('id_jwt', res.data.token)

      Vue.set(this.user, 'authenticated', true)
      Vue.set(this.user, 'details', this.translateUserDetails(res.data.user))

      if (redirect) {
        router.push(redirect)
      } else {
        router.push('/')
      }
    })
  },

  refreshJwt (jwt) {
    return request({
      url: '/proxy/rest-auth/refresh-jwt/',
      data: { 'token': jwt }
    }).then(res => {
      localStorage.setItem('id_jwt', res.data.token)
    })
  },

  signup (creds) {
    return request.post('/proxy/rest-auth/registration/', creds, (data) => {
      alert('Email已发送到邮箱')
    })
  },

  logout () {
    localStorage.removeItem('id_jwt')
    localStorage.removeItem('userId')
    Vue.set(this.user, 'authenticated', false)

    location.reload()
  },

  inspectToken (jwt) {
    var decodedJwt = jwtDecode(jwt)
    var exp = decodedJwt.exp
    var currentTime = new Date().getTime() / 1000
    if ((exp - currentTime < 1800) && (exp - currentTime >= 0)) {
      // 刷新jwt
      return true
    } else if (currentTime < exp) {
      // 暂时不用刷新
      return true
    } else {
      // jwt已经过期
      this.logout()
    }
  },

  checkAuth () {
    var jwt = localStorage.getItem('id_jwt')
    if (jwt && this.inspectToken(jwt)) {
      Vue.set(this.user, 'authenticated', true)
      var decodedJwt = jwtDecode(jwt)
      request({
        url: '/proxy/users/' + decodedJwt.user_id + '/',
        method: 'GET'
      }).then((res) => {
        Vue.set(this.user, 'details', this.translateUserDetails(res.data))
      })
    } else {
      Vue.set(this.user, 'authenticated', false)
    }
  },

  getAuthHeader () {
    var jwt = localStorage.getItem('id_jwt')
    if (jwt) {
      return 'Bearer ' + localStorage.getItem('id_jwt')
    } else {
      return ''
    }
  }
}
