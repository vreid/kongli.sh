import "@unocss/reset/tailwind.css";
import m from "mithril";
import SyllableView from "./components/SyllableView";

m.mount(document.getElementById("app")!, SyllableView);

// Service worker: only register in production (not on localhost / file://)
const isProd =
  location.protocol.startsWith("http") &&
  !["localhost", "127.0.0.1", ""].includes(location.hostname);

if (isProd && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .then((reg) => {
        reg.addEventListener("updatefound", () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener("statechange", () => {
            if (nw.state === "installed" && navigator.serviceWorker.controller) {
              // ServiceWorker.postMessage takes no targetOrigin (unlike Window.postMessage)
              // oxlint-disable-next-line unicorn/require-post-message-target-origin
              showUpdateToast(() => nw.postMessage("SKIP_WAITING"));
            }
          });
        });
        return reg;
      })
      .catch(() => {
        // SW registration is best-effort; ignore failures
      });

    let reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloaded) return;
      reloaded = true;
      location.reload();
    });
  });
}

function showUpdateToast(onReload: () => void) {
  if (document.getElementById("sw-update-toast")) return;
  const root = document.createElement("div");
  root.id = "sw-update-toast";
  root.className =
    "fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-3 py-2 rounded-md " +
    "bg-black text-white dark:bg-white dark:text-black text-sm shadow-lg " +
    "flex items-center gap-3";
  root.setAttribute("role", "status");
  root.setAttribute("aria-live", "polite");

  const text = document.createElement("span");
  text.textContent = "New version available";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = "Reload";
  btn.className = "underline opacity-80 hover:opacity-100 cursor-pointer";
  btn.addEventListener("click", onReload);

  root.appendChild(text);
  root.appendChild(btn);
  document.body.appendChild(root);
}
