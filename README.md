# 陈前去广告规则

独立维护的 iPhone 开屏广告 Swiplet：以 [official-swiplets](https://github.com/swipt-automation/official-swiplets) 的去广告项目为基础，合入本仓库自己的 App 规则。与上游项目没有隶属关系。

**订阅：** `https://raw.githubusercontent.com/moneychen003/swipt-ad-rules/subscription/swiplets.json`

在手机 Swipt 的「Swiplet → 添加 → 添加来源」输入上面的链接，安装并启用「陈前开屏助手」。同一时间只启用一个开屏跳过服务，避免重复点击；原版可以停用保留。

雪球识别右下角的「跳过广告 3」式倒计时，高德地图识别右上角的「4 跳过广告」式倒计时。两条规则都限定 App、位置和启动时间，一次只点一下。其它 App 保留上游行为。

[更新工作流](https://github.com/moneychen003/swipt-ad-rules/actions/workflows/sync.yml) 每 6 小时核对一次上游提交，也能手动运行。通过检查才发布独立版本，订阅地址不变。没有变化时不发布；如上游结构改动使补丁无法安全合入，本次失败并保留上一版。设备端通过固定更新地址检查新包；Swipt 显示更新时可在 App 内安装。

[发布记录](https://github.com/moneychen003/swipt-ad-rules/blob/subscription/release.json) 包含固定上游提交、包哈希和对应源代码归档。授权与上游声明见 [LICENSE](LICENSE)。可按记录克隆该上游提交，用 Bun 1.4.4、Node.js 24 运行 `scripts/build-release.sh <干净上游目录> <版本号最后一段> <绝对输出目录> <本仓库提交>` 重建。

若要暂停自动发布，可停用 GitHub Actions 工作流。手机遇到回归时，可停用「陈前开屏助手」并重新启用原版。
