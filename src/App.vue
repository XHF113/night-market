<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { cloudEnv, traceUser } from '@/config'

onLaunch(() => {
  console.log('App Launch')
  if (wx.cloud) {
    wx.cloud.init({
      env: cloudEnv,
      traceUser,
    })
  }
  checkLogin()
})

onShow(() => {
  console.log('App Show')
})

onHide(() => {
  console.log('App Hide')
})

async function checkLogin(): Promise<void> {
  const userInfo = uni.getStorageSync('userInfo')
  if (!userInfo) {
    try {
      const res = await wx.cloud.callFunction({ name: 'login' })
      uni.setStorageSync(
        'openid',
        (res.result as { openid?: string }).openid ?? '',
      )
      console.log('登录成功', res.result)
    } catch (err) {
      console.error('登录失败', err)
    }
  }
}
</script>

<style lang="scss">
/* 每个页面公共 css */
@import 'uview-plus/index.scss';

page {
  /* ===== 西关夜市 · 夜色设计令牌（小程序层真实配色） ===== */
  --nm-bg: #0B0910;
  --nm-surface: #15121E;
  --nm-surface-2: #1E1A2A;
  --nm-surface-3: #272036;
  --nm-text: #FFF7EA;
  --nm-muted: #A79EB9;
  --nm-faint: #6F6785;
  --nm-line: rgba(255, 247, 234, .10);
  --nm-line-2: rgba(255, 247, 234, .20);
  --neon-magenta: #FF3D71;
  --neon-amber: #FFB02E;
  --neon-cyan: #38E8D0;
  --neon-lime: #B7F24D;
  --nm-danger: #FF5F5F;
  --nm-on-accent: #1B1204;
  --font-cn: "Songti SC", "STSong", "SimSun", serif;
  --font-body: "PingFang SC", "Microsoft YaHei", sans-serif;
  --font-num: "DIN Alternate", "Helvetica Neue", sans-serif;

  background-color: var(--nm-bg);
  color: var(--nm-text);
  font-family: var(--font-body);
  font-size: 28rpx;
  letter-spacing: .02em;
}

.container {
  padding: 20rpx;
  min-height: 100vh;
}

/* 卡片：深色表面 + 霓虹细描边 + 环境阴影 */
.card {
  background: var(--nm-surface);
  border: 1rpx solid var(--nm-line);
  border-radius: 22rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 8rpx 28rpx rgba(8, 4, 16, .48);
}

/* 价格：钨丝灯泡琥珀 + 光晕 */
.price {
  color: var(--neon-amber);
  font-weight: 700;
  font-family: var(--font-num);
  text-shadow: 0 0 12rpx rgba(255, 176, 46, .45);
}

/* 通用主按钮：琥珀底 + 深字 + 光晕 */
.btn-primary {
  background: var(--neon-amber);
  color: var(--nm-on-accent);
  border-radius: 999rpx;
  font-weight: 700;
  box-shadow: 0 0 20rpx rgba(255, 176, 46, .45);
}

/* 空态 */
.empty {
  text-align: center;
  color: var(--nm-faint);
  padding: 60rpx;
  font-size: 26rpx;
}

/* 区块标题（霓虹） */
.section-title {
  font-family: var(--font-cn);
  font-weight: 900;
  font-size: 32rpx;
  color: var(--nm-text);
  padding: 12rpx 24rpx 6rpx;
  letter-spacing: -.01em;
}
</style>
