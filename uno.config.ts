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
        /* Theme palettes. The html element gets the background; the
           transparent, and text color inherits. Vibrant themes also set
           --k-glow to a text-shadow applied on the big glyph. */
        html {
          background: #fff;
          color: #000;
          transition: background 300ms ease, color 300ms ease;
          --k-glow: none;
          --k-accent: #2563eb;
          --k-chrome-bg: rgba(255, 255, 255, 0.7);
          --k-chrome-border: rgba(0, 0, 0, 0.15);
          --k-panel-bg: #fff;
          --k-panel-fg: #000;
        }
        html.dark {
          background: #000;
          color: #fff;
          --k-chrome-bg: rgba(0, 0, 0, 0.7);
          --k-chrome-border: rgba(255, 255, 255, 0.15);
          --k-panel-bg: #171717;
          --k-panel-fg: #fff;
        }
        html.theme-sunset {
          background: linear-gradient(135deg, #ff2e63 0%, #ff7f50 40%, #ffd23f 100%) fixed;
          color: #fff2c8;
          --k-glow: 0 0 32px rgba(255, 220, 150, 0.85), 0 0 4px rgba(0, 0, 0, 0.4);
          --k-accent: #fff2a6;
          --k-chrome-bg: rgba(255, 70, 110, 0.35);
          --k-chrome-border: rgba(255, 240, 180, 0.6);
          --k-panel-bg: rgba(90, 20, 40, 0.85);
          --k-panel-fg: #fff2c8;
        }
        html.theme-neon {
          background: radial-gradient(circle at 25% 20%, #ff00c8 0%, #8b00ff 35%, #0066ff 70%, #00fff0 100%) fixed;
          color: #e6fffb;
          --k-glow: 0 0 18px #00ffea, 0 0 40px #ff00ea;
          --k-accent: #00ffea;
          --k-chrome-bg: rgba(20, 0, 40, 0.55);
          --k-chrome-border: rgba(0, 255, 234, 0.7);
          --k-panel-bg: rgba(10, 0, 30, 0.9);
          --k-panel-fg: #e6fffb;
        }
        html.theme-forest {
          background: linear-gradient(180deg, #052e1a 0%, #0f6b3a 45%, #52b788 85%, #d8f3dc 100%) fixed;
          color: #eaffe0;
          --k-glow: 0 0 24px rgba(180, 255, 180, 0.7);
          --k-accent: #b7e4c7;
          --k-chrome-bg: rgba(10, 50, 30, 0.6);
          --k-chrome-border: rgba(183, 228, 199, 0.6);
          --k-panel-bg: rgba(5, 46, 26, 0.9);
          --k-panel-fg: #eaffe0;
        }
        html.theme-ocean {
          background: linear-gradient(180deg, #001a33 0%, #003f72 35%, #0077b6 70%, #48cae4 100%) fixed;
          color: #e0f4ff;
          --k-glow: 0 0 28px rgba(120, 220, 255, 0.9);
          --k-accent: #90e0ef;
          --k-chrome-bg: rgba(0, 30, 60, 0.55);
          --k-chrome-border: rgba(144, 224, 239, 0.6);
          --k-panel-bg: rgba(0, 26, 51, 0.9);
          --k-panel-fg: #e0f4ff;
        }
        html.theme-candy {
          background: linear-gradient(135deg, #ff3cac 0%, #ff6ec7 30%, #a259ff 65%, #5eead4 100%) fixed;
          color: #fff;
          --k-glow: 0 0 28px rgba(255, 120, 200, 0.85), 0 0 6px rgba(255, 255, 255, 0.6);
          --k-accent: #ffe1f3;
          --k-chrome-bg: rgba(60, 0, 60, 0.45);
          --k-chrome-border: rgba(255, 220, 240, 0.7);
          --k-panel-bg: rgba(50, 10, 60, 0.9);
          --k-panel-fg: #fff;
        }
        .kongli-glyph { text-shadow: var(--k-glow); }
        button, input, .kongli-no-glow { text-shadow: none; }
        /* Palette-aware chrome: only the vibrant themes pull from vars. */
        html[class*="theme-"] .kongli-pill {
          background: var(--k-chrome-bg) !important;
          border-color: var(--k-chrome-border) !important;
          color: inherit !important;
        }
        html[class*="theme-"] .kongli-panel {
          background: var(--k-panel-bg) !important;
          color: var(--k-panel-fg) !important;
          border-color: var(--k-chrome-border) !important;
          backdrop-filter: blur(12px);
        }
        html[class*="theme-"] .kongli-toast {
          background: var(--k-panel-bg) !important;
          color: var(--k-panel-fg) !important;
          border: 1px solid var(--k-chrome-border);
        }
        html[class*="theme-"] .kongli-divider {
          border-color: var(--k-chrome-border) !important;
        }
        /* Accent for active/locked state buttons on palette themes. */
        html[class*="theme-"] .kongli-pill.kongli-active {
          background: var(--k-accent) !important;
          color: #111 !important;
          border-color: var(--k-accent) !important;
          text-shadow: none;
        }



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
          animation-duration: 0.001s !important;
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
