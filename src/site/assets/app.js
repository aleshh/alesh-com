import { initMondrian } from "./mondrian.js";

window.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("mondrian-canvas");
  const panel = document.querySelector("[data-panel]");
  const actionButtons = document.querySelectorAll("[data-panel-action]");

  if (canvas instanceof HTMLCanvasElement) {
    initMondrian(canvas);
  }

  if (!(panel instanceof HTMLElement) || actionButtons.length === 0) {
    return;
  }

  document.body.dataset.panelState = "normal";

  const setPanelState = (nextState) => {
    document.body.dataset.panelState = nextState;
  };

  const scrollPanelIntoView = () => {
    requestAnimationFrame(() => {
      const top = panel.getBoundingClientRect().top + window.scrollY - 30;
      window.scrollTo({
        top: Math.max(0, top),
        behavior: "smooth",
      });
    });
  };

  actionButtons.forEach((button) => {
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    button.addEventListener("click", () => {
      const action = button.dataset.panelAction;

      if (action === "close") {
        setPanelState("hidden");
        return;
      }

      if (action === "minimize") {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
        return;
      }

      if (action === "expand") {
        setPanelState("expanded");
        scrollPanelIntoView();
        return;
      }
    });
  });
});
