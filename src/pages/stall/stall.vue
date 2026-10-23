<template>
  <view class="page">
    <!-- ============ 档口头部 ============ -->
    <view class="shop-head">
      <view class="top">
        <view class="back" @click="goBack">‹</view>
        <text class="head-meta">{{ stallNo }} 号档</text>
        <text class="dot">·</text>
        <text class="head-meta">{{ stall.category || '果木炭火' }}</text>
        <view class="fav" :class="{ 'is-on': faved }" @click="toggleFav">
          <text>{{ faved ? '★' : '☆' }}</text>
        </view>
      </view>

      <view class="shop-name">{{ stall.name || '档口' }}</view>

      <view class="stats">
        <text class="st"><text class="b">{{ score }}</text> 分</text>
        <text class="st"><text class="b">{{ monthlySales }}</text> 月售</text>
        <text class="st q">排队 {{ queueNo }} 桌 · 约 {{ eta }} 分钟</text>
      </view>

      <view class="notice" v-if="stall.notice">{{ stall.notice }}</view>
    </view>

    <!-- ============ 分类竖栏 + 菜品列表 ============ -->
    <view class="menu-body">
      <scroll-view scroll-y class="cats" :show-scrollbar="false">
        <view
          v-for="c in categories"
          :key="c.name"
          class="cat"
          :class="{ 'is-active': currentCategory === c.name }"
          @click="switchCategory(c.name)"
        >
          <text class="cat-name">{{ c.name }}</text>
          <text class="cat-n">{{ pad2(c.count) }}</text>
        </view>
      </scroll-view>

      <scroll-view scroll-y class="dish-list" :show-scrollbar="false">
        <view
          v-for="(g, i) in filteredGoods"
          :key="g._id"
          class="dish-row"
          :class="{ 'is-sold': isSoldOut(g) }"
        >
          <view class="dish-art">
            <text class="dish-ico">{{ goodsIcon(g, i) }}</text>
          </view>

          <view class="info">
            <view class="dish-name">{{ g.name }}</view>
            <view class="meta">{{ goodsMeta(g, i) }}</view>

            <view class="tags">
              <text
                v-for="t in goodsTags(g)"
                :key="t.text"
                class="tag"
                :class="t.type ? `tag--${t.type}` : ''"
              >{{ t.text }}</text>
            </view>

            <view class="buy">
              <view class="price">
                <text class="cur">¥</text>
                <text class="num">{{ formatPrice(g.price) }}</text>
                <text class="unit" v-if="g.spec">/{{ g.spec }}</text>
              </view>

              <view class="stepper" v-if="!isSoldOut(g)">
                <template v-if="countOf(g._id) > 0">
                  <view class="step-btn" @click="reduce(g)">−</view>
                  <text class="step-n">{{ countOf(g._id) }}</text>
                </template>
                <view class="step-btn is-add" @click="add(g)">+</view>
              </view>

              <view class="btn-spec is-disabled" v-else>已售罄</view>
            </view>
          </view>
        </view>

        <view class="empty" v-if="!filteredGoods.length && !loading">该分类暂无菜品</view>
        <view class="list-pad"></view>
      </scroll-view>
    </view>

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
        <view class="sum-tip">{{ cartSummary }}</view>
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
import type { Goods, Stall, GoodsListResult } from '@/types'

interface CatItem {
  name: string
  count: number
}

interface TagItem {
  text: string
  type?: 'hot' | 'veg' | 'new' | 'sold'
}

const stall = ref<Partial<Stall>>({})
const goods = ref<Goods[]>([])
const currentCategory = ref('')
const cartCount = ref(0)
const cartTotal = ref(0)
const cartSummary = ref('')
const loading = ref(false)
const faved = ref(false)
let stallId = 'default_stall'

const ICONS = ['🍢', '🍗', '🍆', '🥓', '🦪', '🥤']
const SOLD_HINT = '今日售完'

