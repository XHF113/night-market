<template>
  <view class="page">
    <!-- ============ 霓虹招牌头部 ============ -->
    <view class="sign">
      <view class="sign-en">XIGUAN · NIGHT MARKET</view>
      <view class="sign-title neon flicker">西关夜市</view>
      <view class="sign-hours">
        <text class="live-dot"></text>
        <text class="hours">营业中 21:00 — 03:00</text>
        <text class="sep">·</text>
        <text class="loc">A 区 · 12 号档 · 距您 120m</text>
      </view>
    </view>

    <!-- ============ 搜索条 ============ -->
    <view class="searchbar">
      <text class="ico">🔍</text>
      <input
        class="search-input"
        v-model="keyword"
        placeholder="搜烤串 / 档口号 / 摊主名"
        placeholder-class="search-ph"
        confirm-type="search"
      />
      <view class="scan" @click="onScan">⊙</view>
    </view>

    <!-- ============ 01 今夜档口 ============ -->
    <view class="sec-head">
      <text class="idx">01</text>
      <text class="sec-title">今夜档口</text>
      <text class="more">全部 {{ stalls.length }} ›</text>
    </view>

    <scroll-view scroll-x class="rail" :show-scrollbar="false">
      <view
        v-for="(s, i) in filteredStalls"
        :key="s._id"
        class="stall"
        :class="{ 'is-current': i === 0 }"
        @click="goStall(s)"
      >
        <view class="stall-art" :style="{ '--art-hue': artHue(i) }">
          <text class="art-ico">{{ stallIcon(i) }}</text>
        </view>
        <view class="stall-name">{{ s.name }}</view>
        <view class="stall-meta">{{ stallMeta(s, i) }}</view>
        <view class="stall-live">
          <text class="live-dot"></text>
          <text>{{ queueText(i) }}</text>
        </view>
      </view>
      <view class="rail-pad"></view>
    </scroll-view>

    <!-- ============ 02 今夜必点 ============ -->
    <view class="sec-head">
      <text class="idx">02</text>
      <text class="sec-title">今夜必点</text>
      <text class="more" @click="refreshHero">换一批 ↻</text>
    </view>

    <view class="hero" v-if="heroGoods">
      <text class="hero-rank">01</text>
      <view class="hero-art">
        <text class="hero-ico">{{ goodsIcon(0) }}</text>
      </view>
      <view class="hero-body">
        <view class="hero-top">
          <view class="hero-info">
            <view class="hero-name">{{ heroGoods.name }}</view>
            <view class="hero-sub">{{ heroSub(heroGoods) }}</view>
          </view>
          <text class="hero-fire">🔥</text>
        </view>
        <view class="hero-foot">
          <view class="hero-price">
            <text class="cur">¥</text>
            <text class="num">{{ formatPrice(heroGoods.price) }}</text>
            <text class="unit" v-if="heroGoods.category">/{{ heroGoods.category }}</text>
          </view>
          <view class="stepper">
            <view class="step-btn" @click="reduceHero">−</view>
            <text class="step-n">{{ heroCount }}</text>
            <view class="step-btn is-add" @click="addHero">+</view>
          </view>
        </view>
      </view>
    </view>

    <view class="empty" v-if="!heroGoods && !loading">暂无推荐菜品</view>

    <!-- 底部占位，避免被托盘遮挡 -->
    <view class="bottom-pad"></view>

    <!-- ============ 底部签筒托盘 ============ -->
    <view class="tray" v-if="cartCount > 0" @click="goCart">
      <view class="tube">
        <view class="stick"></view>
        <view class="stick"></view>
        <view class="stick"></view>
        <view class="stick"></view>
        <text class="cnt">{{ cartCount }}</text>
      </view>
      <view class="sum">
        <view class="sum-price">¥{{ formatPrice(cartTotal) }}</view>
        <view class="sum-tip">已插 {{ cartCount }} 根签 · 满 30 减 5</view>
      </view>
      <view class="go" @click.stop="goCart">去结算</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad, onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import { callFunction } from '@/utils/request'
