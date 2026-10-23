// 获取摊位列表（仅返回营业中的摊位，按评分倒序）
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const res = await db
      .collection('stalls')
      .where({ status: 1 })
      .orderBy('score', 'desc')
      .limit(100)
      .get()
    return { code: 0, data: { list: res.data } }
  } catch (err) {
    return { code: -1, message: err.message || '获取摊位失败' }
  }
}
