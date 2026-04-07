import { initMondrian } from "./mondrian.js";

window.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("mondrian-canvas");
  const panel = document.querySelector("[data-panel]");
  const dock = document.querySelector(".panel-dock");
  const actionButtons = document.querySelectorAll("[data-panel-action]");

  if (canvas instanceof HTMLCanvasElement) {
    initMondrian(canvas);
  }

  if (
    !(panel instanceof HTMLElement) ||
    !(dock instanceof HTMLButtonElement) ||
    actionButtons.length === 0
  ) {
    return;
  }

  document.body.dataset.panelState = "normal";
  document.documentElement.dataset.panelState = "normal";

  const setPanelState = (nextState) => {
    document.body.dataset.panelState = nextState;
    document.documentElement.dataset.panelState = nextState;
  };

  const positionPanelAtMidViewport = () => {
    if (window.scrollY > 2 || window.location.hash) {
      return;
    }

    requestAnimationFrame(() => {
      const naturalTop = panel.getBoundingClientRect().top + window.scrollY;
      const desiredTop = Math.round(window.innerHeight * 0.5);
      const targetScroll = Math.max(0, naturalTop - desiredTop);

      if (targetScroll > 0) {
        window.scrollTo(0, targetScroll);
      }
    });
  };

  const cancelAnimations = () => {
    panel.getAnimations().forEach((animation) => animation.cancel());
    dock.getAnimations().forEach((animation) => animation.cancel());
  };

  const getDockMotion = () => {
    const panelRect = panel.getBoundingClientRect();
    const dockRect = dock.getBoundingClientRect();
    const panelCenterX = panelRect.left + panelRect.width / 2;
    const panelCenterY = panelRect.top + panelRect.height / 2;
    const dockCenterX = dockRect.left + dockRect.width / 2;
    const dockCenterY = dockRect.top + dockRect.height / 2;

    return {
      deltaX: dockCenterX - panelCenterX,
      deltaY: dockCenterY - panelCenterY,
      scale: Math.max(
        0.14,
        Math.min(dockRect.width / panelRect.width, dockRect.height / panelRect.height)
      ),
    };
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

  const minimizePanel = () => {
    cancelAnimations();
    setPanelState("minimizing");

    const { deltaX, deltaY, scale } = getDockMotion();

    panel.animate(
      [
        { transform: "translate(0, 0) scale(1)", opacity: 1 },
        {
          transform: `translate(${deltaX}px, ${deltaY}px) scale(${scale})`,
          opacity: 0.18,
        },
      ],
      {
        duration: 360,
        easing: "cubic-bezier(0.3, 0.05, 0.25, 1)",
        fill: "forwards",
      }
    ).onfinish = () => {
      setPanelState("minimized");
    };

    dock.animate(
      [
        { transform: "translate(-50%, 18px) scale(0.82)", opacity: 0 },
        { transform: "translate(-50%, 0) scale(1)", opacity: 1 },
      ],
      {
        duration: 280,
        delay: 120,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "forwards",
      }
    );
  };

  const restorePanel = (nextState = "normal") => {
    cancelAnimations();

    const { deltaX, deltaY, scale } = getDockMotion();
    setPanelState("restoring");

    panel.animate(
      [
        {
          transform: `translate(${deltaX}px, ${deltaY}px) scale(${scale})`,
          opacity: 0.18,
        },
        { transform: "translate(0, 0) scale(1)", opacity: 1 },
      ],
      {
        duration: 360,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "both",
      }
    ).onfinish = () => {
      setPanelState(nextState);
    };

    dock.animate(
      [
        { transform: "translate(-50%, 0) scale(1)", opacity: 1 },
        { transform: "translate(-50%, 18px) scale(0.82)", opacity: 0 },
      ],
      {
        duration: 220,
        easing: "cubic-bezier(0.4, 0, 1, 1)",
        fill: "forwards",
      }
    );
  };

  actionButtons.forEach((button) => {
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    button.addEventListener("click", () => {
      const action = button.dataset.panelAction;

      if (action === "close") {
        cancelAnimations();
        setPanelState("hidden");
        return;
      }

      if (action === "minimize") {
        minimizePanel();
        return;
      }

      if (action === "expand") {
        if (document.body.dataset.panelState === "minimized") {
          restorePanel("expanded");
          scrollPanelIntoView();
          return;
        }
        setPanelState("expanded");
        scrollPanelIntoView();
        return;
      }

      if (action === "restore") {
        restorePanel();
      }
    });
  });

  positionPanelAtMidViewport();
});
