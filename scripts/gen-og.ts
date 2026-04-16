import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import { writeFileSync, existsSync } from "fs";
import { join } from "path";

const W = 1200;
const H = 630;

const windowsFonts = [
  "C:/Windows/Fonts/malgun.ttf",
  "C:/Windows/Fonts/malgunbd.ttf",
  "C:/Windows/Fonts/gulim.ttc",
];
for (const p of windowsFonts) {
  if (existsSync(p)) {
    try {
      GlobalFonts.registerFromPath(p);
    } catch {
      // best-effort
    }
  }
}

const canvas = createCanvas(W, H);
const ctx = canvas.getContext("2d");

ctx.fillStyle = "#000";
ctx.fillRect(0, 0, W, H);

ctx.fillStyle = "#fff";
ctx.textAlign = "center";
ctx.textBaseline = "middle";

const korFamily =
  '"Malgun Gothic", "맑은 고딕", "Apple SD Gothic Neo", "Noto Sans CJK KR", sans-serif';

ctx.font = `700 420px ${korFamily}`;
ctx.fillText("가", W / 2, H / 2 - 30);

ctx.fillStyle = "rgba(255,255,255,0.85)";
ctx.font = `600 56px system-ui, -apple-system, "Segoe UI", sans-serif`;
ctx.fillText("kongli.sh", W / 2, H - 110);

ctx.fillStyle = "rgba(255,255,255,0.55)";
ctx.font = `400 28px system-ui, -apple-system, "Segoe UI", sans-serif`;
ctx.fillText("Scroll through all 11,172 Hangul syllables", W / 2, H - 60);

const out = join(process.cwd(), "public", "og.png");
writeFileSync(out, canvas.toBuffer("image/png"));
console.log(`Wrote ${out}`);
