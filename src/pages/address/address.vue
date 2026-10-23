<template>
  <view class="container">
    <view class="form card">
      <view class="form-item">
        <text class="label">收货人</text>
        <input class="input" v-model="form.name" placeholder="请输入收货人姓名" />
      </view>
      <view class="form-item">
        <text class="label">手机号</text>
        <input class="input" v-model="form.phone" type="number" maxlength="11" placeholder="请输入手机号" />
      </view>
      <view class="form-item">
        <text class="label">详细地址</text>
        <input class="input" v-model="form.detail" placeholder="楼栋 / 门牌等" />
      </view>
    </view>
    <button class="save-btn" @click="save">保存收货信息</button>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'

interface AddressInfo {
  name?: string
  phone?: string
  detail?: string
}

const form = ref<AddressInfo>({})

onShow(() => {
  form.value = uni.getStorageSync('addressInfo') || {}
})

function save(): void {
  const { name, phone, detail } = form.value
  if (!name || !phone || !detail) {
    uni.showToast({ title: '请填写完整信息', icon: 'none' })
    return
  }
  if (!/^1\d{10}$/.test(phone)) {
    uni.showToast({ title: '手机号格式不正确', icon: 'none' })
    return
  }
  uni.setStorageSync('addressInfo', form.value)
  uni.showToast({ title: '已保存', icon: 'success' })
  setTimeout(() => uni.navigateBack(), 600)
}
</script>

<style scoped lang="scss">
.form {
  padding: 0 24rpx;
  .form-item {
    display: flex;
    align-items: center;
    padding: 24rpx 0;
    border-bottom: 1rpx solid var(--nm-line);
    .label {
      width: 140rpx;
      font-size: 28rpx;
      color: var(--nm-text);
    }
    .input {
      flex: 1;
      font-size: 28rpx;
    }
  }
}
.save-btn {
  margin: 40rpx 24rpx;
  background: var(--neon-amber);
  color: var(--nm-on-accent);
  border-radius: 40rpx;
  font-size: 30rpx;
}
</style>
