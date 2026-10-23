<template>
  <view class="container">
    <view v-if="cartList.length === 0" class="empty">
      <text class="empty-text">购物车还是空的</text>
      <button class="empty-btn" @click="goMenu">去逛逛</button>
    </view>

    <view v-else>
      <view class="cart-item card" v-for="item in cartList" :key="item._id">
        <image
          class="item-image"
          :src="item.image || '/static/default-food.png'"
          mode="aspectFill"
        />
        <view class="item-info">
          <view class="item-name">{{ item.name }}</view>
          <view class="item-bottom">
            <text class="price">¥{{ formatPrice(item.price) }}</text>
            <view class="stepper">
              <button class="step-btn" @click="reduce(item)">-</button>
              <text class="step-count">{{ item.count }}</text>
              <button class="step-btn" @click="add(item)">+</button>
            </view>
          </view>
        </view>
        <text class="item-del" @click="removeItem(item)">删除</text>
      </view>

      <view class="cart-footer">
        <view class="footer-left">
          <text>合计：</text>
          <text class="price">¥{{ formatPrice(totalPrice) }}</text>
        </view>
        <button class="footer-btn" @click="goOrder">去结算 ({{ totalCount }})</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { formatPrice } from '@/utils/request'
import cart from '@/utils/cart'
import type { CartItem } from '@/types'

const cartList = ref<CartItem[]>([])
const totalCount = ref(0)
const totalPrice = ref(0)

function loadCart(): void {
  cartList.value = cart.getCart()
  totalCount.value = cart.getTotalCount()
  totalPrice.value = cart.getTotalPrice()
}

onShow(() => {
  loadCart()
})

function add(item: CartItem): void {
  cart.addItem(item)
  loadCart()
}

function reduce(item: CartItem): void {
  cart.reduceItem(item._id)
  loadCart()
}

function removeItem(item: CartItem): void {
  cart.removeItem(item._id)
  loadCart()
}

function goOrder(): void {
  if (!cartList.value.length) return
  uni.switchTab({ url: '/pages/order-confirm/order-confirm' })
}

function goMenu(): void {
  uni.switchTab({ url: '/pages/index/index' })
}
</script>

<style scoped lang="scss">
.empty {
  margin-top: 200rpx;
  text-align: center;
  .empty-text {
    display: block;
    color: var(--nm-faint);
    margin-bottom: 30rpx;
  }
  .empty-btn {
    display: inline-block;
    background: #ff6b35;
    color: var(--nm-on-accent);
    border-radius: 40rpx;
    padding: 0 60rpx;
  }
}

.cart-item {
  display: flex;
  align-items: center;
  .item-image {
    width: 120rpx;
    height: 120rpx;
    border-radius: 12rpx;
    background: var(--nm-surface-2);
    flex-shrink: 0;
  }
  .item-info {
    flex: 1;
    margin-left: 20rpx;
    .item-name {
      font-size: 30rpx;
      font-weight: bold;
    }
    .item-bottom {
      margin-top: 16rpx;
      display: flex;
      align-items: center;
      justify-content: space-between;
      .stepper {
        display: flex;
        align-items: center;
        .step-btn {
          width: 48rpx;
          height: 48rpx;
          line-height: 44rpx;
          padding: 0;
          border-radius: 50%;
          background: var(--nm-surface-2);
          font-size: 32rpx;
        }
        .step-count {
          margin: 0 20rpx;
          font-size: 28rpx;
        }
      }
    }
  }
  .item-del {
    color: var(--nm-faint);
    font-size: 24rpx;
    margin-left: 16rpx;
  }
}

.cart-footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 100rpx;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30rpx;
  box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.06);
  .footer-left {
    font-size: 28rpx;
  }
  .footer-btn {
    background: #ff6b35;
    color: var(--nm-on-accent);
    border-radius: 40rpx;
    font-size: 28rpx;
    padding: 0 40rpx;
  }
}
</style>
