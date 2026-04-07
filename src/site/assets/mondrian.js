const CFG = {
  border: 20,
  paper: "#f1f1ee",
  page: "#ffffff",
  line: "#111111",
  palette: {
    red: "#d7261e",
    blue: "#1356a2",
    yellow: "#f2d13d",
  },
  minCell: 68,
  splitSnap: 10,
  lineThickness: 12,
  textureAlpha: 0.03,
  shadow: {
    blur: 18,
    alpha: 0.16,
  },
};

const WHITE = "white";

export function initMondrian(canvas) {
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return;
  }

  let resizeTimer = null;
  let root = null;
  let currentFrame = null;

  function render(reset = false) {
    resizeCanvas();
    const frame = getFrame();

    if (reset || !root || !sameFrame(frame, currentFrame)) {
      currentFrame = frame;
      root = makeLeaf(frame.x, frame.y, frame.w, frame.h);
      chooseLayout()(root);
    }

    const { w: viewportWidth, h: viewportHeight } = viewport();

    ctx.fillStyle = CFG.page;
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);

    drawPaintingGround(frame);
    drawNode(root);
    paintPaperTexture(frame);
  }

  function chooseLayout() {
    const r = Math.random();

    if (r < 0.34) return layoutLargeRed;
    if (r < 0.67) return layoutTallRed;
    if (r < 0.87) return layoutOpenField;
    return layoutBalancedGrid;
  }

  function layoutLargeRed(frame) {
    const [top, bottom] = splitH(frame, rand(0.74, 0.81));
    const [leftBand, topCore] = splitV(top, rand(0.16, 0.23));

    let dominant = topCore;

    if (chance(0.72)) {
      const [mainRed, rightStub] = splitV(topCore, rand(0.88, 0.95));
      dominant = mainRed;

      const [stubTop, stubBottom] = splitH(rightStub, rand(0.74, 0.88));
      if (chance(0.55)) colorize(stubTop, CFG.palette.yellow);
      if (chance(0.22)) colorize(stubBottom, CFG.palette.blue);
    }

    colorize(dominant, CFG.palette.red);

    if (chance(0.7)) {
      const [leftTop, leftBottom] = splitH(leftBand, rand(0.32, 0.44));
      if (chance(0.12)) colorize(leftTop, CFG.palette.blue);
      if (chance(0.24)) colorize(leftBottom, CFG.palette.blue);

      if (chance(0.35)) {
        splitH(leftBottom, rand(0.48, 0.62));
      }
    }

    const [bottomLeft, bottomRest] = splitV(bottom, rand(0.18, 0.28));
    const [bottomMid, bottomRight] = splitV(bottomRest, rand(0.58, 0.74));

    if (chance(0.45)) {
      splitH(bottomLeft, rand(0.46, 0.62));
    }

    if (chance(0.18)) colorize(bottomLeft, CFG.palette.blue);
    if (chance(0.2)) colorize(bottomMid, CFG.palette.yellow);

    if (chance(0.38)) {
      splitH(bottomMid, rand(0.3, 0.52));
    }

    if (chance(0.72)) {
      if (chance(0.55)) {
        const [topCell, bottomCell] = splitH(bottomRight, rand(0.24, 0.48));
        if (chance(0.22)) colorize(topCell, CFG.palette.yellow);
        colorize(bottomCell, CFG.palette.blue);
      } else {
        colorize(bottomRight, CFG.palette.blue);
      }
    }
  }

  function layoutTallRed(frame) {
    const [left, right] = splitV(frame, rand(0.56, 0.66));
    const [topLeft, leftMain] = splitH(left, rand(0.17, 0.25));
    const [topRight, rightMain] = splitH(right, rand(0.18, 0.24));
    const [redBlock, rightFoot] = splitH(rightMain, rand(0.72, 0.82));
    const [leftBody, leftFoot] = splitH(leftMain, rand(0.93, 0.97));

    if (chance(0.72)) colorize(topLeft, CFG.palette.yellow);
    if (chance(0.82)) colorize(redBlock, CFG.palette.red);
    if (chance(0.72)) colorize(leftFoot, CFG.palette.blue);

    if (chance(0.55)) {
      const [footLeft, footRight] = splitV(rightFoot, rand(0.45, 0.64));
      if (chance(0.18)) colorize(footLeft, CFG.palette.yellow);
      if (chance(0.12)) colorize(footRight, CFG.palette.blue);
    }

    if (chance(0.42)) {
      splitV(topRight, rand(0.44, 0.58));
    }

    if (chance(0.38)) {
      splitH(leftBody, rand(0.72, 0.86));
    }

    if (chance(0.2)) colorize(topRight, CFG.palette.blue);
  }

  function layoutOpenField(frame) {
    const [topBand, body] = splitH(frame, rand(0.23, 0.3));
    const [blueCell, topRest] = splitV(topBand, rand(0.14, 0.23));
    const [topMid, topRight] = splitV(topRest, rand(0.58, 0.76));
    const [mainField, bottomBand] = splitH(body, rand(0.84, 0.9));
    const [mainCore, rightStrip] = splitV(mainField, rand(0.82, 0.9));
    const [yellowStrip, lowerRight] = splitH(rightStrip, rand(0.6, 0.74));
    const [bottomLeft, bottomRight] = splitV(bottomBand, rand(0.55, 0.66));

    colorize(blueCell, CFG.palette.blue);
    colorize(yellowStrip, CFG.palette.yellow);

    if (chance(0.5)) {
      splitV(topMid, rand(0.44, 0.58));
    }

    if (chance(0.45)) {
      const [redSliver] = splitH(topRight, rand(0.14, 0.24));
      colorize(redSliver, CFG.palette.red);
    }

    if (chance(0.35)) {
      splitV(lowerRight, rand(0.4, 0.64));
    }

    if (chance(0.38)) {
      splitH(bottomLeft, rand(0.42, 0.58));
    }

    if (chance(0.15)) colorize(bottomLeft, CFG.palette.yellow);
    if (chance(0.1)) colorize(bottomRight, CFG.palette.red);

    void mainCore;
  }

  function layoutBalancedGrid(frame) {
    const [top, bottom] = splitH(frame, rand(0.34, 0.42));
    const [topLeft, topRight] = splitV(top, rand(0.32, 0.42));
    const [bottomLeft, bottomRest] = splitV(bottom, rand(0.16, 0.24));
    const [bottomMid, bottomRight] = splitV(bottomRest, rand(0.52, 0.68));
    const [midTop, midBottom] = splitH(bottomMid, rand(0.58, 0.7));
    const [blueCell] = splitH(midBottom, rand(0.84, 0.92));

    colorize(topLeft, CFG.palette.red);
    if (chance(0.78)) colorize(bottomLeft, CFG.palette.yellow);
    colorize(blueCell, CFG.palette.blue);

    if (chance(0.42)) {
      splitV(topRight, rand(0.4, 0.58));
    }

    if (chance(0.45)) {
      splitH(midTop, rand(0.42, 0.58));
    }

    if (chance(0.36)) {
      splitV(bottomRight, rand(0.36, 0.54));
    }

    if (chance(0.18)) colorize(topRight, CFG.palette.yellow);
    if (chance(0.12)) colorize(bottomRight, CFG.palette.red);
  }

  function splitV(node, ratio) {
    return splitNode(node, "v", node.x + node.w * ratio);
  }

  function splitH(node, ratio) {
    return splitNode(node, "h", node.y + node.h * ratio);
  }

  function colorize(node, fill) {
    if (node && node.type === "leaf") node.fill = fill;
    return node;
  }

  function drawPaintingGround(frame) {
    ctx.save();
    ctx.shadowColor = `rgba(0, 0, 0, ${CFG.shadow.alpha})`;
    ctx.shadowBlur = CFG.shadow.blur;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1;
    ctx.fillStyle = CFG.paper;
    ctx.fillRect(frame.x, frame.y, frame.w, frame.h);
    ctx.restore();
  }

  function paintPaperTexture(frame) {
    const hairlineCount = Math.floor((frame.w * frame.h) / 2200);
    const fleckCount = Math.floor((frame.w * frame.h) / 3400);
    const washCount = Math.floor((frame.w * frame.h) / 22000);

    ctx.save();
    ctx.beginPath();
    ctx.rect(frame.x, frame.y, frame.w, frame.h);
    ctx.clip();

    for (let i = 0; i < washCount; i += 1) {
      const x = rand(frame.x, frame.x + frame.w);
      const y = rand(frame.y, frame.y + frame.h);
      const w = rand(80, 180);
      const h = rand(20, 42);
      const alpha = rand(0.003, 0.008);

      ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rand(-0.05, 0.05));
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    for (let i = 0; i < hairlineCount; i += 1) {
      const x = rand(frame.x, frame.x + frame.w);
      const y = rand(frame.y, frame.y + frame.h);
      const w = rand(6, 24);
      const h = rand(1, 2);
      const alpha = rand(0.004, CFG.textureAlpha);

      ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rand(-0.12, 0.12));
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    for (let i = 0; i < fleckCount; i += 1) {
      const x = rand(frame.x, frame.x + frame.w);
      const y = rand(frame.y, frame.y + frame.h);
      const w = rand(1, 3);
      const h = chance(0.7) ? w : rand(1, 4);
      const alpha = rand(0.006, 0.02);
      const shade = chance(0.25) ? 255 : 0;

      ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, ${alpha})`;
      ctx.fillRect(x, y, w, h);
    }

    ctx.restore();
  }

  function drawNode(node) {
    if (!node) return;

    if (node.type === "leaf") {
      ctx.fillStyle = node.fill === WHITE ? CFG.paper : node.fill;
      ctx.fillRect(node.x, node.y, node.w, node.h);
      return;
    }

    drawNode(node.a);
    drawNode(node.b);
    drawSegment(node);
  }

  function drawSegment(segment) {
    const t = CFG.lineThickness;

    ctx.fillStyle = CFG.line;

    if (segment.orientation === "v") {
      ctx.fillRect(segment.pos - t / 2, segment.y, t, segment.h);
    } else {
      ctx.fillRect(segment.x, segment.pos - t / 2, segment.w, t);
    }
  }

  function splitNode(node, orientation, target) {
    if (!node || node.type !== "leaf") return null;

    const min =
      orientation === "v" ? node.x + CFG.minCell : node.y + CFG.minCell;
    const max =
      orientation === "v"
        ? node.x + node.w - CFG.minCell
        : node.y + node.h - CFG.minCell;

    if (max <= min) return null;

    let pos = snap(target / CFG.splitSnap) * CFG.splitSnap;
    pos = clamp(pos, min, max);

    node.type = "split";
    node.orientation = orientation;
    node.pos = pos;
    node.thickness = CFG.lineThickness;

    if (orientation === "v") {
      node.a = makeLeaf(node.x, node.y, pos - node.x, node.h, node.fill, node);
      node.b = makeLeaf(
        pos,
        node.y,
        node.x + node.w - pos,
        node.h,
        node.fill,
        node
      );
    } else {
      node.a = makeLeaf(node.x, node.y, node.w, pos - node.y, node.fill, node);
      node.b = makeLeaf(
        node.x,
        pos,
        node.w,
        node.y + node.h - pos,
        node.fill,
        node
      );
    }

    node.fill = undefined;
    return [node.a, node.b];
  }

  function makeLeaf(x, y, w, h, fill = WHITE, parent = null) {
    return { type: "leaf", x, y, w, h, fill, parent };
  }

  function findLeaf(node, px, py) {
    if (!node || !contains(node, px, py)) return null;
    if (node.type === "leaf") return node;
    return findLeaf(contains(node.a, px, py) ? node.a : node.b, px, py);
  }

  function contains(node, px, py) {
    return (
      px >= node.x &&
      px <= node.x + node.w &&
      py >= node.y &&
      py <= node.y + node.h
    );
  }

  function handleLeftClick(event) {
    const point = pointer(event);
    if (!currentFrame || !contains(currentFrame, point.x, point.y)) return;

    const leaf = findLeaf(root, point.x, point.y);
    if (!leaf) return;

    const sourceFill = leaf.fill;
    const orientation = pickSplitOrientation(leaf, point.x, point.y);
    const children = splitNode(
      leaf,
      orientation,
      pickSplitTarget(leaf, orientation, point.x, point.y)
    );
    if (!children) return;

    if (sourceFill !== WHITE) {
      const coloredChild = chooseColoredChild(leaf, children, point.x, point.y);
      const whiteChild = coloredChild === children[0] ? children[1] : children[0];
      coloredChild.fill = sourceFill;
      whiteChild.fill = WHITE;
    } else {
      children[0].fill = WHITE;
      children[1].fill = WHITE;
    }

    render(false);
  }

  function handleRightClick(event) {
    event.preventDefault();

    const point = pointer(event);
    if (!currentFrame || !contains(currentFrame, point.x, point.y)) return;

    const leaf = findLeaf(root, point.x, point.y);
    if (!leaf) return;

    leaf.fill = nextFill(leaf.fill);
    render(false);
  }

  function chooseColoredChild(parent, children, px, py) {
    const clickedChild =
      parent.orientation === "v"
        ? px <= parent.pos
          ? children[0]
          : children[1]
        : py <= parent.pos
          ? children[0]
          : children[1];
    const other = clickedChild === children[0] ? children[1] : children[0];

    if (area(clickedChild) >= area(other) * 0.35) return clickedChild;
    return area(children[0]) >= area(children[1]) ? children[0] : children[1];
  }

  function pickSplitOrientation(node, px, py) {
    const forced = fullSpanOrientation(node);
    if (forced) return forced;

    let verticalScore = 0.5;
    const aspect = node.w / node.h;

    if (aspect > 1.18) verticalScore += 0.24;
    if (aspect < 0.84) verticalScore -= 0.24;

    if (node.parent) {
      if (node.parent.orientation === "v") verticalScore -= 0.08;
      if (node.parent.orientation === "h") verticalScore += 0.08;
    }

    if (node.fill !== WHITE) {
      verticalScore += node.w >= node.h ? 0.06 : -0.06;
    }

    const relX = (px - node.x) / node.w;
    const relY = (py - node.y) / node.h;
    verticalScore += (relX - 0.5) * 0.12;
    verticalScore -= (relY - 0.5) * 0.12;

    return clamp(verticalScore, 0.15, 0.85) >= 0.5 ? "v" : "h";
  }

  function pickSplitTarget(node, orientation, px, py) {
    if (orientation === "v") {
      const clicked = clamp(
        px,
        node.x + CFG.minCell,
        node.x + node.w - CFG.minCell
      );
      return lerp(clicked, node.x + node.w * preferredVerticalRatio(node), 0.22);
    }

    const clicked = clamp(
      py,
      node.y + CFG.minCell,
      node.y + node.h - CFG.minCell
    );
    return lerp(clicked, node.y + node.h * preferredHorizontalRatio(node), 0.22);
  }

  function preferredVerticalRatio(node) {
    if (node.w > node.h * 1.7) return 0.34;
    if (node.w > node.h * 1.2) return 0.4;
    return 0.5;
  }

  function preferredHorizontalRatio(node) {
    if (node.h > node.w * 1.7) return 0.34;
    if (node.h > node.w * 1.2) return 0.4;
    return 0.5;
  }

  function fullSpanOrientation(node) {
    const spansWidth = spansCanvasWidth(node);
    const spansHeight = spansCanvasHeight(node);

    if (spansWidth && !spansHeight) return "v";
    if (spansHeight && !spansWidth) return "h";
    return null;
  }

  function spansCanvasWidth(node) {
    return (
      Math.abs(node.x - currentFrame.x) <= 0.5 &&
      Math.abs(node.x + node.w - (currentFrame.x + currentFrame.w)) <= 0.5
    );
  }

  function spansCanvasHeight(node) {
    return (
      Math.abs(node.y - currentFrame.y) <= 0.5 &&
      Math.abs(node.y + node.h - (currentFrame.y + currentFrame.h)) <= 0.5
    );
  }

  function getFrame() {
    const { w: viewportWidth, h: viewportHeight } = viewport();
    return {
      x: CFG.border,
      y: CFG.border,
      w: Math.max(120, viewportWidth - CFG.border * 2),
      h: Math.max(120, viewportHeight - CFG.border * 2),
    };
  }

  function sameFrame(a, b) {
    return !!b && a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;
  }

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const { w: displayWidth, h: displayHeight } = viewport();

    canvas.width = Math.round(displayWidth * dpr);
    canvas.height = Math.round(displayHeight * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function viewport() {
    return {
      w: Math.max(1, window.innerWidth),
      h: Math.max(1, window.innerHeight),
    };
  }

  function pointer(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function snap(value) {
    return Math.round(value);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function area(node) {
    return node.w * node.h;
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function chance(probability) {
    return Math.random() < probability;
  }

  function nextFill(current) {
    if (current === WHITE) return CFG.palette.blue;
    if (current === CFG.palette.blue) return CFG.palette.red;
    if (current === CFG.palette.red) return CFG.palette.yellow;
    return WHITE;
  }

  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => render(true), 120);
  });

  canvas.addEventListener("click", handleLeftClick);
  canvas.addEventListener("contextmenu", handleRightClick);

  render(true);
}
