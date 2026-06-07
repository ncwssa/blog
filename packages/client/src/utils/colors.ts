/**
 * 智能颜色生成工具 — 生成与已有颜色视觉差异最大的颜色
 */

/** HSL 颜色对象 */
interface HSL {
  h: number // 0-360
  s: number // 0-100
  l: number // 0-100
}

/** 将 hex 颜色 (#rrggbb) 转换为 HSL */
function hexToHsl(hex: string): HSL {
  let r = 0, g = 0, b = 0
  const clean = hex.replace('#', '')
  if (clean.length === 6) {
    r = parseInt(clean.slice(0, 2), 16) / 255
    g = parseInt(clean.slice(2, 4), 16) / 255
    b = parseInt(clean.slice(4, 6), 16) / 255
  }

  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0, l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 }
}

/** 将 HSL 转换为 hex 字符串 */
function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

/** 计算两个 HSL 颜色的感知距离（加权欧几里得） */
function colorDistance(a: HSL, b: HSL): number {
  // 在 HSL 空间中加权：色相权重最高
  const dh = Math.min(Math.abs(a.h - b.h), 360 - Math.abs(a.h - b.h)) / 360
  const ds = (a.s - b.s) / 100
  const dl = (a.l - b.l) / 100
  // 感知权重：色相 3x，饱和度 1.5x，明度 1x
  return Math.sqrt(3 * dh * dh + 1.5 * ds * ds + dl * dl)
}

/** 预设颜色池（明亮、高饱和度、易于区分） */
const COLOR_PALETTE: string[] = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#14b8a6', '#84cc16', '#a855f7', '#f43f5e',
  '#0ea5e9', '#d946ef', '#10b981', '#f59e0b',
]

/** 生成与已有颜色最大差异的颜色 */
export function generateDistinctColor(existingColors: (string | null | undefined)[]): string {
  // 过滤有效颜色
  const validColors = existingColors
    .filter((c): c is string => !!c && /^#[0-9a-f]{6}$/i.test(c))
    .map(hexToHsl)

  // 如果没有任何已有颜色，从调色板取第一个
  if (validColors.length === 0) return COLOR_PALETTE[0]

  // 如果已有颜色少于调色板长度，优先从调色板中选未使用的
  const usedHexes = new Set(existingColors.filter((c): c is string => !!c))
  for (const color of COLOR_PALETTE) {
    if (!usedHexes.has(color)) return color
  }

  // 已有颜色超过调色板，用黄金角 HSL 生成
  const GOLDEN_ANGLE = 137.508 // 黄金角（度）

  // 以已有颜色的平均色相为起点，每次偏移黄金角
  const avgH = validColors.reduce((s, c) => s + c.h, 0) / validColors.length

  // 从平均色相开始，尝试不同偏移量，选择距离最大的
  let bestColor = '#3b82f6'
  let bestScore = -1

  for (let i = 0; i < 24; i++) {
    const h = (avgH + GOLDEN_ANGLE * Math.max(1, i)) % 360
    // 饱和度 60-85%，明度 45-65%（避免太暗或太亮）
    const s = 65 + (i % 3) * 10
    const l = 50 + (i % 2) * 10
    const candidate: HSL = { h, s, l }

    // 计算与所有已有颜色的最小距离
    const minDist = Math.min(...validColors.map((c) => colorDistance(candidate, c)))

    if (minDist > bestScore) {
      bestScore = minDist
      bestColor = hslToHex(h, s, l)
    }
  }

  return bestColor
}
