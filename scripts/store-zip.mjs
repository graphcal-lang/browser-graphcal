// The zip uploaded to the Chrome Web Store: dist/ as built, except that the
// manifest's `key` is left out (the Store sets the id itself) and, when the
// private key is given, it is put at the zip's root as key.pem so the first
// upload keeps the id the viewer knows. The key is read from the path in
// GRAPHCAL_EXTENSION_KEY and never enters the repository.
//
//   GRAPHCAL_EXTENSION_KEY=../chrome-graphcal.key.pem node scripts/store-zip.mjs
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const out = join(root, "chrome-graphcal-store.zip");
if (!existsSync(join(dist, "manifest.json")))
  throw new Error("build first: dist/manifest.json is missing");

const stage = mkdtempSync(join(tmpdir(), "chrome-graphcal-"));
try {
  cpSync(dist, stage, { recursive: true });
  const manifest = JSON.parse(readFileSync(join(stage, "manifest.json"), "utf8"));
  delete manifest.key;
  writeFileSync(join(stage, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  const key = process.env.GRAPHCAL_EXTENSION_KEY;
  if (key) cpSync(resolve(key), join(stage, "key.pem"));
  rmSync(out, { force: true });
  execFileSync("zip", ["-qr", "-X", out, "."], { cwd: stage });
  console.log(
    `wrote ${out}${key ? " (with key.pem)" : " (no key.pem: the Store will choose the id)"}`,
  );
} finally {
  rmSync(stage, { recursive: true, force: true });
}
