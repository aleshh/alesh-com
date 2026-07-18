import { initMondrian } from "./mondrian.js";

window.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("mondrian-canvas");
  const panel = document.querySelector("[data-panel]");
  const panelTitlebar = document.querySelector(".panel-titlebar");
  const panelInner = document.querySelector(".panel-inner");
  const actionButtons = document.querySelectorAll("[data-panel-action]");
  const resizeHandles = document.querySelectorAll("[data-resize]");
  const desktopWindowQuery = window.matchMedia(
    "(min-width: 761px) and (hover: hover) and (pointer: fine)"
  );

  if (canvas instanceof HTMLCanvasElement) {
    initMondrian(canvas);
  }

  if (
    !(panel instanceof HTMLElement) ||
    !(panelTitlebar instanceof HTMLElement) ||
    !(panelInner instanceof HTMLElement) ||
    actionButtons.length === 0
  ) {
    return;
  }

  document.body.dataset.panelState = "normal";

  const setPanelState = (nextState) => {
    document.body.dataset.panelState = nextState;
  };

  const scrollPanelIntoView = () => {
    if (desktopWindowQuery.matches) {
      panelInner.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    requestAnimationFrame(() => {
      const top = panel.getBoundingClientRect().top + window.scrollY - 30;
      window.scrollTo({
        top: Math.max(0, top),
        behavior: "smooth",
      });
    });
  };

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const makePanelPositioned = () => {
    const rect = panel.getBoundingClientRect();

    panel.style.left = `${rect.left}px`;
    panel.style.top = `${rect.top}px`;
    panel.style.width = `${rect.width}px`;
    panel.style.height = `${rect.height}px`;
    panel.style.transform = "none";

    return rect;
  };

  const attachPointerSession = (target, onMove) => (event) => {
    if (!desktopWindowQuery.matches || event.button !== 0) {
      return;
    }

    event.preventDefault();
    target.setPointerCapture(event.pointerId);

    const move = (moveEvent) => onMove(moveEvent);
    const end = () => {
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerup", end);
      target.removeEventListener("pointercancel", end);
    };

    target.addEventListener("pointermove", move);
    target.addEventListener("pointerup", end);
    target.addEventListener("pointercancel", end);
  };

  panelTitlebar.addEventListener("pointerdown", (event) => {
    if (!desktopWindowQuery.matches || event.target.closest("button")) {
      return;
    }

    const rect = makePanelPositioned();
    const startX = event.clientX;
    const startY = event.clientY;
    const titlebarHeight = panelTitlebar.getBoundingClientRect().height;

    attachPointerSession(panelTitlebar, (moveEvent) => {
      const minVisible = 64;
      const left = clamp(
        rect.left + moveEvent.clientX - startX,
        minVisible - rect.width,
        window.innerWidth - minVisible
      );
      const top = clamp(
        rect.top + moveEvent.clientY - startY,
        0,
        window.innerHeight - titlebarHeight
      );

      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
    })(event);
  });

  resizeHandles.forEach((handle) => {
    if (!(handle instanceof HTMLElement)) {
      return;
    }

    handle.addEventListener("pointerdown", (event) => {
      const direction = handle.dataset.resize;

      if (!direction || !desktopWindowQuery.matches || event.button !== 0) {
        return;
      }

      const rect = makePanelPositioned();
      const minWidth = Math.min(440, window.innerWidth - 24);
      const minHeight = Math.min(320, window.innerHeight - 24);

      attachPointerSession(handle, (moveEvent) => {
        const right = rect.left + rect.width;
        const bottom = rect.top + rect.height;
        let left = rect.left;
        let top = rect.top;
        let width = rect.width;
        let height = rect.height;

        if (direction.includes("e")) {
          width = clamp(moveEvent.clientX - rect.left, minWidth, window.innerWidth - rect.left);
        }

        if (direction.includes("s")) {
          height = clamp(moveEvent.clientY - rect.top, minHeight, window.innerHeight - rect.top);
        }

        if (direction.includes("w")) {
          left = clamp(moveEvent.clientX, 0, right - minWidth);
          width = right - left;
        }

        if (direction.includes("n")) {
          top = clamp(moveEvent.clientY, 0, bottom - minHeight);
          height = bottom - top;
        }

        panel.style.left = `${left}px`;
        panel.style.top = `${top}px`;
        panel.style.width = `${width}px`;
        panel.style.height = `${height}px`;
      })(event);
    });
  });

  desktopWindowQuery.addEventListener("change", (event) => {
    if (event.matches) {
      return;
    }

    panel.style.left = "";
    panel.style.top = "";
    panel.style.width = "";
    panel.style.height = "";
    panel.style.transform = "";
  });

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
        if (desktopWindowQuery.matches) {
          panelInner.scrollTo({ top: panelInner.scrollHeight, behavior: "smooth" });
          return;
        }

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
