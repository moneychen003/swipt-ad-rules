export const xueqiuBundleId = "com.xueqiu";
export const xueqiuSkipRule = { label: /^跳过广告\s*[1-5]$/ };

// Xueqiu 15.1.1: "跳过广告 3" at [358, 872, 60, 18] in a 440 × 956 viewport.
export function isXueqiuSplashFrame(frame: readonly number[], screen: { width: number; height: number }) {
  const [x, y, width, height] = frame;
  if (![x, y, width, height, screen.width, screen.height].every(Number.isFinite)) return false;
  if (screen.width <= 0 || screen.height <= 0 || width <= 0 || height <= 0) return false;
  return x >= 0 && y >= 0 && x + width <= screen.width && y + height <= screen.height
    && width <= screen.width * 0.24 && height <= screen.height * 0.11
    && x + width / 2 >= screen.width * 0.72 && y + height / 2 >= screen.height * 0.82;
}
