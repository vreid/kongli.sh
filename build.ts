import { cpSync, readFileSync, writeFileSync } from "fs";

const result = await Bun.build({
  entrypoints: ["src/index.tsx"],
  outdir: "dist",
  minify: true,
  naming: "[name].[ext]",
});

if (!result.success) {
  console.error("Build failed:");
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

cpSync("public", "dist", { recursive: true });

// Stamp the service worker with a unique cache version per build
const swPath = "dist/sw.js";
const cacheVersion = Date.now().toString();
writeFileSync(swPath, readFileSync(swPath, "utf-8").replace("__CACHE_VERSION__", cacheVersion));

const uno = Bun.spawnSync({
  cmd: [
    "bunx",
    "unocss",
    "src/**/*.{tsx,ts}",
    "public/**/*.html",
    "-o",
    "dist/uno.css",
    "--minify",
  ],
  stdio: ["inherit", "inherit", "inherit"],
});
if (uno.exitCode !== 0) {
  console.error("UnoCSS build failed");
  process.exit(1);
}

const kb = (n: number) => (n / 1024).toFixed(1);
for (const output of result.outputs) {
  console.log(`  ${output.path.split(/[\\/]/).pop()}  ${kb(output.size)} KB`);
}
