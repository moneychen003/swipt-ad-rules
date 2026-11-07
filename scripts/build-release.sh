#!/usr/bin/env bash
set -euo pipefail
repo=$(cd "$(dirname "$0")/.." && pwd)
upstream=$(cd "${1:?upstream checkout required}" && pwd)
code=${2:?version code required}
out=${3:?output directory required}
source=${4:?source commit required}
[[ $out = /* ]]
test -z "$(git -C "$upstream" status --porcelain)"
revision=$(git -C "$upstream" rev-parse HEAD)
test "$(bun --version)" = 1.4.4
node --test "$repo/tests/xueqiu.test.mjs"
(cd "$upstream" && bun install --frozen-lockfile)
node "$repo/scripts/apply-overlay.mjs" "$upstream" "$code"
(cd "$upstream/skip-chinese-ads" && bun run check && bun run build)
(cd "$upstream" && node_modules/.bin/swipt project source skip-chinese-ads/dist/moneychen-splash-skip.swiplet)
archive="$upstream/dist/moneychen-splash-skip.swiplet"
unzip -tq "$archive"
unzip -p "$archive" manifest.json | jq -e --arg id moneychen-splash-skip --arg v "1.0.$code" \
  '.id == $id and .version == $v and .versionCode == ($v | split(".")[2] | tonumber)
   and .updateURL == "https://raw.githubusercontent.com/moneychen003/swipt-ad-rules/subscription/moneychen-splash-skip.swiplet"' >/dev/null
node "$repo/scripts/stage-release.mjs" "$upstream/dist" "$out" "$revision" "$source" "$code"
tar -czf "$out/packages/1.0.$code/source.tar.gz" -C "$upstream" \
  LICENSE package.json bun.lock skip-chinese-ads/src skip-chinese-ads/package.json \
  skip-chinese-ads/tsconfig.json skip-chinese-ads/locales.json
