import { defineConfig, presetWind3 } from "unocss";

export default defineConfig({
  presets: [presetWind3({ dark: "class" })],
  content: {
    filesystem: ["src/**/*.{tsx,ts}", "public/**/*.html"],
  },
});