import cart from '@/utils/cart'
import { formatPrice } from '@/types'
import type { Stall, Goods, StallListResult, GoodsListResult } from '@/types'

const keyword = ref('')
const stalls = ref<Stall[]>([])
const heroPool = ref<Goods[]>([])
const heroIndex = ref(0)
const heroCount = ref(0)
const cartCount = ref(0)
const cartTotal = ref(0)
const loading = ref(false)

const ICONS = ['🍢', '🍲', '🦑', '🥤', '🍜', '🧋']
const HUES = ['#FFC98A', '#FFB9A0', '#FF8FA3', '#C6F36A', '#FFD9A0', '#8FE7D8']
const QUEUES = ['排队 6 桌', '排队 2 桌', '排队 11 桌', '即取', '排队 4 桌', '即取']

const filteredStalls = computed<Stall[]>(() => {
  const kw = keyword.value.trim()
  if (!kw) return stalls.value
  return stalls.value.filter(
    (s) =>
      (s.name && s.name.includes(kw)) ||
      (s.notice && s.notice.includes(kw)) ||
      (s.category && s.category.includes(kw)),
  )
})

const heroGoods = computed<Goods | null>(() => heroPool.value[heroIndex.value] || null)

function artHue(i: number): string {
  return HUES[i % HUES.length]
}
function stallIcon(i: number): string {
  return ICONS[i % ICONS.length]
}
function goodsIcon(i: number): string {
  return ICONS[i % ICONS.length]
}
function queueText(i: number): string {
  const s = filteredStalls.value[i]
  if (s && s.estimatedTime) return `约 ${s.estimatedTime} 分钟`
  return QUEUES[i % QUEUES.length]
}
function stallMeta(s: Stall, i: number): string {
  const no = `${(i + 3) % 20 + 1} 号档`
  return s.category ? `${no} · ${s.category}` : no
}
function heroSub(g: Goods): string {
  if (g.description) return g.description
  return g.category ? `${g.category} · 现点现做 · 人气招牌` : '现点现做 · 人气招牌'
}

function refreshHero(): void {
  if (heroPool.value.length <= 1) {
    uni.showToast({ title: '暂无更多推荐', icon: 'none' })
    return
  }
  heroIndex.value = (heroIndex.value + 1) % heroPool.value.length
  heroCount.value = cart.getItemCount(heroGoods.value?._id || '')
}

function addHero(): void {
  const g = heroGoods.value
  if (!g) return
  cart.addItem(g)
  heroCount.value = cart.getItemCount(g._id)
  syncCart()
}

function reduceHero(): void {
  const g = heroGoods.value
  if (!g || heroCount.value <= 0) return
  cart.reduceItem(g._id)
  heroCount.value = cart.getItemCount(g._id)
  syncCart()
}

function syncCart(): void {
  cartCount.value = cart.getTotalCount()
  cartTotal.value = cart.getTotalPrice()
}

function goStall(s: Stall): void {
  uni.navigateTo({ url: `/pages/stall/stall?stallId=${s._id}` })
}

function goCart(): void {
  if (cartCount.value <= 0) return
  uni.switchTab({ url: '/pages/cart/cart' })
}

function onScan(): void {
  uni.showToast({ title: '请扫描档口桌牌二维码', icon: 'none' })
}

async function loadStalls(): Promise<void> {
  try {
    const res = await callFunction<StallListResult>('getStalls', {})
    stalls.value = res.list || []
  } catch (e) {
    console.error(e)
  }
}

