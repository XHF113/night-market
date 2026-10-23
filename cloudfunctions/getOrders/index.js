// 获取当前用户的订单列表（按创建时间倒序）
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  try {
    const res = await db
      .collection('orders')
      .where({ openid: wxContext.OPENID })
      .orderBy('createTime', 'desc')
      .limit(100)
      .get()
    return { code: 0, data: { list: res.data } }
  } catch (err) {
    return { code: -1, message: err.message || '获取订单失败' }
  }
}
