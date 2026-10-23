// 获取用户手机号
// 前端 button open-type="getPhoneNumber" 拿到 code，传给本云函数，
// 云函数用 access_token 调用微信业务接口换取手机号。
const https = require('https')
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

function requestPhoneNumber(code, accessToken) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ code })
    const req = https.request(
      {
        hostname: 'api.weixin.qq.com',
        path: '/wxa/business/getuserphonenumber?access_token=' + accessToken,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = ''
        res.on('data', (c) => (body += c))
        res.on('end', () => {
          try {
            resolve(JSON.parse(body))
          } catch (e) {
            reject(e)
          }
        })
      },
    )
    req.on('error', reject)
    req.write(data)
    req.end()
  })
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { code } = event
  if (!code) return { code: -1, message: '缺少 code' }
  try {
    const tokenRes = await cloud.getAccessToken()
    const apiRes = await requestPhoneNumber(code, tokenRes.access_token)
    if (apiRes.errcode === 0 && apiRes.phone_info) {
      return {
        code: 0,
        data: {
          phoneNumber: apiRes.phone_info.phoneNumber,
          openid: wxContext.OPENID,
        },
      }
    }
    return { code: apiRes.errcode || -1, message: apiRes.errmsg || '获取手机号失败' }
  } catch (err) {
    return { code: -1, message: err.message || '获取手机号失败' }
  }
}