async function loadHero(): Promise<void> {
  loading.value = true
  try {
    // 汇总各摊位的在售菜品作为「今夜必点」候选池
    const lists = await Promise.all(
      stalls.value.map((s) =>
        callFunction<GoodsListResult>('getGoods', { stallId: s._id }).catch(
          () => ({ list: [] as Goods[] }),
        ),
      ),
    )
    heroPool.value = lists.flatMap((r) => r.list || [])
    heroIndex.value = 0
    heroCount.value = cart.getItemCount(heroGoods.value?._id || '')
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function init(): Promise<void> {
  await loadStalls()
  await loadHero()
}

onLoad(() => {
  init()
})

onShow(() => {
  syncCart()
  if (heroGoods.value) {
    heroCount.value = cart.getItemCount(heroGoods.value._id)
  }
})

onPullDownRefresh(() => {
  init()
    .catch(() => {})
    .finally(() => uni.stopPullDownRefresh())
})
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  padding-bottom: 40rpx;
  background-color: var(--nm-bg);
}

/* ============ 霓虹招牌 ============ */
.sign {
  position: relative;
  padding: 20rpx 36rpx 12rpx;

  &::before {
    content: '';
    position: absolute;
    top: -40rpx;
    left: -80rpx;
    right: -80rpx;
    height: 240rpx;
    background:
      radial-gradient(60% 100% at 22% 60%, rgba(255, 61, 113, .30), transparent 70%),
      radial-gradient(50% 90% at 78% 40%, rgba(139, 92, 255, .22), transparent 70%);
    pointer-events: none;
    z-index: 0;
  }
}

.sign-en {
  position: relative;
  z-index: 1;
  font-size: 22rpx;
  letter-spacing: .34em;
  color: var(--nm-faint);
  font-family: var(--font-num);
}

.sign-title {
  position: relative;
  z-index: 1;
  margin-top: 6rpx;
  font-family: var(--font-cn);
  font-weight: 900;
  font-size: 76rpx;
  line-height: 1.04;
  letter-spacing: -.01em;
}

.neon {
  color: #FFF4F7;
  text-shadow:
    0 0 2rpx #fff,
    0 0 16rpx var(--neon-magenta),
    0 0 44rpx var(--neon-magenta),
    0 0 92rpx rgba(255, 61, 113, .60);
}

.flicker {
  animation: flicker 6.5s steps(1, end) infinite;
}

@keyframes flicker {
  0%, 42%, 44.5%, 46%, 78%, 100% { opacity: 1; }
  43% { opacity: .28; }
  45% { opacity: .55; }
  79% { opacity: .18; }
  80% { opacity: .9; }
}

.sign-hours {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 10rpx;
  font-size: 22rpx;
  color: var(--neon-lime);

  .hours {
    color: var(--neon-lime);
  }
  .sep {
    color: var(--nm-faint);
  }
  .loc {
    color: var(--nm-muted);
  }
}

.live-dot {
  display: inline-block;
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 12rpx currentColor;
  animation: bulb 1.8s ease-in-out infinite;
  flex-shrink: 0;
}

@keyframes bulb {
  0%, 100% { opacity: .45; transform: scale(.86); }
  50% { opacity: 1; transform: scale(1); }
}

/* ============ 搜索条 ============ */
.searchbar {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin: 12rpx 36rpx 0;
  height: 84rpx;
  padding: 0 8rpx 0 26rpx;
  border-radius: 999rpx;
  background: var(--nm-surface-2);
  border: 1rpx solid var(--nm-line);
  position: relative;
  z-index: 1;

  .ico {
    font-size: 26rpx;
    opacity: .55;
  }
  .search-input {
    flex: 1;
    min-width: 0;
    background: transparent;
    border: 0;
    font-size: 26rpx;
    color: var(--nm-text);
  }
  .scan {
    width: 62rpx;
    height: 62rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 176, 46, .14);
    color: var(--neon-amber);
    font-size: 28rpx;
    flex-shrink: 0;
  }
}

:deep(.search-ph) {
  color: var(--nm-faint);
  font-size: 26rpx;
}

/* ============ 区块标题 ============ */
.sec-head {
  display: flex;
  align-items: flex-end;
  gap: 14rpx;
  padding: 36rpx 36rpx 8rpx;

  .idx {
    font-family: var(--font-num);
    font-weight: 900;
    font-size: 72rpx;
    line-height: .8;
    letter-spacing: -.02em;
    color: transparent;
    -webkit-text-stroke: 3rpx var(--neon-magenta);
    transform: translateY(10rpx);
  }
  .sec-title {
    font-family: var(--font-cn);
    font-weight: 900;
    font-size: 42rpx;
    letter-spacing: -.01em;
    color: var(--nm-text);
  }
  .more {
    margin-left: auto;
    font-size: 22rpx;
    color: var(--nm-faint);
  }
}

