<template>
  <view class="container">
    <view class="profile-header card" @click="onHeaderTap">
      <image
        class="avatar"
        :src="userInfo.avatarUrl || '/static/default-avatar.png'"
        mode="aspectFill"
      />
      <view class="user-info">
        <text class="nickname">{{ isLogin ? maskPhone(userInfo.phone) : '点击登录' }}</text>
        <text class="user-tip" v-if="!isLogin">登录后查看订单</text>
        <text class="user-tip" v-else>点击退出登录</text>
      </view>
    </view>

    <view class="menu card">
      <view class="menu-item" @click="goOrders">
        <text>我的订单</text>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item" @click="goAddress">
        <text>收货信息</text>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item" @click="goStallApply">
        <text>成为摊主</text>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item" @click="about">
        <text>关于夜市</text>
        <text class="arrow">›</text>
      </view>
    </view>

    <!-- 登录弹层 -->
    <view class="mask" v-if="showLogin" @click="showLogin = false">
      <view class="login-card" @click.stop>
        <view class="login-title">手机号登录</view>
        <button class="phone-btn" open-type="getPhoneNumber" @getphonenumber="onGetPhone">
          微信授权手机号
        </button>
        <view class="divider">或</view>
        <input
          class="manual-input"
          v-model="manualPhone"
          type="number"
          maxlength="11"
          placeholder="手动输入手机号"
        />
        <button class="manual-btn" @click="submitManual">确认</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { callFunction } from '@/utils/request'
import type { User } from '@/types'

const userInfo = ref<User>({})
const isLogin = ref(false)
const showLogin = ref(false)
const manualPhone = ref('')

onShow(() => {
  const info = uni.getStorageSync('userInfo')
  userInfo.value = info || {}
  isLogin.value = !!info
})

function onHeaderTap(): void {
  if (isLogin.value) {
    uni.showModal({
      title: '提示',
      content: '确定退出登录？',
      success: (res) => {
        if (res.confirm) {
          uni.removeStorageSync('userInfo')
          userInfo.value = {}
          isLogin.value = false
        }
      },
    })
  } else {
    showLogin.value = true
  }
}

async function onGetPhone(e: any): Promise<void> {
  const { code, errMsg } = e.detail || {}
  if (!code || errMsg !== 'getPhoneNumber:ok') {
    uni.showToast({ title: '授权失败', icon: 'none' })
    return
  }
  try {
    const res = await callFunction<{ phoneNumber: string; openid?: string }>(
      'getPhoneNumber',
      { code },
    )
    userInfo.value = { ...userInfo.value, phone: res.phoneNumber, openid: res.openid }
    uni.setStorageSync('userInfo', userInfo.value)
    isLogin.value = true
    showLogin.value = false
    uni.showToast({ title: '登录成功', icon: 'success' })
  } catch (err) {
    uni.showToast({ title: '获取手机号失败，可手动输入', icon: 'none' })
  }
}

function submitManual(): void {
  const p = manualPhone.value.trim()
  if (!/^1\d{10}$/.test(p)) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
    return
  }
  userInfo.value = { ...userInfo.value, phone: p }
  uni.setStorageSync('userInfo', userInfo.value)
  isLogin.value = true
  showLogin.value = false
  manualPhone.value = ''
  uni.showToast({ title: '登录成功', icon: 'success' })
}

function maskPhone(phone?: string): string {
  if (!phone) return ''
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

function goOrders(): void {
  uni.switchTab({ url: '/pages/orders/orders' })
}

function goAddress(): void {
  uni.navigateTo({ url: '/pages/address/address' })
}

function goStallApply(): void {
  uni.showModal({
    title: '成为摊主',
    content: '请联系管理员开通摊主权限',
    showCancel: false,
  })
}

function about(): void {
  uni.showModal({
    title: '关于',
    content: '夜市扫码点餐 v1.0.0',
    showCancel: false,
  })
}
</script>

<style scoped lang="scss">
.profile-header {
  display: flex;
  align-items: center;
  .avatar {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    background: var(--nm-surface-2);
  }
  .user-info {
    margin-left: 24rpx;
    .nickname {
      font-size: 34rpx;
      font-weight: bold;
      display: block;
    }
    .user-tip {
      font-size: 24rpx;
      color: var(--nm-faint);
    }
  }
}

.menu {
  margin-top: 20rpx;
  padding: 0 24rpx;
  .menu-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 96rpx;
    border-bottom: 1rpx solid var(--nm-line);
    font-size: 30rpx;
    &:last-child {
      border-bottom: none;
    }
    .arrow {
      color: var(--nm-faint);
      font-size: 36rpx;
    }
  }
}

.mask {
  position: fixed;
  inset: 0;
  background: rgba(6, 4, 10, .68);
  display: flex;
  align-items: center;
  justify-content: center;
  .login-card {
    width: 560rpx;
    background: #fff;
    border-radius: 20rpx;
    padding: 40rpx;
    .login-title {
      font-size: 32rpx;
      font-weight: bold;
      text-align: center;
      margin-bottom: 30rpx;
    }
    .phone-btn {
      background: var(--neon-amber);
      color: var(--nm-on-accent);
      border-radius: 40rpx;
      font-size: 30rpx;
    }
    .divider {
      text-align: center;
      color: var(--nm-faint);
      font-size: 24rpx;
      margin: 24rpx 0;
    }
    .manual-input {
      background: var(--nm-surface-2);
      border-radius: 12rpx;
      padding: 20rpx;
      font-size: 28rpx;
    }
    .manual-btn {
      margin-top: 24rpx;
      background: var(--neon-amber);
      color: var(--nm-on-accent);
      border-radius: 40rpx;
      font-size: 30rpx;
    }
  }
}
</style>
