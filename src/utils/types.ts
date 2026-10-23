// 全局类型定义

export interface Goods {
  _id: string
  name: string
  price: number
  image?: string
  category?: string
  stallId: string
  description?: string
  spec?: string
  stock?: number
  status?: number
  estimatedTime?: number
}

export interface Stall {
  _id?: string
  name?: string
  notice?: string
  category?: string
  status?: number
  phone?: string
  estimatedTime?: number
  score?: number
  location?: { latitude: number; longitude: number }
}

export interface CartItem {
  _id: string
  name: string
  price: number
  image?: string
  count: number
  stallId: string
  spec?: string
}

export type OrderStatus = 0 | 1 | 2 | 3 | 4

export interface OrderGoods {
  goodsId: string
  name: string
  price: number
  count: number
  spec?: string
}

export interface Order {
  _id: string
  orderNo: string
  goods: OrderGoods[]
  totalPrice: number
  stallId: string
  openid?: string
  status: OrderStatus
  createTime?: number
  payTime?: number | null
  remark?: string
  pickupMethod?: 'self' | 'delivery'
  phone?: string
  address?: string
  verificationCode?: string
}

export interface User {
  openid?: string
  nickName?: string
  avatarUrl?: string
  phone?: string
}

export interface PayParams {
  timeStamp: string
  nonceStr: string
  package: string
  signType: string
  paySign: string
}

export interface CloudResult<T = unknown> {
  code: number
  message?: string
  data: T
}

export interface GoodsListResult {
  list: Goods[]
}

export interface StallListResult {
  list: Stall[]
}

export interface OrderListResult {
  list: Order[]
}

// 摊位经营分类
export const STALL_CATEGORIES = ['小吃', '饮品', '饰品'] as const
export type StallCategory = (typeof STALL_CATEGORIES)[number]

// 订单状态：待支付 / 已支付 / 制作中(待出餐) / 已完成 / 已取消
export const orderStatusMap: Record<OrderStatus, { text: string; color: string }> = {
  0: { text: '待支付', color: '#FF9800' },
  1: { text: '已支付', color: '#4CAF50' },
  2: { text: '制作中', color: '#2196F3' },
  3: { text: '已完成', color: '#4CAF50' },
  4: { text: '已取消', color: '#9E9E9E' },
}

// 摊位营业状态：1 营业中，0 休息
export const stallStatusMap: Record<number, { text: string; color: string }> = {
  1: { text: '营业中', color: '#19BE6B' },
  0: { text: '休息中', color: '#9E9E9E' },
}

export function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2)
}
