import { defineConfig, presetWind3 } from "unocss";

export default defineConfig({
  presets: [presetWind3({ dark: "class" })],
  theme: {
    fontFamily: {
      sans: 'ui-sans-serif, system-ui, -apple-system, "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", "Noto Sans CJK KR", "Segoe UI", Roboto, sans-serif',
      mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    },
  },
  content: {
    filesystem: ["src/**/*.{tsx,ts}", "public/**/*.html"],
  },
});
