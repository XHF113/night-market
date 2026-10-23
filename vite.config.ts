import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import fs from 'node:fs'
import path from 'node:path'

// 构建完成后：把 cloudfunctionRoot 注入产物 project.config.json，
// 并把源码 cloudfunctions 同步进小程序产物目录，免去每次手动复制。
// build 模式在 closeBundle 注入（project.config.json 此时已生成）；
// dev 模式 closeBundle 不触发，改用 buildStart 注入。
function syncCloudFunctions() {
  let outDir = ''
  const run = () => {
    try {
      if (!outDir || !fs.existsSync(outDir)) return
      const cfgPath = path.join(outDir, 'project.config.json')
      if (fs.existsSync(cfgPath)) {
        const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'))
        cfg.cloudfunctionRoot = 'cloudfunctionRoot' in cfg ? cfg.cloudfunctionRoot : 'cloudfunctions/'
        fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2))
      }
      const src = path.resolve(process.cwd(), 'cloudfunctions')
      const dst = path.join(outDir, 'cloudfunctions')
      if (fs.existsSync(src)) {
        fs.cpSync(src, dst, { recursive: true })
        console.log('[sync-cloud] 已同步云函数到', dst)
      }
    } catch (e) {
      console.warn('[sync-cloud]', (e as Error).message)
    }
  }
  return {
    name: 'sync-cloud-functions',
    configResolved(config) {
      outDir = config.build.outDir
    },
    buildStart() {
      run()
    },
    closeBundle() {
      run()
    },
  }
}

export default defineConfig({
  plugins: [uni(), syncCloudFunctions()],
})
