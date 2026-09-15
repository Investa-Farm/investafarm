// Service Worker registration — included on all Investa Farm pages
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .catch(() => {}); // Silently ignore — SW is a progressive enhancement
  });
}
