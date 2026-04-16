import { defineConfig, presetWind3 } from "unocss";

export default defineConfig({
  presets: [presetWind3({ dark: "class" })],
  theme: {
    fontFamily: {
      sans: 'ui-sans-serif, system-ui, -apple-system, "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", "Noto Sans CJK KR", "Segoe UI", Roboto, sans-serif',
      mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    },
  },
  preflights: [
    {
      getCSS: () => `
        /* View transition: short crossfade on the big glyph when the
           index lands. Honors prefers-reduced-motion via media query. */
        @media (prefers-reduced-motion: no-preference) {
          ::view-transition-old(big-glyph),
          ::view-transition-new(big-glyph) {
            animation-duration: 160ms;
            animation-timing-function: ease-out;
          }
          ::view-transition-old(big-glyph) {
            animation-name: kongli-fade-out;
          }
          ::view-transition-new(big-glyph) {
            animation-name: kongli-fade-in;
          }
          @keyframes kongli-fade-out {
            to { opacity: 0; }
          }
          @keyframes kongli-fade-in {
            from { opacity: 0; }
          }
        }
        @media (prefers-reduced-motion: reduce) {
          ::view-transition-old(big-glyph),
          ::view-transition-new(big-glyph) {
            animation: none;
          }
        }
      `,
    },
  ],
  content: {
    filesystem: ["src/**/*.{tsx,ts}", "public/**/*.html"],
  },
});
