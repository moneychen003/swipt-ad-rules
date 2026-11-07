import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const [dist, out, upstream, source, rawCode] = process.argv.slice(2);
const versionCode = Number(rawCode);
if (!dist || !out || !/^[a-f0-9]{40}$/.test(upstream) || !/^[a-f0-9]{40}$/.test(source)
    || !Number.isSafeInteger(versionCode) || versionCode < 1) throw new Error("Invalid release inputs.");
const version = `1.0.${versionCode}`;
const archiveName = "moneychen-splash-skip.swiplet";
const manifest = JSON.parse(readFileSync(join(dist, "swiplets.json"), "utf8"));
const [entry] = manifest.swiplets ?? [];
if (manifest.name !== "MoneyChen Ad Rules" || manifest.swiplets?.length !== 1
    || entry?.id !== "moneychen-splash-skip" || entry.version !== version || entry.versionCode !== versionCode
    || entry.url !== archiveName || entry.service !== true) throw new Error("Unexpected subscription manifest.");
const archive = readFileSync(join(dist, archiveName));
const sha256 = createHash("sha256").update(archive).digest("hex");
if (archive.length !== entry.size || sha256 !== entry.sha256) throw new Error("Manifest archive mismatch.");
const relative = `packages/${version}`;
mkdirSync(join(out, relative), { recursive: true });
entry.url = `${relative}/${archiveName}`;
writeFileSync(join(out, entry.url), archive);
writeFileSync(join(out, "swiplets.json"), JSON.stringify(manifest, null, 2) + "\n");
writeFileSync(join(out, "release.json"), JSON.stringify({
  version, versionCode, upstream, source, archive: entry.url, sha256, size: archive.length,
  correspondingSource: `${relative}/source.tar.gz`,
}, null, 2) + "\n");
