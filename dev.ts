import { cpSync } from "fs";

cpSync("public", "dist", { recursive: true });

Bun.spawn({
  cmd: ["bun", "build", "src/index.tsx", "--outdir", "dist", "--watch"],
  stdio: ["inherit", "inherit", "inherit"],
});

Bun.spawn({
  cmd: ["bunx", "unocss", "src/**/*.{tsx,ts}", "public/**/*.html", "-o", "dist/uno.css", "--watch"],
  stdio: ["inherit", "inherit", "inherit"],
});
