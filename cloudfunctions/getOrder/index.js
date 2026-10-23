// 获取订单详情（校验订单归属，防止越权访问）
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { orderId } = event
  if (!orderId) return { code: -1, message: '缺少 orderId' }
  try {
    const res = await db.collection('orders').doc(orderId).get()
    const order = res.data
    if (order.openid && order.openid !== wxContext.OPENID) {
      return { code: -2, message: '无权访问该订单' }
    }
    return { code: 0, data: order }
  } catch (err) {
    return { code: -1, message: err.message || '获取订单详情失败' }
  }
}
