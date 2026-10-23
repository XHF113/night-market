// 获取摊位详情
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { stallId } = event
  if (!stallId) return { code: -1, message: '缺少 stallId' }
  try {
    const res = await db.collection('stalls').doc(stallId).get()
    return { code: 0, data: res.data }
  } catch (err) {
    return { code: -1, message: err.message || '获取摊位详情失败' }
  }
}
