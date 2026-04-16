import { expect, test, describe, beforeAll, beforeEach } from "bun:test";
import { Window } from "happy-dom";

// Boot a happy-dom window and install it as the test global. SyllableView
// reads `location.hash` and touches localStorage at module-import time, so
// the DOM must exist before we require it. The app is mounted once and
// reused across tests; transient state (overlays, hash) is reset in
// beforeEach.

let SyllableViewModule: typeof import("./components/SyllableView");
let m: typeof import("mithril").default;

const HASH_THROTTLE_MS = 150;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

beforeAll(async () => {
  const win = new Window({ url: "https://kongli.sh/" });
  const g = globalThis as unknown as Record<string, unknown>;
  g.window = win;
  g.document = win.document;
  g.location = win.location;
  g.history = win.history;
  g.navigator = win.navigator;
  g.localStorage = win.localStorage;
  g.HTMLElement = win.HTMLElement;
  g.Element = win.Element;
  g.Node = win.Node;
  g.Event = win.Event;
  g.KeyboardEvent = win.KeyboardEvent;
  g.MouseEvent = win.MouseEvent;
  g.getComputedStyle = win.getComputedStyle.bind(win);
  g.requestAnimationFrame = (cb: FrameRequestCallback) =>
    setTimeout(() => cb(performance.now()), 16) as unknown as number;
  g.cancelAnimationFrame = (id: number) => clearTimeout(id);
  (g.window as unknown as { matchMedia: unknown }).matchMedia = (q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent() {
      return false;
    },
  });

  m = (await import("mithril")).default;
  SyllableViewModule = await import("./components/SyllableView");

  const root = document.createElement("div");
  root.id = "app";
  document.body.appendChild(root);
  m.mount(root, SyllableViewModule.default);
  m.redraw.sync();
});

async function dispatchKey(key: string, opts: KeyboardEventInit = {}) {
  document.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, ...opts }));
  m.redraw.sync();
  await sleep(HASH_THROTTLE_MS);
}

beforeEach(async () => {
  // Close any overlay that may still be open from a previous test.
  for (let i = 0; i < 3; i++) {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  }
  m.redraw.sync();
  // Clear storage so each test starts clean.
  localStorage.clear();
  await sleep(HASH_THROTTLE_MS);
});

describe("SyllableView smoke", () => {
  test("mounts and renders the default syllable 가", () => {
    const root = document.getElementById("app")!;
    expect(root.textContent ?? "").toContain("가");
  });

  test("ArrowDown advances the hash", async () => {
    const before = location.hash;
    await dispatchKey("ArrowDown");
    const after = location.hash;
    expect(after).not.toBe("");
    expect(after).not.toBe(before);
  });

  test("ArrowUp retreats from current", async () => {
    await dispatchKey("ArrowDown");
    await dispatchKey("ArrowDown");
    const mid = location.hash;
    await dispatchKey("ArrowUp");
    expect(location.hash).not.toBe("");
    expect(location.hash).not.toBe(mid);
  });

  test("b toggles a bookmark into localStorage", async () => {
    expect(localStorage.getItem("kongli.bookmarks")).toBeNull();
    await dispatchKey("b");
    const raw = localStorage.getItem("kongli.bookmarks");
    expect(raw).not.toBeNull();
    const arr = JSON.parse(raw!);
    expect(Array.isArray(arr)).toBe(true);
    expect(arr.length).toBe(1);
    await dispatchKey("b");
    const arr2 = JSON.parse(localStorage.getItem("kongli.bookmarks")!);
    expect(arr2.length).toBe(0);
  });

  test("m toggles mute and persists to localStorage", async () => {
    await dispatchKey("m");
    expect(localStorage.getItem("kongli.autoScrollMute")).toBe("1");
    await dispatchKey("m");
    expect(localStorage.getItem("kongli.autoScrollMute")).toBe("0");
  });

  // Help overlay last — it leaves overlay state that beforeEach clears with
  // Escape, but we keep it at the end to minimise risk of interfering with
  // other tests if Escape handling ever regresses.
  test("? opens the help overlay", async () => {
    const root = document.getElementById("app")!;
    await dispatchKey("?", { shiftKey: true });
    const text = root.textContent ?? "";
    expect(text.toLowerCase()).toMatch(/shortcut|help|keyboard/);
  });
});
