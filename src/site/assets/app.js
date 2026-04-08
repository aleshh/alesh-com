import { initMondrian } from "./mondrian.js";

window.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("mondrian-canvas");
  const panel = document.querySelector("[data-panel]");
  const dock = document.querySelector(".panel-dock");
  const dockPreview = document.querySelector(".panel-dock-preview");
  const actionButtons = document.querySelectorAll("[data-panel-action]");
  let activeFlight = null;

  if (canvas instanceof HTMLCanvasElement) {
    initMondrian(canvas);
  }

  if (
    !(panel instanceof HTMLElement) ||
    !(dock instanceof HTMLButtonElement) ||
    !(dockPreview instanceof HTMLElement) ||
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

  const buildPanelClone = () => {
    const previewPanel = panel.cloneNode(true);

    if (!(previewPanel instanceof HTMLElement)) {
      return null;
    }

    previewPanel.removeAttribute("data-panel");
    previewPanel.classList.add("panel-dock-preview-panel");

    previewPanel.querySelectorAll("[data-panel-action]").forEach((element) => {
      element.removeAttribute("data-panel-action");

      if (element instanceof HTMLButtonElement) {
        element.disabled = true;
        element.tabIndex = -1;
      }
    });

    return previewPanel;
  };

  const syncDockPreview = () => {
    const panelRect = panel.getBoundingClientRect();
    const dockRect = dock.getBoundingClientRect();
    const scale = dockRect.width / panelRect.width;
    const previewPanel = buildPanelClone();

    if (!previewPanel) {
      return;
    }

    dockPreview.replaceChildren(previewPanel);
    dockPreview.style.setProperty("--dock-preview-width", `${panelRect.width}px`);
    dockPreview.style.setProperty("--dock-preview-scale", `${scale}`);
  };

  const cancelAnimations = () => {
    panel.getAnimations().forEach((animation) => animation.cancel());
    dock.getAnimations().forEach((animation) => animation.cancel());
    activeFlight?.getAnimations().forEach((animation) => animation.cancel());

    if (activeFlight) {
      activeFlight.remove();
      activeFlight = null;
    }
  };

  const getRects = () => {
    const panelRect = panel.getBoundingClientRect();
    const dockRect = dock.getBoundingClientRect();
    const scale = dockRect.width / panelRect.width;
    const visibleHeight = dockRect.height / scale;
    const cropBottom = Math.max(0, panelRect.height - visibleHeight);

    return { panelRect, dockRect, scale, cropBottom };
  };

  const setPanelVisible = (visible) => {
    panel.style.visibility = visible ? "" : "hidden";
    panel.style.pointerEvents = visible ? "" : "none";
  };

  const createFlight = (left, top, contentWidth, contentHeight) => {
    const flight = document.createElement("div");
    const clone = buildPanelClone();

    if (!clone) {
      return null;
    }

    flight.className = "panel-flight";
    flight.style.left = `${left}px`;
    flight.style.top = `${top}px`;
    flight.style.width = `${contentWidth}px`;
    flight.style.height = `${contentHeight}px`;
    flight.style.borderRadius = getComputedStyle(panel).borderRadius;
    clone.style.setProperty("--panel-flight-width", `${contentWidth}px`);
    clone.classList.add("panel-flight-panel");

    flight.append(clone);
    document.body.append(flight);
    activeFlight = flight;

    return { flight, clone };
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
    syncDockPreview();
    setPanelState("minimizing");
    const { panelRect, dockRect, scale, cropBottom } = getRects();
    const flightState = createFlight(
      panelRect.left,
      panelRect.top,
      panelRect.width,
      panelRect.height
    );

    if (!flightState) {
      return;
    }

    const { flight, clone } = flightState;
    setPanelVisible(false);

    flight.animate(
      [
        {
          transform: "translate(0, 0) scale(1)",
          clipPath: "inset(0px 0px 0px 0px round 22px 22px 18px 18px)",
          borderRadius: getComputedStyle(panel).borderRadius,
          opacity: 1,
          offset: 0,
        },
        {
          transform: "translate(0, 0) scale(1)",
          clipPath: "inset(0px 0px 0px 0px round 22px 22px 18px 18px)",
          borderRadius: getComputedStyle(panel).borderRadius,
          opacity: 1,
          offset: 0.75,
        },
        {
          transform: `translate(${dockRect.left - panelRect.left}px, ${dockRect.top - panelRect.top}px) scale(${scale})`,
          clipPath: `inset(0px 0px ${cropBottom}px 0px round 12px)`,
          borderRadius: getComputedStyle(dock).borderRadius,
          opacity: 1,
          offset: 1,
        },
      ],
      {
        duration: 2000,
        easing: "cubic-bezier(0.2, 0.72, 0.16, 1)",
        fill: "forwards",
      }
    );

    clone.animate(
      [
        {
          opacity: 1,
        },
      ],
      {
        duration: 2000,
        easing: "cubic-bezier(0.2, 0.72, 0.16, 1)",
        fill: "forwards",
      }
    ).onfinish = () => {
      activeFlight?.remove();
      activeFlight = null;
      setPanelState("minimized");
    };
  };

  const restorePanel = (nextState = "normal") => {
    cancelAnimations();
    syncDockPreview();
    setPanelState("restoring");
    const { panelRect, dockRect, scale, cropBottom } = getRects();
    const flightState = createFlight(
      dockRect.left,
      dockRect.top,
      panelRect.width,
      panelRect.height
    );

    if (!flightState) {
      return;
    }

    const { flight, clone } = flightState;
    setPanelVisible(false);
    flight.style.borderRadius = getComputedStyle(dock).borderRadius;
    flight.style.transform = `scale(${scale})`;
    flight.style.clipPath = `inset(0px 0px ${cropBottom}px 0px round 12px)`;

    flight.animate(
      [
        {
          transform: `translate(0, 0) scale(${scale})`,
          clipPath: `inset(0px 0px ${cropBottom}px 0px round 12px)`,
          borderRadius: getComputedStyle(dock).borderRadius,
          opacity: 1,
          offset: 0,
        },
        {
          transform: `translate(0, 0) scale(${scale})`,
          clipPath: `inset(0px 0px ${cropBottom}px 0px round 12px)`,
          borderRadius: getComputedStyle(dock).borderRadius,
          opacity: 1,
          offset: 0.25,
        },
        {
          transform: `translate(${panelRect.left - dockRect.left}px, ${panelRect.top - dockRect.top}px) scale(1)`,
          clipPath: "inset(0px 0px 0px 0px round 22px 22px 18px 18px)",
          borderRadius: getComputedStyle(panel).borderRadius,
          opacity: 1,
          offset: 1,
        },
      ],
      {
        duration: 2000,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "forwards",
      }
    );

    clone.animate(
      [
        {
          opacity: 1,
        },
      ],
      {
        duration: 2000,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "forwards",
      }
    ).onfinish = () => {
      activeFlight?.remove();
      activeFlight = null;
      setPanelVisible(true);
      setPanelState(nextState);
    };
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

  syncDockPreview();
  positionPanelAtMidViewport();
  window.addEventListener("resize", syncDockPreview);
});
