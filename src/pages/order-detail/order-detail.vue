<template>
  <view class="container">
    <view class="status-bar card">
      <text class="status-text" :style="{ color: statusInfo.color }">{{ statusInfo.text }}</text>
    </view>

    <view class="goods-card card">
      <view class="goods-row" v-for="g in order.goods" :key="g.goodsId">
        <text class="g-name">{{ g.name }}</text>
        <text class="g-count">x{{ g.count }}</text>
        <text class="g-price">¥{{ formatPrice(g.price) }}</text>
      </view>
      <view class="goods-total">
        <text>合计</text>
        <text class="total-price">¥{{ formatPrice(order.totalPrice || 0) }}</text>
      </view>
    </view>

    <view class="info-card card">
      <view class="info-row"><text class="label">订单号</text><text>{{ order.orderNo }}</text></view>
      <view class="info-row">
        <text class="label">取餐方式</text>
        <text>{{ order.pickupMethod === 'delivery' ? '配送到家' : '到摊自取' }}</text>
      </view>
      <view class="info-row" v-if="order.phone"><text class="label">联系手机</text><text>{{ order.phone }}</text></view>
      <view class="info-row" v-if="order.remark"><text class="label">备注</text><text>{{ order.remark }}</text></view>
      <view class="info-row"><text class="label">下单时间</text><text>{{ formatTime(order.createTime) }}</text></view>
    </view>

    <view class="code-card card" v-if="order.verificationCode">
      <text class="code-label">核销码</text>
      <text class="code-value">{{ order.verificationCode }}</text>
      <text class="code-tip">请向摊主出示此码完成核销</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { callFunction, formatPrice, orderStatusMap } from '@/utils/request'
import type { Order, OrderStatus } from '@/types'

const order = ref<Partial<Order>>({})
let orderId = ''

const statusInfo = computed(() => orderStatusMap[(order.value.status || 0) as OrderStatus])

onLoad((options: any) => {
  orderId = options?.orderId || ''
  loadOrder()
})

async function loadOrder(): Promise<void> {
  try {
    order.value = await callFunction<Order>('getOrder', { orderId })
  } catch (e) {
    console.error(e)
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
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
.container {
  padding: 24rpx;
}
.status-bar {
  text-align: center;
  padding: 40rpx 0;
  .status-text {
    font-size: 36rpx;
    font-weight: bold;
  }
}
.goods-card {
  margin-top: 20rpx;
  padding: 10rpx 24rpx;
  .goods-row {
    display: flex;
    align-items: center;
    padding: 20rpx 0;
    border-bottom: 1rpx solid var(--nm-line);
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
  .goods-total {
    display: flex;
    justify-content: space-between;
    padding: 20rpx 0;
    font-size: 28rpx;
    .total-price {
      color: var(--neon-amber);
      font-weight: bold;
    }
  }
}
.info-card {
  margin-top: 20rpx;
  padding: 10rpx 24rpx;
  .info-row {
    display: flex;
    justify-content: space-between;
    padding: 18rpx 0;
    font-size: 28rpx;
    border-bottom: 1rpx solid var(--nm-line);
    &:last-child {
      border-bottom: none;
    }
    .label {
      color: var(--nm-faint);
    }
  }
}
.code-card {
  margin-top: 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 0;
  .code-label {
    font-size: 26rpx;
    color: var(--nm-faint);
  }
  .code-value {
    font-size: 56rpx;
    font-weight: bold;
    letter-spacing: 8rpx;
    color: var(--neon-amber);
    margin: 16rpx 0;
  }
  .code-tip {
    font-size: 24rpx;
    color: var(--neon-amber);
  }
}
</style>
