import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { join } from "node:path";

const [root, codeArg] = process.argv.slice(2);
const versionCode = Number(codeArg);
if (!root || !Number.isSafeInteger(versionCode) || versionCode < 1) throw new Error("Expected an upstream checkout and positive version code.");
const version = `1.0.${versionCode}`;
const dir = join(root, "skip-chinese-ads");
const rulesPath = join(dir, "src/rules.ts");
const extensionPath = join(dir, "src/extension.ts");
const packagePath = join(dir, "package.json");
const sourcePath = join(root, "package.json");
const read = path => readFileSync(path, "utf8");
const one = (source, anchor, updated) => {
  const offset = source.indexOf(anchor);
  if (offset < 0 || source.indexOf(anchor, offset + anchor.length) >= 0)
    throw new Error(`Official source changed near: ${anchor.slice(0, 85)}`);
  return source.slice(0, offset) + updated + source.slice(offset + anchor.length);
};

let rules = read(rulesPath);
const registry = "export const rules: Record<string, (Rule | Rule[])[]> = {";
rules = one(rules, registry, 'import { xueqiuSkipRule } from "./moneychen-xueqiu";\n\n' + registry);
const existing = [...rules.matchAll(/^\s*["']com\.xueqiu["']:\s*\[/gm)];
if (existing.length === 1) {
  const anchor = existing[0][0];
  rules = one(rules, anchor, anchor + "xueqiuSkipRule, ");
} else if (existing.length === 0 && !rules.includes("com.xueqiu")) {
  rules = one(rules, registry, registry + '\n  "com.xueqiu": [xueqiuSkipRule],');
} else {
  throw new Error("Cannot merge the upstream Xueqiu entry safely.");
}

let extension = read(extensionPath);
const importAnchor = '} from "./rules";';
extension = one(extension, importAnchor, importAnchor + '\nimport { xueqiuBundleId, xueqiuSkipRule, isXueqiuSplashFrame } from "./moneychen-xueqiu";');
extension = one(extension,
  "  const selectors = (fuzzy ? sdkRules : rules[app].flat()).map((rule) => ({",
  "  const exactTree = app === xueqiuBundleId;\n" +
  "  const selectors = (exactTree ? [xueqiuSkipRule] : fuzzy ? sdkRules : rules[app].flat()).map((rule) => ({");
extension = one(extension, "    !closePopups\n", "    !closePopups || exactTree\n");
extension = one(extension, "    const watchers = noRecordingApps.has(app)\n",
  "    const watchers = exactTree || noRecordingApps.has(app)\n");

const watchStart = extension.indexOf("  const watchSdk = async () => {");
const watchEnd = extension.indexOf("\n  const watchPopups", watchStart);
if (watchStart < 0 || watchEnd < 0) throw new Error("Cannot identify official tree tap path.");
let watcher = extension.slice(watchStart, watchEnd);
watcher = one(watcher, "      const point = centerOf(found.frame);",
  "      if (exactTree && !isXueqiuSplashFrame(found.frame, screenSize)) return;\n" +
  "      const point = centerOf(found.frame);");
watcher = one(watcher, '        if ((error as Error).name !== "TimeoutError") {\n          throw error;\n        }',
  '        if ((error as Error).name !== "TimeoutError") {\n          throw error;\n        }\n        if (exactTree) return;');
watcher = one(watcher, "      if (still !== null) {", "      if (still !== null) {\n        if (exactTree) return;");
extension = extension.slice(0, watchStart) + watcher + extension.slice(watchEnd);

const pkg = JSON.parse(read(packagePath));
const source = JSON.parse(read(sourcePath));
if (pkg.swiplet?.id !== "skip-chinese-ads" || !source.workspaces?.includes("skip-chinese-ads"))
  throw new Error("Unexpected upstream workspace or package ID.");
pkg.version = version;
Object.assign(pkg.swiplet, {
  id: "moneychen-splash-skip", versionCode, name: "MoneyChen Splash Helper",
  localizedNames: { "zh-Hans": "陈前开屏助手", "zh-Hant": "陳前開屏助手", "zh-Hant-HK": "陳前開屏助手" },
});
source.source = {
  name: "MoneyChen Ad Rules", localizedNames: { "zh-Hans": "陈前去广告规则", "zh-Hant": "陳前去廣告規則" },
  icon: { symbol: "forward.end.fill" },
};
copyFileSync(new URL("../overlay/xueqiu.ts", import.meta.url), join(dir, "src/moneychen-xueqiu.ts"));
writeFileSync(rulesPath, rules);
writeFileSync(extensionPath, extension);
writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + "\n");
writeFileSync(sourcePath, JSON.stringify(source, null, 2) + "\n");
