import assert from "node:assert/strict";
import test from "node:test";
import { isXueqiuSplashFrame, xueqiuSkipRule } from "../overlay/xueqiu.ts";

test("matches the observed countdown, not common controls or ad content", () => {
  for (const title of ["跳过广告 3", "跳过广告 1", "跳过广告5"]) assert.match(title, xueqiuSkipRule.label);
  for (const title of ["跳过", "跳过广告", "广告, 18, 分享, 加自选", "跳过广告 30", "跳过广告 0"])
    assert.doesNotMatch(title, xueqiuSkipRule.label);
});

test("accepts the observed bottom-right control and rejects outside or oversize frames", () => {
  const screen = { width: 440, height: 956 };
  assert.equal(isXueqiuSplashFrame([358, 872, 60, 18], screen), true);
  for (const frame of [[358, 92, 60, 18], [8, 872, 60, 18], [50, 810, 350, 140], [400, 900, 60, 18], [380, 890, 0, 18]])
    assert.equal(isXueqiuSplashFrame(frame, screen), false);
});
