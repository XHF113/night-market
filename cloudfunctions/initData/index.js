// 初始化示例数据（一次性）
// 部署后调用一次即可灌入示例摊位与商品，方便预览效果。
// 重复调用不会重复插入（已存在数据则跳过）。
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const stalls = [
  { name: '阿婆烤串', category: '小吃', notice: '新鲜现烤，每日限量', status: 1, score: 4.8, estimatedTime: 15, phone: '13800000001' },
  { name: '鲜榨果汁铺', category: '饮品', notice: '当季鲜果，现榨现卖', status: 1, score: 4.6, estimatedTime: 5, phone: '13800000002' },
  { name: '手作饰品摊', category: '饰品', notice: '独一无二的手工饰品', status: 1, score: 4.9, estimatedTime: 10, phone: '13800000003' },
]

const goodsTemplate = [
  { name: '孜然羊肉串', price: 300, category: '烧烤', stock: 100, status: 1, description: '外焦里嫩，孜然飘香' },
  { name: '烤五花肉', price: 500, category: '烧烤', stock: 100, status: 1, description: '肥而不腻' },
  { name: '鲜橙汁', price: 1200, category: '果汁', stock: 50, status: 1, description: '整颗鲜橙榨取' },
  { name: '柠檬蜂蜜茶', price: 1000, category: '茶饮', stock: 50, status: 1, description: '酸甜解腻' },
  { name: '手工项链', price: 3900, category: '饰品', stock: 20, status: 1, description: '原创设计' },
  { name: '复古耳环', price: 1900, category: '饰品', stock: 20, status: 1, description: '精致小巧' },
]

exports.main = async (event, context) => {
  const countRes = await db.collection('stalls').count()
  if (countRes.total > 0) {
    return { code: 0, message: '数据已存在，跳过初始化', data: {} }
  }

  const stallIds = []
  for (const s of stalls) {
    const r = await db.collection('stalls').add({
      data: { ...s, createTime: Date.now() },
    })
    stallIds.push(r._id)
  }

  const goodsList = [
    { ...goodsTemplate[0], stallId: stallIds[0] },
    { ...goodsTemplate[1], stallId: stallIds[0] },
    { ...goodsTemplate[2], stallId: stallIds[1] },
    { ...goodsTemplate[3], stallId: stallIds[1] },
    { ...goodsTemplate[4], stallId: stallIds[2] },
    { ...goodsTemplate[5], stallId: stallIds[2] },
  ]
  for (const g of goodsList) {
    await db.collection('goods').add({ data: g })
  }

  return {
    code: 0,
    message: '初始化成功',
    data: { stallCount: stallIds.length, goodsCount: goodsList.length },
  }
}
