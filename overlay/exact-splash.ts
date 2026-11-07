type Corner = "topRight" | "bottomRight";
type SplashRule = { selector: { label: RegExp }; corner: Corner };

export const exactSplashRules = new Map<string, SplashRule>([
  // Xueqiu 15.1.1: [358, 872, 60, 18] in the 440 × 956 viewport.
  ["com.xueqiu", { selector: { label: /^跳过广告\s*[1-5]$/ }, corner: "bottomRight" }],
  // Amap 17.03.0: [329, 87, 94, 30], with "4 跳过广告" and "2 跳过广告".
  ["com.autonavi.amap", { selector: { label: /^[1-5]\s*跳过广告$/ }, corner: "topRight" }],
]);

export function isExactSplashFrame(
  frame: readonly number[],
  screen: { width: number; height: number },
  corner: Corner,
) {
  const [x, y, width, height] = frame;
  if (![x, y, width, height, screen.width, screen.height].every(Number.isFinite)) return false;
  if (screen.width <= 0 || screen.height <= 0 || width <= 0 || height <= 0) return false;
  if (x < 0 || y < 0 || x + width > screen.width || y + height > screen.height
      || x + width / 2 < screen.width * 0.72) return false;
  const vertical = (y + height / 2) / screen.height;
  if (corner === "topRight") {
    return width <= screen.width * 0.28 && height <= screen.height * 0.075
      && vertical >= 0.06 && vertical <= 0.19;
  }
  return width <= screen.width * 0.24 && height <= screen.height * 0.11 && vertical >= 0.82;
}
