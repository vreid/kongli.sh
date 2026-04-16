import { defineConfig, presetWind3 } from "unocss";

export default defineConfig({
  presets: [presetWind3({ dark: "class" })],
  theme: {
    fontFamily: {
      sans: '"Nanum Gothic Coding", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    },
  },
  content: {
    filesystem: ["src/**/*.{tsx,ts}", "public/**/*.html"],
  },
});
