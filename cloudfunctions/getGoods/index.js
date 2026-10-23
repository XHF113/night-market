// 获取某摊位下的商品列表（仅返回在售商品）
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { stallId } = event
  if (!stallId) return { code: -1, message: '缺少 stallId' }
  try {
    const res = await db
      .collection('goods')
      .where({ stallId, status: 1 })
      .limit(100)
      .get()
    return { code: 0, data: { list: res.data } }
  } catch (err) {
    return { code: -1, message: err.message || '获取商品失败' }
  }
}
