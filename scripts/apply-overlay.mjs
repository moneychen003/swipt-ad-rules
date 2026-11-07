import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { join } from "node:path";
import { exactSplashRules } from "../overlay/exact-splash.ts";

const [root, codeArg] = process.argv.slice(2);
const versionCode = Number(codeArg);
if (!root || !Number.isSafeInteger(versionCode) || versionCode < 1) throw new Error("Expected an upstream checkout and positive version code.");
const version = `1.0.${versionCode}`;
const dir = join(root, "skip-chinese-ads");
const rulesPath = join(dir, "src/rules.ts");
const extensionPath = join(dir, "src/extension.ts");
const packagePath = join(dir, "package.json");
const sourcePath = join(root, "package.json");
const localesPath = join(dir, "locales.json");
const read = path => readFileSync(path, "utf8");
const one = (source, anchor, updated) => {
  const offset = source.indexOf(anchor);
  if (offset < 0 || source.indexOf(anchor, offset + anchor.length) >= 0)
    throw new Error(`Official source changed near: ${anchor.slice(0, 85)}`);
  return source.slice(0, offset) + updated + source.slice(offset + anchor.length);
};

let rules = read(rulesPath);
const registry = "export const rules: Record<string, (Rule | Rule[])[]> = {";
rules = one(rules, registry, 'import { exactSplashRules } from "./moneychen-exact-splash";\n\n' + registry);
for (const app of exactSplashRules.keys()) {
  const quoted = JSON.stringify(app);
  const selector = `exactSplashRules.get(${quoted})!.selector`;
  const escaped = app.replaceAll(".", "\\.");
  const existing = [...rules.matchAll(new RegExp(`^\\s*["']${escaped}["']:\\s*\\[`, "gm"))];
  if (existing.length === 1) {
    const anchor = existing[0][0];
    rules = one(rules, anchor, anchor + selector + ", ");
  } else if (existing.length === 0 && !rules.includes(quoted) && !rules.includes(`'${app}'`)) {
    rules = one(rules, registry, registry + `\n  ${quoted}: [${selector}],`);
  } else {
    throw new Error(`Cannot merge the upstream entry for ${app} safely.`);
  }
}

let extension = read(extensionPath);
const importAnchor = '} from "./rules";';
extension = one(extension, importAnchor, importAnchor + '\nimport { exactSplashRules, isExactSplashFrame } from "./moneychen-exact-splash";');
extension = one(extension,
  "  const selectors = (fuzzy ? sdkRules : rules[app].flat()).map((rule) => ({",
  "  const exactRule = exactSplashRules.get(app);\n  const exactTree = exactRule !== undefined;\n" +
  "  const selectors = (exactRule ? [exactRule.selector] : fuzzy ? sdkRules : rules[app].flat()).map((rule) => ({");
extension = one(extension, "    !closePopups\n", "    !closePopups || exactTree\n");
extension = one(extension, "    const watchers = noRecordingApps.has(app)\n",
  "    const watchers = exactTree || noRecordingApps.has(app)\n");

const watchStart = extension.indexOf("  const watchSdk = async () => {");
const watchEnd = extension.indexOf("\n  const watchPopups", watchStart);
if (watchStart < 0 || watchEnd < 0) throw new Error("Cannot identify official tree tap path.");
let watcher = extension.slice(watchStart, watchEnd);
watcher = one(watcher, "      const point = centerOf(found.frame);",
  "      if (exactRule && !isExactSplashFrame(found.frame, screenSize, exactRule.corner)) return;\n" +
  "      const point = centerOf(found.frame);");
watcher = one(watcher, '        await accessibility.tap(found, {\n          timeoutMs: remaining,\n          signal: watchSignal,\n        });',
  '        if (exactTree) {\n          await input.tap(point, { signal: watchSignal });\n' +
  '        } else {\n          await accessibility.tap(found, { timeoutMs: remaining, signal: watchSignal });\n        }');
watcher = one(watcher, '        if ((error as Error).name !== "TimeoutError") {\n          throw error;\n        }',
  '        if ((error as Error).name !== "TimeoutError") {\n          throw error;\n        }\n        if (exactTree) return;');
watcher = one(watcher, "      if (still !== null) {", "      if (still !== null) {\n        if (exactTree) return;");
extension = extension.slice(0, watchStart) + watcher + extension.slice(watchEnd);
// Icons are optional decoration. A native lookup failure must not hide the app list or records.
const iconAnchor = 'export interface SupportedApp {';
extension = one(extension, iconAnchor,
  'async function optionalAppIcon(bundleId: string, signal: AbortSignal) {\n' +
  '  try { return (await device.applicationIcon(bundleId, { signal })).uri; }\n' +
  '  catch { return undefined; }\n' +
  '}\n\n' + iconAnchor);
extension = one(extension, '  icon: string;', '  icon?: string;');
extension = one(extension, 'icon: (await device.applicationIcon(bundleId, { signal })).uri,',
  'icon: await optionalAppIcon(bundleId, signal),');
extension = one(extension, ': (await device.applicationIcon(bundleId, { signal })).uri,',
  ': await optionalAppIcon(bundleId, signal),');


const pkg = JSON.parse(read(packagePath));
const source = JSON.parse(read(sourcePath));
if (pkg.swiplet?.id !== "skip-chinese-ads" || !source.workspaces?.includes("skip-chinese-ads"))
  throw new Error("Unexpected upstream workspace or package ID.");
pkg.version = version;
Object.assign(pkg.swiplet, {
  id: "moneychen-splash-skip", versionCode, name: "MoneyChen Splash Helper",
  updateURL: "https://raw.githubusercontent.com/moneychen003/swipt-ad-rules/subscription/moneychen-splash-skip.swiplet",
  localizedNames: { "zh-Hans": "陈前开屏助手", "zh-Hant": "陳前開屏助手", "zh-Hant-HK": "陳前開屏助手" },
});
source.source = {
  name: "MoneyChen Ad Rules", localizedNames: { "zh-Hans": "陈前去广告规则", "zh-Hant": "陳前去廣告規則" },
  icon: { symbol: "forward.end.fill" },
};
copyFileSync(new URL("../overlay/exact-splash.ts", import.meta.url), join(dir, "src/moneychen-exact-splash.ts"));
writeFileSync(rulesPath, rules);
writeFileSync(extensionPath, extension);
writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + "\n");
writeFileSync(sourcePath, JSON.stringify(source, null, 2) + "\n");
const locales = JSON.parse(read(localesPath));
for (const [lang, locale] of Object.entries(locales)) {
  locale.title = lang === "zh-Hans" ? "陈前开屏助手" : lang.startsWith("zh-") ? "陳前開屏助手" : "MoneyChen Splash Helper";
}
writeFileSync(localesPath, JSON.stringify(locales, null, 2) + "\n");
