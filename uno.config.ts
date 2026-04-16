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
        /* Only the big glyph participates in view transitions; the rest
           of the page (toolbar, HUD, neighbor strip, …) must stay live
           so clicks keep landing during rapid auto-scroll. Without this
           opt-out, the root is captured into a ::view-transition-group
           overlay that intercepts pointer events. */
        html { view-transition-name: none; }

        /* Belt-and-braces: the transition overlay and every captured
           pseudo must never swallow pointer events. Some engines still
           rasterize a root snapshot that covers the viewport, which
           gates clicks on the HUD during the animation window. */
        ::view-transition,
        ::view-transition-group(root),
        ::view-transition-image-pair(root),
        ::view-transition-old(root),
        ::view-transition-new(root),
        ::view-transition-group(big-glyph),
        ::view-transition-image-pair(big-glyph),
        ::view-transition-old(big-glyph),
        ::view-transition-new(big-glyph) {
          pointer-events: none;
        }
        ::view-transition-group(root),
        ::view-transition-image-pair(root),
        ::view-transition-old(root),
        ::view-transition-new(root) {
          animation: none !important;
          display: none !important;
        }

        /* View transition: short crossfade on the big glyph when the
           index lands. Honors prefers-reduced-motion via media query. */
        @media (prefers-reduced-motion: no-preference) {
          ::view-transition-old(big-glyph),
          ::view-transition-new(big-glyph) {
            animation-duration: 120ms;
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