const categories = computed<CatItem[]>(() => {
  const map = new Map<string, number>()
  goods.value.forEach((g) => {
    const key = g.category || '其他'
    map.set(key, (map.get(key) || 0) + 1)
  })
  return Array.from(map, ([name, count]) => ({ name, count }))
})

const filteredGoods = computed<Goods[]>(() => {
  if (!currentCategory.value) return goods.value
  return goods.value.filter((g) => (g.category || '其他') === currentCategory.value)
})

function extra(key: string): number | undefined {
  const v = (stall.value as Record<string, unknown>)[key]
  return typeof v === 'number' ? v : undefined
}

const stallNo = computed(() => {
  const n = (stall.value as Record<string, unknown>).stallNo
  if (typeof n === 'number') return String(n)
  return typeof n === 'string' && n ? n : '12'
})

const score = computed(() => {
  const s = extra('score')
  return typeof s === 'number' ? s.toFixed(1) : '4.8'
})

const monthlySales = computed(() => {
  const s = extra('monthlySales')
  return typeof s === 'number' ? `${s}+` : '2300+'
})

const queueNo = computed(() => extra('queueNo') ?? 6)

const eta = computed(() => stall.value.estimatedTime || 12)

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

function goodsIcon(g: Goods, i: number): string {
  const key = `${g.category || ''}${g.name || ''}`
  if (/饮|汤|茶|酒|水/.test(key)) return '🥤'
  if (/蚝|贝|虾|海鲜/.test(key)) return '🦪'
  if (/茄|菜|素|豆/.test(key)) return '🍆'
  if (/翅|鸡/.test(key)) return '🍗'
  if (/五花|肉|串|烤/.test(key)) return '🍢'
  return ICONS[i % ICONS.length]
}

function goodsMeta(g: Goods, i: number): string {
  const sales = Math.max(1200 - i * 190, 60)
  const sold = `月售 ${sales}+`
  if (isSoldOut(g)) return `${sold} · ${SOLD_HINT}`
  if (g.description) return `${sold} · ${g.description}`
  if (g.estimatedTime) return `${sold} · 约 ${g.estimatedTime} 分钟出餐`
  return `${sold} · 现点现做`
}

function isSoldOut(g: Goods): boolean {
  return g.status === 0 || (typeof g.stock === 'number' && g.stock <= 0)
}

function goodsTags(g: Goods): TagItem[] {
  if (isSoldOut(g)) {
    return [
      { text: '售罄', type: 'sold' },
      { text: '明晚补货' },
    ]
  }
  const tags: TagItem[] = []
  const key = `${g.category || ''}${g.name || ''}`
  if (g.spec) tags.push({ text: g.spec })
  if (/饮|汤|茶|酒|水/.test(key)) tags.push({ text: '冰镇', type: 'new' })
  else if (/素|菜|茄/.test(key)) tags.push({ text: '素', type: 'veg' })
  else tags.push({ text: '招牌', type: 'hot' })
  return tags.slice(0, 2)
}

function countOf(id: string): number {
  return cart.getItemCount(id)
}

function switchCategory(name: string): void {
  currentCategory.value = name
}

function add(g: Goods): void {
  if (isSoldOut(g)) return
  cart.addItem(g)
  syncCart()
}

function reduce(g: Goods): void {
  if (countOf(g._id) <= 0) return
  cart.reduceItem(g._id)
  syncCart()
}

function syncCart(): void {
  const list = cart.getCart()
  cartCount.value = cart.getTotalCount()
  cartTotal.value = cart.getTotalPrice()
  cartSummary.value =
    list
      .slice(0, 2)
      .map((it) => `${it.name} ×${it.count}`)
      .join(' · ') || ''
}

function toggleFav(): void {
  faved.value = !faved.value
  uni.showToast({
    title: faved.value ? '已收藏档口' : '已取消收藏',
    icon: 'none',
  })
}

function goBack(): void {
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack()
  else uni.switchTab({ url: '/pages/index/index' })
}

function goCart(): void {
  if (cartCount.value <= 0) return
  uni.switchTab({ url: '/pages/cart/cart' })
}

