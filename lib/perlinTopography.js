//////////////////////////////////////////////////////////////
// PERLIN NOISE (adaptasi p5.js)
//////////////////////////////////////////////////////////////

const PERLIN_YWRAPB = 4;
const PERLIN_YWRAP = 1 << PERLIN_YWRAPB;
const PERLIN_ZWRAPB = 8;
const PERLIN_ZWRAP = 1 << PERLIN_ZWRAPB;
const PERLIN_SIZE = 4095;

let perlin_octaves = 4;
let perlin_amp_falloff = 0.5;

const scaled_cosine = (i) => 0.5 * (1.0 - Math.cos(i * Math.PI));

let perlin;

function noise(x, y = 0, z = 0) {
  if (perlin == null) {
    perlin = new Array(PERLIN_SIZE + 1);
    for (let i = 0; i < PERLIN_SIZE + 1; i++) {
      perlin[i] = Math.random();
    }
  }

  if (x < 0) x = -x;
  if (y < 0) y = -y;
  if (z < 0) z = -z;

  let xi = Math.floor(x),
    yi = Math.floor(y),
    zi = Math.floor(z);
  let xf = x - xi;
  let yf = y - yi;
  let zf = z - zi;
  let rxf, ryf;

  let r = 0;
  let ampl = 0.5;

  let n1, n2, n3;

  for (let o = 0; o < perlin_octaves; o++) {
    let of = xi + (yi << PERLIN_YWRAPB) + (zi << PERLIN_ZWRAPB);

    rxf = scaled_cosine(xf);
    ryf = scaled_cosine(yf);

    n1 = perlin[of & PERLIN_SIZE];
    n1 += rxf * (perlin[(of + 1) & PERLIN_SIZE] - n1);
    n2 = perlin[(of + PERLIN_YWRAP) & PERLIN_SIZE];
    n2 += rxf * (perlin[(of + PERLIN_YWRAP + 1) & PERLIN_SIZE] - n2);
    n1 += ryf * (n2 - n1);

    of += PERLIN_ZWRAP;
    n2 = perlin[of & PERLIN_SIZE];
    n2 += rxf * (perlin[(of + 1) & PERLIN_SIZE] - n2);
    n3 = perlin[(of + PERLIN_YWRAP) & PERLIN_SIZE];
    n3 += rxf * (perlin[(of + PERLIN_YWRAP + 1) & PERLIN_SIZE] - n3);
    n2 += ryf * (n3 - n2);

    n1 += scaled_cosine(zf) * (n2 - n1);

    r += n1 * ampl;
    ampl *= perlin_amp_falloff;
    xi <<= 1;
    xf *= 2;
    yi <<= 1;
    yf *= 2;
    zi <<= 1;
    zf *= 2;

    if (xf >= 1.0) {
      xi++;
      xf--;
    }
    if (yf >= 1.0) {
      yi++;
      yf--;
    }
    if (zf >= 1.0) {
      zi++;
      zf--;
    }
  }
  return r;
}

//////////////////////////////////////////////////////////////
// MARCHING SQUARES + INISIALISASI CANVAS
//////////////////////////////////////////////////////////////

