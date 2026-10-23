<template>
  <view class="container">
    <view class="order-list">
      <view class="order-item" v-for="item in cartList" :key="item._id">
        <text class="item-name">{{ item.name }}</text>
        <text class="item-price">¥{{ formatPrice(item.price) }}</text>
        <text class="item-count">x{{ item.count }}</text>
      </view>
    </view>

    <view class="pickup-box card">
      <text class="pickup-label">取餐方式</text>
      <view class="pickup-opts">
        <view
          class="pickup-opt"
          :class="{ active: pickupMethod === 'self' }"
          @click="pickupMethod = 'self'"
        >到摊自取</view>
      </view>
    </view>

    <view class="phone-box card">
      <text class="phone-label">联系手机号</text>
      <input
        class="phone-input"
        v-model="phone"
        type="number"
        maxlength="11"
        placeholder="选填，便于摊主联系"
        placeholder-class="placeholder"
      />
    </view>

    <view class="remark-box card">
      <text class="remark-label">备注</text>
      <input
        class="remark-input"
        v-model="remark"
        placeholder="口味、忌口等（选填）"
        placeholder-class="placeholder"
      />
    </view>

    <view class="footer">
      <view class="footer-left">
        <text>合计：</text>
        <text class="price">¥{{ formatPrice(totalPrice) }}</text>
      </view>
      <button class="pay-btn" :disabled="submitting" @click="submitOrder">
        {{ submitting ? '支付中...' : '微信支付' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { callFunction, formatPrice } from '@/utils/request'
import cart from '@/utils/cart'
import type { CartItem, PayParams } from '@/types'

const cartList = ref<CartItem[]>([])
const remark = ref('')
const phone = ref('')
const pickupMethod = ref<'self' | 'delivery'>('self')
const submitting = ref(false)
let stallId = ''

function loadCart(): void {
  const list = cart.getCart()
  cartList.value = list
  stallId = list[0]?.stallId || ''
}

onShow(() => {
  loadCart()
})

const totalPrice = computed(() =>
  cartList.value.reduce((sum, i) => sum + i.price * i.count, 0),
)

async function submitOrder(): Promise<void> {
  if (submitting.value) return
  if (!cartList.value.length) {
    uni.showToast({ title: '购物车为空', icon: 'none' })
    return
  }
  submitting.value = true
  try {
    const res = await callFunction<{
      orderId: string
      orderNo: string
      payParams: PayParams
    }>('createOrder', {
      goods: cartList.value.map((i) => ({
        goodsId: i._id,
        name: i.name,
        price: i.price,
        count: i.count,
      })),
      totalPrice: totalPrice.value,
      stallId,
      remark: remark.value,
      pickupMethod: pickupMethod.value,
      phone: phone.value,
    })
    if (res.payParams) {
      await uni.requestPayment(res.payParams)
    }
    cart.clearCart()
    uni.showToast({ title: '支付成功', icon: 'success' })
    setTimeout(() => {
      uni.switchTab({ url: '/pages/orders/orders' })
    }, 800)
  } catch (err) {
    console.error(err)
    uni.showToast({ title: '下单失败，请重试', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
.order-list {
  background: rgba(21, 18, 30, .92);
  border-radius: 16rpx;
  padding: 10rpx 24rpx;
  margin-bottom: 20rpx;
  .order-item {
    display: flex;
    align-items: center;
    padding: 20rpx 0;
    border-bottom: 1rpx solid var(--nm-line);
    &:last-child {
      border-bottom: none;
    }
    .item-name {
      flex: 1;
      font-size: 28rpx;
    }
    .item-price {
      color: var(--nm-muted);
      margin: 0 30rpx;
    }
    .item-count {
      color: var(--nm-faint);
    }
  }
}

.pickup-box,
.phone-box {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
  .pickup-label,
  .phone-label {
    font-size: 28rpx;
    margin-right: 20rpx;
    flex-shrink: 0;
  }
  .pickup-opts {
    display: flex;
    gap: 16rpx;
    .pickup-opt {
      padding: 10rpx 28rpx;
      border-radius: 30rpx;
      background: var(--nm-surface-2);
      font-size: 26rpx;
      color: var(--nm-muted);
      &.active {
        background: var(--neon-amber);
        color: var(--nm-on-accent);
      }
    }
  }
  .phone-input {
    flex: 1;
    font-size: 28rpx;
  }
}

.remark-box {
  display: flex;
  align-items: center;
  .remark-label {
    font-size: 28rpx;
    margin-right: 20rpx;
  }
  .remark-input {
    flex: 1;
    font-size: 28rpx;
  }
  .placeholder {
    color: var(--nm-faint);
  }
}

.footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 100rpx;
  background: rgba(21, 18, 30, .92);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30rpx;
  box-shadow: 0 -8rpx 28rpx rgba(0, 0, 0, .48);
  .footer-left {
    font-size: 28rpx;
  }
  .pay-btn {
    background: var(--neon-amber);
    color: var(--nm-on-accent);
    border-radius: 40rpx;
    font-size: 28rpx;
    padding: 0 50rpx;
    &[disabled] {
      opacity: 0.6;
    }
  }
}
</style>
