// 创建订单
// 演示模式（ENABLE_PAYMENT=false）：跳过真实微信支付，订单直接标记为「已支付」，
// 返回 payParams=null，前端会跳过 requestPayment。
// 接入真实支付时：将 ENABLE_PAYMENT 改为 true，并在 unifiedOrder 分支补充商户号等配置。
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const ENABLE_PAYMENT = false

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { goods, totalPrice, stallId, remark, pickupMethod, phone } = event

  if (!goods || !goods.length || !stallId) {
    return { code: -1, message: '参数不完整' }
  }

  const orderNo = 'NM' + Date.now() + Math.floor(Math.random() * 1000)
  const order = {
    orderNo,
    goods,
    totalPrice,
    stallId,
    openid: wxContext.OPENID,
    status: ENABLE_PAYMENT ? 0 : 1, // 0 待支付 1 已支付
    createTime: Date.now(),
    payTime: ENABLE_PAYMENT ? null : Date.now(),
    remark: remark || '',
    pickupMethod: pickupMethod || 'self',
    phone: phone || '',
    verificationCode: String(Math.floor(1000 + Math.random() * 9000)),
  }

  try {
    const addRes = await db.collection('orders').add({ data: order })

    let payParams = null
    if (ENABLE_PAYMENT) {
      // 真实微信支付：需要商户号，使用云支付统一下单
      // const pay = await cloud.cloudPay.unifiedOrder({
      //   body: '夜市点餐',
      //   outTradeNo: orderNo,
      //   spbillCreateIp: '127.0.0.1',
      //   subMchId: '你的商户号',
      //   totalFee: totalPrice, // 单位：分
      //   envId: cloud.DYNAMIC_CURRENT_ENV,
      //   functionName: 'createOrder',
      // })
      // payParams = pay.payment
    }

    return { code: 0, data: { orderId: addRes._id, orderNo, payParams } }
  } catch (err) {
    return { code: -1, message: err.message || '下单失败' }
  }
}
