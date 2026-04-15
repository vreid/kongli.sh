import { cpSync, mkdirSync } from "fs";

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

const kb = (n: number) => (n / 1024).toFixed(1);
for (const output of result.outputs) {
  console.log(`  ${output.path.split(/[\\/]/).pop()}  ${kb(output.size)} KB`);
}
