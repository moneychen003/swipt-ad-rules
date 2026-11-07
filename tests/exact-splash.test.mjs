import assert from "node:assert/strict";
import test from "node:test";
import { exactSplashRules, isExactSplashFrame } from "../overlay/exact-splash.ts";

const xueqiu = exactSplashRules.get("com.xueqiu");
const amap = exactSplashRules.get("com.autonavi.amap");
const screen = { width: 440, height: 956 };

test("each app matches its observed countdown, not unrelated controls", () => {
  for (const title of ["跳过广告 3", "跳过广告 1", "跳过广告5"]) assert.match(title, xueqiu.selector.label);
  for (const title of ["4 跳过广告", "2 跳过广告"]) assert.match(title, amap.selector.label);
  for (const title of ["跳过", "跳过广告", "跳过动画", "跳过广告 30", "0 跳过广告", "重新导航"]) {
    assert.doesNotMatch(title, xueqiu.selector.label);
    assert.doesNotMatch(title, amap.selector.label);
  }
  assert.doesNotMatch("4 跳过广告", xueqiu.selector.label);
  assert.doesNotMatch("跳过广告 3", amap.selector.label);
  assert.equal(exactSplashRules.has("com.example.unconfigured"), false);
});

test("requires the matching corner and rejects large, off-screen, or status-bar targets", () => {
  const bottom = [358, 872, 60, 18], top = [329, 87, 94, 30];
  assert.equal(isExactSplashFrame(bottom, screen, xueqiu.corner), true);
  assert.equal(isExactSplashFrame(top, screen, amap.corner), true);
  assert.equal(isExactSplashFrame(top, screen, xueqiu.corner), false);
  assert.equal(isExactSplashFrame(bottom, screen, amap.corner), false);
  for (const frame of [[8, 872, 60, 18], [50, 810, 350, 140], [400, 900, 60, 18], [380, 890, 0, 18]])
    assert.equal(isExactSplashFrame(frame, screen, xueqiu.corner), false);
  for (const frame of [[329, 12, 94, 30], [10, 87, 94, 30], [270, 65, 160, 110], [350, 85, 95, 30]])
    assert.equal(isExactSplashFrame(frame, screen, amap.corner), false);
});
