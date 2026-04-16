import { describe, expect, test } from "bun:test";
import { createGenerator } from "unocss";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import unoConfig from "../uno.config";

// UnoCSS has a long-standing rough edge: opacity modifiers on the `current`
// color (e.g. `bg-current/20`, `ring-current/40`, `border-current/10`)
// silently collapse to bare `currentColor` with no opacity applied. That
// means tints intended to be subtle render as 100% opaque, producing solid
// black blocks in light mode (or solid white in dark mode). We had two live
// bugs from this in the wild (grid "current" cell and scrubber track), so
// this test generates the actual CSS our source emits and refuses to let
// those utilities come back.
async function generateProjectCss(): Promise<string> {
  const sources = [
    readFileSync(join(import.meta.dir, "components/SyllableView.tsx"), "utf8"),
    readFileSync(join(import.meta.dir, "index.tsx"), "utf8"),
    readFileSync(join(import.meta.dir, "..", "public/index.html"), "utf8"),
  ].join("\n");
  const uno = await createGenerator(unoConfig);
  const { css } = await uno.generate(sources, { preflights: false });
  return css;
}

describe("generated CSS", () => {
  test("contains no collapsed currentColor tints", async () => {
    const css = await generateProjectCss();
    // Any rule that mentions currentColor without an rgb()/color-mix() wrapper
    // is the buggy collapsed form. Border rules can legitimately use bare
    // currentColor (no opacity), so we only flag rules whose selector has
    // `/NN` opacity syntax.
    const offenders: string[] = [];
    const ruleRe = /([^{}]+)\{([^}]*)\}/g;
    let m: RegExpExecArray | null;
    while ((m = ruleRe.exec(css)) !== null) {
      const selector = m[1] ?? "";
      const body = m[2] ?? "";
      if (!selector.includes("\\/")) continue; // no opacity modifier
      if (!body.includes("currentColor")) continue;
      if (/rgb\(|color-mix\(/.test(body)) continue; // properly expanded
      offenders.push(selector.trim());
    }
    expect(offenders).toEqual([]);
  });

  test("source uses no `(bg|border|ring)-current/NN` utilities", () => {
    // Belt-and-braces static check so failures are loud and cite line numbers.
    const src = readFileSync(join(import.meta.dir, "components/SyllableView.tsx"), "utf8");
    const hits: string[] = [];
    src.split("\n").forEach((line, i) => {
      if (/(bg|border|ring)-current\/\d/.test(line)) hits.push(`${i + 1}: ${line.trim()}`);
    });
    expect(hits).toEqual([]);
  });
});