async function loadStallInfo(): Promise<void> {
  try {
    stall.value = await callFunction<Stall>('getStallInfo', { stallId })
  } catch (e) {
    console.error(e)
  }
}

async function loadGoods(): Promise<void> {
  loading.value = true
  try {
    const res = await callFunction<GoodsListResult>('getGoods', { stallId })
    goods.value = res.list || []
    if (!currentCategory.value && categories.value.length) {
      currentCategory.value = categories.value[0].name
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onLoad((options?: Record<string, string>) => {
  stallId = options?.stallId || 'default_stall'
  loadStallInfo()
  loadGoods()
  syncCart()
})

onShow(() => syncCart())

onPullDownRefresh(() => {
  Promise.all([loadStallInfo(), loadGoods()])
    .catch(() => {})
    .finally(() => uni.stopPullDownRefresh())
})
</script>

<style scoped lang="scss">
.page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background-color: var(--nm-bg);
}

/* ============ 档口头部 ============ */
.shop-head {
  flex: 0 0 auto;
  padding: 20rpx 36rpx 16rpx;

  .top {
    display: flex;
    align-items: center;
    gap: 12rpx;
    font-size: 22rpx;
    color: var(--nm-muted);
  }

  .back,
  .fav {
    width: 60rpx;
    height: 60rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 247, 234, .07);
    border: 1rpx solid var(--nm-line);
    color: var(--nm-text);
    flex-shrink: 0;
  }

  .back {
    font-size: 40rpx;
    line-height: 1;
    padding-bottom: 8rpx;
  }

  .fav {
    margin-left: auto;
    font-size: 26rpx;
    line-height: 1;
    color: var(--nm-faint);

    &.is-on {
      color: var(--neon-amber);
      border-color: rgba(255, 176, 46, .5);
      background: rgba(255, 176, 46, .14);
      text-shadow: 0 0 14rpx rgba(255, 176, 46, .8);
    }
  }

  .head-meta {
    color: var(--nm-muted);
  }

  .dot {
    color: var(--nm-faint);
  }

  .shop-name {
    margin-top: 14rpx;
    font-family: var(--font-cn);
    font-weight: 900;
    font-size: 54rpx;
    line-height: 1.08;
    letter-spacing: -.01em;
    color: var(--nm-text);
  }

  .stats {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 20rpx;
    margin-top: 10rpx;
    font-size: 22rpx;
    color: var(--nm-muted);

    .b {
      font-family: var(--font-num);
      font-weight: 900;
      color: var(--neon-amber);
      text-shadow: 0 0 14rpx rgba(255, 176, 46, .45);
    }

    .q {
      color: var(--neon-cyan);
    }
  }

  .notice {
    margin-top: 12rpx;
    padding: 10rpx 16rpx;
    border-radius: 12rpx;
    background: rgba(255, 247, 234, .04);
    border: 1rpx solid var(--nm-line);
    font-size: 22rpx;
    color: var(--nm-faint);
  }
}

/* ============ 菜单主体 ============ */
.menu-body {
  flex: 1 1 auto;
  display: flex;
  min-height: 0;
  overflow: hidden;
  border-top: 1rpx solid var(--nm-line);
}

/* 左侧竖分类栏 */
.cats {
  flex: 0 0 150rpx;
  height: 100%;
  background: rgba(255, 247, 234, .03);
  border-right: 1rpx solid var(--nm-line);
}

.cat {
  position: relative;
  padding: 24rpx 8rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rpx;

  .cat-name {
    font-size: 24rpx;
    color: var(--nm-muted);
  }

  .cat-n {
    font-family: var(--font-num);
    font-size: 18rpx;
    letter-spacing: .1em;
    color: var(--nm-faint);
  }

  &.is-active {
    background: linear-gradient(90deg, rgba(255, 176, 46, .16), transparent);

    .cat-name {
      color: var(--nm-text);
      font-weight: 700;
    }

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 20rpx;
      bottom: 20rpx;
      width: 6rpx;
      border-radius: 0 4rpx 4rpx 0;
      background: var(--neon-amber);
      box-shadow: 0 0 16rpx var(--neon-amber);
    }
  }
}