export function startPerlinTopography(canvas, options = {}) {
  if (!canvas) return () => {};

  // Editable
  let thresholdIncrement = 5;
  let thickLineThresholdMultiple = 3;
  let res = 8;
  let baseZOffset = 0.0008;
  // Warna garis: bisa di-override via options.lineColor; default baca dari CSS var --foreground
  let lineColor = options.lineColor || (() => {
    try {
      const root = getComputedStyle(document.documentElement);
      const fg = (root.getPropertyValue("--foreground") || "").trim();
      if (fg) return toRgbaFromHexOrCss(fg, 0.5);
    } catch (_) {}
    // Fallback ke warna terang semi-transparan
    return "#EDEDEDB3"; // ~70% alpha untuk terlihat di background terang
  })();

  let ctx = canvas.getContext("2d");
  let frameValues = [];
  let inputValues = [];

  let currentThreshold = 0;
  let cols = 0;
  let rows = 0;
  let zOffset = 0;
  let zBoostValues = [];
  let noiseMin = 100;
  let noiseMax = 0;

  let mousePos = { x: -99, y: -99 };
  let mouseDown = false;

  const handleResize = () => {
    const dpr = window.devicePixelRatio || 1;
    let size;
    try {
      if (typeof options.getSize === "function") {
        size = options.getSize();
      }
    } catch (_) {}
    const width = (size && size.width) || canvas.clientWidth || window.innerWidth;
    const height = (size && size.height) || canvas.clientHeight || window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    cols = Math.floor(width / res) + 1;
    rows = Math.floor(height / res) + 1;

    zBoostValues = [];
    for (let y = 0; y < rows; y++) {
      zBoostValues[y] = [];
      for (let x = 0; x <= cols; x++) {
        zBoostValues[y][x] = 0;
      }
    }
  };

  const handleMouseMove = (e) => {
    const rect = canvas.getBoundingClientRect();
    mousePos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = () => {
    mouseDown = true;
  };
  const handleMouseUp = () => {
    mouseDown = false;
  };
  const handleMouseLeave = () => {
    mouseDown = false;
  };

  window.addEventListener("resize", handleResize);
  let resizeObserver;
  try {
    if (options.observeElement && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => handleResize());
      resizeObserver.observe(options.observeElement);
    }
  } catch (_) {}
  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("mousedown", handleMouseDown);
  canvas.addEventListener("mouseup", handleMouseUp);
  canvas.addEventListener("mouseleave", handleMouseLeave);

  handleResize();

  let animationFrameId;

  const animate = () => {
    const startTime = performance.now();

    if (mouseDown) {
      mouseOffset();
    }

    // Bersihkan dengan ukuran CSS pixel (karena context sudah di-scale ke DPR)
    ctx.clearRect(0, 0, canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight);

    zOffset += baseZOffset;
    generateNoise();

    const roundedNoiseMin =
      Math.floor(noiseMin / thresholdIncrement) * thresholdIncrement;
    const roundedNoiseMax =
      Math.ceil(noiseMax / thresholdIncrement) * thresholdIncrement;

    for (
      let threshold = roundedNoiseMin;
      threshold < roundedNoiseMax;
      threshold += thresholdIncrement
    ) {
      currentThreshold = threshold;
      renderAtThreshold();
    }

    noiseMin = 100;
    noiseMax = 0;

    const endTime = performance.now();
    const frameDuration = endTime - startTime;
    const fps = 1000 / frameDuration;
    frameValues.push(fps);
    if (frameValues.length > 60) {
      // bisa dipakai kalau mau tampilkan FPS
      frameValues = [];
    }

    animationFrameId = requestAnimationFrame(animate);
  };

  // Mulai animasi pertama kali
  animationFrameId = requestAnimationFrame(animate);

  function mouseOffset() {
    let x = Math.floor(mousePos.x / res);
    let y = Math.floor(mousePos.y / res);
    if (!inputValues[y] || inputValues[y][x] === undefined) return;

    const incrementValue = 0.0025;
    const radius = 5;

    for (let i = -radius; i <= radius; i++) {
      for (let j = -radius; j <= radius; j++) {
        const yy = y + i;
        const xx = x + j;
        if (yy < 0 || xx < 0 || yy >= rows || xx >= cols) continue;

        const distanceSquared = i * i + j * j;
        const radiusSquared = radius * radius;

        if (distanceSquared <= radiusSquared) {
          zBoostValues[yy][xx] +=
            incrementValue * (1 - distanceSquared / radiusSquared);
        }
      }
    }
  }

  function generateNoise() {
    for (let y = 0; y < rows; y++) {
      inputValues[y] = [];
      for (let x = 0; x <= cols; x++) {
        const zBoost =
          (zBoostValues[y] && zBoostValues[y][x]) !== undefined
            ? zBoostValues[y][x]
            : 0;
        const n = noise(x * 0.02, y * 0.02, zOffset + zBoost) * 100;
        inputValues[y][x] = n;

        if (n < noiseMin) noiseMin = n;
        if (n > noiseMax) noiseMax = n;

        if (zBoostValues[y] && zBoostValues[y][x] > 0) {
          zBoostValues[y][x] *= 0.99;
        }
      }
    }
  }

  function renderAtThreshold() {
    ctx.beginPath();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth =
      currentThreshold %
        (thresholdIncrement * thickLineThresholdMultiple) ===
      0
        ? 2
        : 1;

    for (let y = 0; y < inputValues.length - 1; y++) {
      for (let x = 0; x < inputValues[y].length - 1; x++) {
        if (
          inputValues[y][x] > currentThreshold &&
          inputValues[y][x + 1] > currentThreshold &&
          inputValues[y + 1][x + 1] > currentThreshold &&
          inputValues[y + 1][x] > currentThreshold
        )
          continue;
        if (
          inputValues[y][x] < currentThreshold &&
          inputValues[y][x + 1] < currentThreshold &&
          inputValues[y + 1][x + 1] < currentThreshold &&
          inputValues[y + 1][x] < currentThreshold
        )
          continue;

        const gridValue = binaryToType(
          inputValues[y][x] > currentThreshold ? 1 : 0,
          inputValues[y][x + 1] > currentThreshold ? 1 : 0,
          inputValues[y + 1][x + 1] > currentThreshold ? 1 : 0,
          inputValues[y + 1][x] > currentThreshold ? 1 : 0
        );

        placeLines(gridValue, x, y);
      }
    }
    ctx.stroke();
  }

  function placeLines(gridValue, x, y) {
    let nw = inputValues[y][x];
    let ne = inputValues[y][x + 1];
    let se = inputValues[y + 1][x + 1];
    let sw = inputValues[y + 1][x];

    let a, b, c, d;

    switch (gridValue) {
      case 1:
      case 14:
        c = [x * res + res * linInterpolate(sw, se), y * res + res];
        d = [x * res, y * res + res * linInterpolate(nw, sw)];
        lineSeg(d, c);
        break;
      case 2:
      case 13:
        b = [x * res + res, y * res + res * linInterpolate(ne, se)];
        c = [x * res + res * linInterpolate(sw, se), y * res + res];
        lineSeg(b, c);
        break;
      case 3:
      case 12:
        b = [x * res + res, y * res + res * linInterpolate(ne, se)];
        d = [x * res, y * res + res * linInterpolate(nw, sw)];
        lineSeg(d, b);
        break;
      case 11:
      case 4:
        a = [x * res + res * linInterpolate(nw, ne), y * res];
        b = [x * res + res, y * res + res * linInterpolate(ne, se)];
        lineSeg(a, b);
        break;
      case 5:
        a = [x * res + res * linInterpolate(nw, ne), y * res];
        b = [x * res + res, y * res + res * linInterpolate(ne, se)];
        c = [x * res + res * linInterpolate(sw, se), y * res + res];
        d = [x * res, y * res + res * linInterpolate(nw, sw)];
        lineSeg(d, a);
        lineSeg(c, b);
        break;
      case 6:
      case 9:
        a = [x * res + res * linInterpolate(nw, ne), y * res];
        c = [x * res + res * linInterpolate(sw, se), y * res + res];
        lineSeg(c, a);
        break;
      case 7:
      case 8:
        a = [x * res + res * linInterpolate(nw, ne), y * res];
        d = [x * res, y * res + res * linInterpolate(nw, sw)];
        lineSeg(d, a);
        break;
      case 10:
        a = [x * res + res * linInterpolate(nw, ne), y * res];
        b = [x * res + res, y * res + res * linInterpolate(ne, se)];
        c = [x * res + res * linInterpolate(sw, se), y * res + res];
        d = [x * res, y * res + res * linInterpolate(nw, sw)];
        lineSeg(a, b);
        lineSeg(c, d);
        break;
      default:
        break;
    }
  }

  function lineSeg(from, to) {
    ctx.moveTo(from[0], from[1]);
    ctx.lineTo(to[0], to[1]);
  }

  function linInterpolate(x0, x1, y0 = 0, y1 = 1) {
    if (x0 === x1) return 0;
    return y0 + ((y1 - y0) * (currentThreshold - x0)) / (x1 - x0);
  }

  function binaryToType(nw, ne, se, sw) {
    let a = [nw, ne, se, sw];
    return a.reduce((res, x) => (res << 1) | x, 0);
  }

  // return cleanup function
  return () => {
    cancelAnimationFrame(animationFrameId);
    window.removeEventListener("resize", handleResize);
    try { resizeObserver && resizeObserver.disconnect(); } catch (_) {}
    canvas.removeEventListener("mousemove", handleMouseMove);
    canvas.removeEventListener("mousedown", handleMouseDown);
    canvas.removeEventListener("mouseup", handleMouseUp);
    canvas.removeEventListener("mouseleave", handleMouseLeave);
  };
}

// Helper: ubah hex/css color jadi rgba string dengan alpha
function toRgbaFromHexOrCss(color, alpha = 0.5) {
  // Jika sudah rgba/hsla, coba ganti alpha
  if (/^rgba?\(/i.test(color)) {
    try {
      const [r, g, b] = color
        .replace(/rgba?\(/i, "")
        .replace(/\)/, "")
        .split(",")
        .slice(0, 3)
        .map((v) => parseFloat(v.trim()));
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    } catch (_) {
      // fallback ke parsing hex
    }
  }

  // Hex #RGB atau #RRGGBB
  const hex = color.replace(/^#/, "");
  let r, g, b;
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length >= 6) {
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  } else {
    // fallback default
    return `rgba(237, 237, 237, ${alpha})`;
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
