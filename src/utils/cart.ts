import type { CartItem, Goods } from '@/types'

const CART_KEY = 'night_market_cart'

function getCart(): CartItem[] {
  return uni.getStorageSync(CART_KEY) || []
}

function saveCart(list: CartItem[]): void {
  uni.setStorageSync(CART_KEY, list)
}

function addItem(goods: Goods): CartItem[] {
  const list = getCart()
  const index = list.findIndex((item) => item._id === goods._id)
  if (index > -1) {
    list[index].count += 1
  } else {
    list.push({
      _id: goods._id,
      name: goods.name,
      price: goods.price,
      image: goods.image,
      count: 1,
      stallId: goods.stallId,
    })
  }
  saveCart(list)
  return list
}

function reduceItem(id: string): CartItem[] {
  const list = getCart()
  const index = list.findIndex((item) => item._id === id)
  if (index > -1) {
    list[index].count -= 1
    if (list[index].count <= 0) {
      list.splice(index, 1)
    }
    saveCart(list)
  }
  return list
}

function removeItem(id: string): CartItem[] {
  const list = getCart().filter((item) => item._id !== id)
  saveCart(list)
  return list
}

function clearCart(): void {
  uni.removeStorageSync(CART_KEY)
}

function getTotalCount(): number {
  return getCart().reduce((sum, item) => sum + item.count, 0)
}

function getItemCount(id: string): number {
  const item = getCart().find((g) => g._id === id)
  return item ? item.count : 0
}

function getTotalPrice(): number {
  return getCart().reduce((sum, item) => sum + item.price * item.count, 0)
}

export default {
  getCart,
  addItem,
  reduceItem,
  removeItem,
  clearCart,
  getTotalCount,
  getTotalPrice,
  getItemCount,
}
