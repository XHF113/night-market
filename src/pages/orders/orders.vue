<template>
  <view class="container">
    <view class="tabs">
      <view class="tab" :class="{ active: tab === 'all' }" @click="tab = 'all'">全部</view>
      <view class="tab" :class="{ active: tab === 'pending' }" @click="tab = 'pending'">待出餐</view>
      <view class="tab" :class="{ active: tab === 'done' }" @click="tab = 'done'">已完成</view>
    </view>

    <view v-if="filteredOrders.length === 0" class="empty">
      <text class="empty-text">还没有订单</text>
    </view>

    <view class="order-card card" v-for="order in filteredOrders" :key="order._id" @click="goDetail(order)">
      <view class="order-header">
        <text class="order-no">订单号：{{ order.orderNo }}</text>
        <text class="order-status" :style="{ color: orderStatusMap[order.status].color }">
          {{ orderStatusMap[order.status].text }}
        </text>
      </view>

      <view class="order-goods" v-for="g in order.goods" :key="g.goodsId">
        <text class="g-name">{{ g.name }}</text>
        <text class="g-count">x{{ g.count }}</text>
        <text class="g-price">¥{{ formatPrice(g.price) }}</text>
      </view>

      <view class="order-footer">
        <text class="order-time">{{ formatTime(order.createTime) }}</text>
        <text class="order-total">共 {{ order.goods.reduce((s, g) => s + g.count, 0) }} 件，合计 ¥{{ formatPrice(order.totalPrice) }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import { callFunction, formatPrice, orderStatusMap } from '@/utils/request'
import type { Order, OrderListResult } from '@/types'

type Tab = 'all' | 'pending' | 'done'
const orders = ref<Order[]>([])
const tab = ref<Tab>('all')

const filteredOrders = computed<Order[]>(() => {
  if (tab.value === 'pending') return orders.value.filter((o) => o.status === 1 || o.status === 2)
  if (tab.value === 'done') return orders.value.filter((o) => o.status === 3)
  return orders.value
})

async function loadOrders(): Promise<void> {
  try {
    const res = await callFunction<OrderListResult>('getOrders', {})
    orders.value = res.list || []
  } catch (e) {
    console.error(e)
  }
}

onShow(() => {
  loadOrders()
})

onPullDownRefresh(async () => {
  await loadOrders()
  uni.stopPullDownRefresh()
})

function goDetail(order: Order): void {
  uni.navigateTo({ url: `/pages/order-detail/order-detail?orderId=${order._id}` })
}

function formatTime(ts?: number): string {
  if (!ts) return ''
  const d = new Date(ts)
  const pad = (n: number) => (n < 10 ? '0' + n : '' + n)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`
}
</script>

<style scoped lang="scss">
.tabs {
  display: flex;
  background: var(--nm-surface);
  border-bottom: 1rpx solid var(--nm-line);
  position: sticky;
  top: 0;
  z-index: 1;
  .tab {
    flex: 1;
    text-align: center;
    height: 88rpx;
    line-height: 88rpx;
    font-size: 28rpx;
    color: var(--nm-muted);
    &.active {
      color: var(--neon-amber);
      font-weight: bold;
      border-bottom: 4rpx solid var(--neon-amber);
    }
  }
}

.empty {
  margin-top: 200rpx;
  text-align: center;
  .empty-text {
    color: var(--nm-faint);
  }
}

.order-card {
  .order-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 16rpx;
    border-bottom: 1rpx solid var(--nm-line);
    .order-no {
      font-size: 26rpx;
      color: var(--nm-muted);
    }
    .order-status {
      font-size: 26rpx;
      font-weight: bold;
    }
  }
  .order-goods {
    display: flex;
    align-items: center;
    padding: 12rpx 0;
    .g-name {
      flex: 1;
      font-size: 28rpx;
    }
    .g-count {
      color: var(--nm-faint);
      margin: 0 20rpx;
    }
    .g-price {
      color: var(--nm-muted);
    }
  }
  .order-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 16rpx;
    border-top: 1rpx solid #f0f0f0;
    .order-time {
      font-size: 24rpx;
      color: var(--nm-faint);
    }
    .order-total {
      font-size: 26rpx;
      color: var(--neon-amber);
    }
  }
}
</style>
