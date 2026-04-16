import { cpSync } from "fs";

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