/* 右侧菜品列表 */
.dish-list {
  flex: 1;
  min-width: 0;
  height: 100%;
}

.dish-row {
  display: flex;
  gap: 20rpx;
  align-items: stretch;
  padding: 24rpx 28rpx;
  border-bottom: 1rpx solid var(--nm-line);

  &.is-sold {
    opacity: .48;

    .dish-art {
      filter: grayscale(1);
    }

    .price {
      color: var(--nm-faint);
      text-shadow: none;
    }
  }

  .dish-art {
    flex: 0 0 auto;
    width: 120rpx;
    height: 120rpx;
    border-radius: 18rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    background:
      radial-gradient(120% 90% at 50% 115%, rgba(255, 120, 40, .45), transparent 62%),
      linear-gradient(160deg, #2A2138, #17131F);
    border: 1rpx solid var(--nm-line);

    .dish-ico {
      font-size: 56rpx;
      line-height: 1;
      filter: drop-shadow(0 0 14rpx rgba(255, 176, 46, .35));
    }
  }

  .info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .dish-name {
    font-size: 30rpx;
    font-weight: 700;
    line-height: 1.35;
    color: var(--nm-text);
  }

  .meta {
    margin-top: 6rpx;
    font-size: 22rpx;
    color: var(--nm-faint);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 10rpx;
    margin-top: 12rpx;
  }

  .buy {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: auto;
    padding-top: 12rpx;
  }

  .price {
    display: flex;
    align-items: baseline;
    font-family: var(--font-num);
    color: var(--neon-amber);
    text-shadow: 0 0 16rpx rgba(255, 176, 46, .45);

    .cur {
      font-size: 22rpx;
      opacity: .8;
      margin-right: 1rpx;
    }

    .num {
      font-size: 38rpx;
      font-weight: 900;
      letter-spacing: -.01em;
    }

    .unit {
      font-size: 20rpx;
      opacity: .8;
    }
  }
}

/* 标签 */
.tag {
  font-size: 20rpx;
  line-height: 1;
  padding: 6rpx 10rpx;
  border-radius: 6rpx;
  border: 1rpx solid var(--nm-line-2);
  color: var(--nm-muted);
  background: rgba(255, 247, 234, .04);

  &--hot {
    color: var(--neon-magenta);
    border-color: rgba(255, 61, 113, .5);
    background: rgba(255, 61, 113, .10);
  }

  &--veg {
    color: var(--neon-lime);
    border-color: rgba(183, 242, 77, .45);
    background: rgba(183, 242, 77, .08);
  }

  &--new {
    color: var(--neon-cyan);
    border-color: rgba(56, 232, 208, .45);
    background: rgba(56, 232, 208, .08);
  }

  &--sold {
    color: var(--nm-danger);
    border-color: rgba(255, 95, 95, .45);
    background: rgba(255, 95, 95, .08);
  }
}

/* 步进器 */
.stepper {
  display: flex;
  align-items: center;
  gap: 8rpx;

  .step-btn {
    width: 58rpx;
    height: 58rpx;
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
    min-width: 40rpx;
    text-align: center;
    font-family: var(--font-num);
    font-size: 30rpx;
    color: var(--nm-text);
  }
}

/* 选规格 / 已售罄 */
.btn-spec {
  height: 60rpx;
  padding: 0 28rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--neon-amber);
  color: var(--nm-on-accent);
  font-size: 24rpx;
  font-weight: 700;
  box-shadow: 0 0 24rpx rgba(255, 176, 46, .35);

  &.is-disabled {
    background: transparent;
    color: var(--nm-faint);
    border: 1rpx solid var(--nm-line-2);
    box-shadow: none;
    font-weight: 500;
  }
}

.empty {
  padding: 100rpx 0;
  text-align: center;
  font-size: 26rpx;
  color: var(--nm-faint);
}

.list-pad {
  height: 200rpx;
}

/* ============ 底部签筒托盘 ============ */
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
