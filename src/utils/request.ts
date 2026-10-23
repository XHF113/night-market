import type { CloudResult } from '@/types'

export { formatPrice, orderStatusMap } from '@/types'

/**
 * 统一调用微信云函数。
 * 约定：云函数返回 { code: 0, message?, data? }；code === 0 视为成功，
 * 直接 resolve data；否则弹出轻提示并 reject。
 */
export function callFunction<T = unknown>(
  name: string,
  data: Record<string, unknown> = {},
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    wx.cloud.callFunction({
      name,
      data,
      success: (res: any) => {
        const result = res.result as CloudResult<T>
        if (result && result.code === 0) {
          resolve(result.data)
        } else {
          uni.showToast({
            title: (result && result.message) || '请求失败',
            icon: 'none',
          })
          reject(result)
        }
      },
      fail: (err: any) => {
        console.error('云函数调用失败', err)
        uni.showToast({
          title: '网络异常，请稍后重试',
          icon: 'none',
        })
        reject(err)
      },
    })
  })
}
