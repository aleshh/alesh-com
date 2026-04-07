import { initMondrian } from "./mondrian.js";

window.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("mondrian-canvas");

  if (canvas instanceof HTMLCanvasElement) {
    initMondrian(canvas);
  }
});