/* ============ 摊档横向长廊 ============ */
.rail {
  display: flex;
  white-space: nowrap;
  padding: 12rpx 0 8rpx 36rpx;
}

.rail-pad {
  width: 36rpx;
  flex-shrink: 0;
}

.stall {
  flex-shrink: 0;
  width: 232rpx;
  padding: 16rpx;
  margin-right: 20rpx;
  border-radius: 28rpx;
  background: linear-gradient(165deg, var(--nm-surface-2), var(--nm-surface));
  border: 1rpx solid var(--nm-line);

  &.is-current {
    border-color: rgba(255, 176, 46, .7);
    box-shadow: 0 0 24rpx rgba(255, 176, 46, .30), 0 0 68rpx rgba(255, 176, 46, .12);
  }

  .stall-art {
    position: relative;
    height: 88rpx;
    border-radius: 16rpx;
    margin-bottom: 12rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background:
      radial-gradient(120% 90% at 50% 115%, rgba(255, 120, 40, .50), transparent 62%),
      linear-gradient(160deg, #2A2138, #17131F);

    .art-ico {
      font-size: 56rpx;
      line-height: 1;
      filter: drop-shadow(0 0 12rpx rgba(255, 176, 46, .35));
    }
  }

  .stall-name {
    font-size: 28rpx;
    font-weight: 700;
    color: var(--nm-text);
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .stall-meta {
    margin-top: 4rpx;
    font-size: 22rpx;
    color: var(--nm-faint);
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .stall-live {
    display: flex;
    align-items: center;
    gap: 8rpx;
    margin-top: 10rpx;
    font-size: 22rpx;
    color: var(--neon-lime);
  }
}

/* ============ 今夜必点 大卡 ============ */
.hero {
  position: relative;
  margin: 16rpx 36rpx 0;
  padding: 20rpx;
  border-radius: 40rpx;
  background: linear-gradient(168deg, var(--nm-surface-3), var(--nm-surface));
  border: 1rpx solid rgba(255, 61, 113, .34);
  box-shadow: 0 16rpx 56rpx rgba(8, 4, 16, .48), inset 0 0 80rpx rgba(255, 61, 113, .07);

  .hero-rank {
    position: absolute;
    top: -20rpx;
    left: -6rpx;
    z-index: 2;
    font-family: var(--font-num);
    font-weight: 900;
    font-size: 112rpx;
    line-height: .78;
    letter-spacing: -.03em;
    color: var(--neon-magenta);
    text-shadow: 0 0 28rpx rgba(255, 61, 113, .8), 0 8rpx 20rpx rgba(0, 0, 0, .6);
  }

  .hero-art {
    position: relative;
    height: 168rpx;
    border-radius: 28rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background:
      radial-gradient(120% 90% at 50% 115%, rgba(255, 120, 40, .45), transparent 62%),
      linear-gradient(160deg, #2A2138, #17131F);
    border: 1rpx solid var(--nm-line);

    .hero-ico {
      font-size: 124rpx;
      line-height: 1;
      filter: drop-shadow(0 0 24rpx rgba(255, 176, 46, .40));
    }
  }

  .hero-body {
    padding: 20rpx 8rpx 4rpx;
  }

  .hero-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;

    .hero-info {
      flex: 1;
      min-width: 0;
    }
    .hero-name {
      font-family: var(--font-cn);
      font-weight: 900;
      font-size: 42rpx;
      line-height: 1.1;
      letter-spacing: -.01em;
      color: var(--nm-text);
    }
    .hero-sub {
      margin-top: 6rpx;
      font-size: 22rpx;
      color: var(--nm-muted);
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .hero-fire {
      font-size: 30rpx;
      margin-left: 16rpx;
      filter: drop-shadow(0 0 10rpx rgba(255, 176, 46, .7));
    }
  }

  .hero-foot {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-top: 20rpx;

    .hero-price {
      display: flex;
      align-items: baseline;
      color: var(--neon-amber);
      font-family: var(--font-num);
      text-shadow: 0 0 24rpx rgba(255, 176, 46, .45);

      .cur {
        font-size: 26rpx;
        opacity: .8;
        margin-right: 2rpx;
      }
      .num {
        font-size: 52rpx;
        font-weight: 900;
        letter-spacing: -.01em;
      }
      .unit {
        font-size: 24rpx;
        opacity: .75;
      }
    }
  }
}

/* 步进器 */
.stepper {
  display: flex;
  align-items: center;
  gap: 8rpx;

  .step-btn {
    width: 60rpx;
    height: 60rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1rpx solid var(--nm-line-2);
    color: var(--nm-text);
    background: var(--nm-surface-2);
    font-size: 32rpx;
    line-height: 1;

    &.is-add {
      background: var(--neon-amber);
      color: var(--nm-on-accent);
      border-color: transparent;
      box-shadow: 0 0 20rpx rgba(255, 176, 46, .45);
      font-weight: 700;
    }
  }
  .step-n {
    min-width: 44rpx;
    text-align: center;
    font-family: var(--font-num);
    font-size: 32rpx;
    color: var(--nm-text);
  }
}

/* ============ 底部签筒托盘 ============ */
.bottom-pad {
  height: 180rpx;
}

.tray {
  position: fixed;
  left: 28rpx;
  right: 28rpx;
  bottom: 20rpx;
  z-index: 90;
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 16rpx 24rpx;
  border-radius: 40rpx;
  background: rgba(21, 18, 30, .92);
  border: 1rpx solid var(--nm-line-2);
  backdrop-filter: blur(28rpx);
  box-shadow: 0 16rpx 56rpx rgba(8, 4, 16, .48);

  .tube {
    position: relative;
    width: 92rpx;
    height: 92rpx;
    flex-shrink: 0;
    border-radius: 12rpx 12rpx 20rpx 20rpx / 16rpx 16rpx 24rpx 24rpx;
    background: linear-gradient(180deg, #3B2C1E, #241A11);
    border: 1rpx solid rgba(255, 176, 46, .35);
    box-shadow: inset 0 -12rpx 20rpx rgba(0, 0, 0, .5), 0 0 28rpx rgba(255, 176, 46, .22);
    overflow: visible;

    .stick {
      position: absolute;
      bottom: 32rpx;
      left: 50%;
      width: 6rpx;
      height: 60rpx;
      border-radius: 4rpx;
      background: linear-gradient(180deg, #F6E3B8, #C9A46A);
      transform-origin: bottom center;

      &:nth-child(1) { transform: translateX(-28rpx) rotate(-13deg); }
      &:nth-child(2) { transform: translateX(-12rpx) rotate(-5deg); }
      &:nth-child(3) { transform: translateX(4rpx) rotate(4deg); }
      &:nth-child(4) { transform: translateX(20rpx) rotate(12deg); }
    }

    .cnt {
      position: absolute;
      top: -14rpx;
      right: -16rpx;
      min-width: 40rpx;
      height: 40rpx;
      padding: 0 10rpx;
      border-radius: 999rpx;
      background: var(--neon-magenta);
      color: #fff;
      font-family: var(--font-num);
      font-size: 22rpx;
      line-height: 40rpx;
      text-align: center;
      box-shadow: 0 0 20rpx rgba(255, 61, 113, .8);
    }
  }

  .sum {
    flex: 1;
    min-width: 0;

    .sum-price {
      font-family: var(--font-num);
      font-weight: 900;
      font-size: 42rpx;
      color: var(--nm-text);
      letter-spacing: -.01em;
    }
    .sum-tip {
      font-size: 22rpx;
      color: var(--nm-faint);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .go {
    height: 80rpx;
    padding: 0 40rpx;
    border-radius: 999rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--neon-amber);
    color: var(--nm-on-accent);
    font-weight: 700;
    font-size: 28rpx;
    box-shadow: 0 0 32rpx rgba(255, 176, 46, .40);
    flex-shrink: 0;
  }
}
</style>
