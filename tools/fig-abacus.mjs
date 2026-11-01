// Fig 3: a five-rod soroban for Ganita Sabha. Click a rod to add one to its digit.
import { k, writePage } from "./common.mjs";

const W = 600, H = 420;
const RODS = [-44, -22, 0, 22, 44];
const FRAME = { x: -66, y: -15, w: 132, d: 30, r: 4 };
const Z_BOT = 6, Z_BAR = 48, BAR_H = 4, Z_TOP = 84, BEAD_R = 9, BEAD_H = 5.8;
const PLATE = { x: -84, y: -50, w: 168, d: 100, r: 8 };
const PLATE_H = 8;

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - 4, 0), [0, 0, Z_TOP + 14]],
  W, H, { pad: 24, azimuth: 66, elevation: 26 },
);
const at = (p) => k.iso(p, P);
const S = (p, s) => k.solidSvg(p, s);
const L = (d, s) => k.lineSvg(d, s);
const D = (pts, s) => k.dotsSvg(pts, s);

// bead rest heights: earth beads rest low (not counted) and rise to the bar; the heaven bead rests high.
const earthRest = (i) => Z_BOT + i * BEAD_H;
const earthLive = (i) => Z_BAR - (4 - i) * BEAD_H;
const heavenRest = Z_TOP - BEAD_H;
const heavenLive = Z_BAR + BAR_H;

function plate() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - 4, PLATE_H, P)}"/>`];
  const feet = [...k.corners(PLATE, 18)].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
  for (const [x, y] of feet) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - 4, 1.4, P, 22), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5, -PLATE_H - 4 + 1.4, 2.6, P, 22), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.4), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const t = k.topTicks(-70, 70, 4, 5, PLATE.y + PLATE.d - 12, 0, [2, 3.6], P);
  out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
  out.push(k.faceTextSvg(k.topMatrix([-70, PLATE.y + PLATE.d - 15], 0, P, "x"), "10^4   10^3   10^2   10^1   10^0", { size: 3.4, tone: "mid" }));
  return out.join("");
}

function frameBack() {
  const out = [];
  out.push(S(k.slabOf(FRAME, 0, Z_BOT, P, 5, 0.8), { tone: "mid" }));
  out.push(S(k.slabOf({ x: FRAME.x, y: FRAME.y, w: 5, d: FRAME.d, r: 2 }, Z_BOT, Z_TOP - Z_BOT, P, 4, 0.6), { tone: "mid" }));
  return out.join("");
}

function rod(i, x) {
  const out = [];
  out.push(S(k.cylinder(x, 0, 1.6, Z_BOT, Z_TOP - Z_BOT, P, 14), { tone: "mid", crease: "none" }));
  // one slice of the divider bar for this rod
  out.push(S(k.slabOf({ x: x - 11, y: -12, w: 22, d: 24, r: 1.5 }, Z_BAR, BAR_H, P, 3, 0.4), { tone: "mid" }));
  out.push(D([at([x, 11, Z_BAR + BAR_H])], { size: 0.45 }));
  const bead = (key, z) => {
    const g = [S(k.cylinder(x, 0, BEAD_R, z, BEAD_H, P, 28, 0.6), { tone: "hi", crease: "lo" })];
    g.push(L(k.ring(x, 0, BEAD_R - 3, z + BEAD_H, P, 28), { tone: "faint" }));
    g.push(L(k.sideArc(x, 0, BEAD_R, z + BEAD_H / 2, P, 20), { tone: "faint" }));
    return `<g data-bead="${key}" data-lit="0" transform="translate(0 0)">${g.join("")}</g>`;
  };
  out.push(bead(i + ":h", heavenRest));
  for (let b = 0; b < 4; b++) out.push(bead(i + ":" + b, earthRest(b)));
  return out.join("");
}

function frameFront() {
  return [
    S(k.slabOf({ x: FRAME.x + FRAME.w - 5, y: FRAME.y, w: 5, d: FRAME.d, r: 2 }, Z_BOT, Z_TOP - Z_BOT, P, 4, 0.6), { tone: "mid" }),
    S(k.slabOf(FRAME, Z_TOP, 6, P, 5, 0.8), { tone: "mid" }),
    L(k.planOutline(k.insetPlan(FRAME, 3), Z_TOP + 6, P, 5), { tone: "faint" }),
  ].join("");
}

const rods = [...RODS.entries()].sort((a, b) => a[1] - b[1]).map(([i, x]) => rod(i, x)).join("");
const svg = k.figureSvg({
  width: W, height: H,
  label: "A five-rod abacus on a base plate. Each rod carries one heaven bead worth five above a divider bar and four earth beads worth one below it. Clicking a rod adds one to its digit and the beads slide to the bar to show the number.",
  body: [plate(), frameBack(), rods, frameFront()],
});

const live = `
const P = ${JSON.stringify(P)};
const RODS = ${JSON.stringify(RODS)};
const REST = { h: ${heavenRest}, e: [${[0, 1, 2, 3].map(earthRest)}] }, LIVE = { h: ${heavenLive}, e: [${[0, 1, 2, 3].map(earthLive)}] };
const stage = document.querySelector(".iso-stage"), svg = stage.querySelector("svg");
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const beads = {};
svg.querySelectorAll("[data-bead]").forEach((g) => { beads[g.dataset.bead] = { g, off: 0 }; });
const digits = [0, 0, 0, 0, 0];
const SEQ = [7, 19, 98, 100, 1024, 4096, 9999, 31415, 108];
let seq = 0, timer = 0, visible = true, frame = 0, last = 0, touchedAt = -99, clock = 0;
const setNumber = (n) => String(n).padStart(5, "0").split("").forEach((c, i) => { digits[i] = +c; });
function target(i) {
  const d = digits[i];
  const out = { h: d >= 5 ? LIVE.h - REST.h : 0 };
  for (let b = 0; b < 4; b++) out["" + b] = b >= 4 - (d % 5) ? LIVE.e[b] - REST.e[b] : 0;
  return out;
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60; last = now; clock += dt;
  if (clock - touchedAt > 3.5) { timer += dt; if (timer > 2.4) { timer = 0; setNumber(SEQ[seq++ % SEQ.length]); } }
  let moving = false;
  RODS.forEach((x, i) => {
    const t = target(i);
    for (const key of Object.keys(t)) {
      const b = beads[i + ":" + key]; if (!b) continue;
      const diff = t[key] - b.off;
      b.off = still.matches || Math.abs(diff) < 0.02 ? t[key] : b.off + diff * (1 - Math.exp(-dt / 0.12));
      if (Math.abs(diff) >= 0.02) moving = true;
      b.g.setAttribute("transform", translateAlong(P, [0, 0, b.off]));
      b.g.dataset.lit = Math.abs(t[key]) > 0.01 ? "1" : "0";
    }
  });
  const text = "value " + digits.join("");
  if (readout.textContent !== text) readout.textContent = text;
  stage.setAttribute("aria-valuetext", text);
  frame = visible && !still.matches ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame) { last = 0; frame = requestAnimationFrame(tick); } };
new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) run(); }).observe(stage);
const bump = (i) => { digits[i] = (digits[i] + 1) % 10; touchedAt = clock; run(); };
stage.addEventListener("click", (e) => {
  const b = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal, sx = vb.x + ((e.clientX - b.left) / b.width) * vb.width;
  let best = 0, dist = 1e9;
  RODS.forEach((x, i) => { const d = Math.abs(iso([x, 0, 40], P)[0] - sx); if (d < dist) { dist = d; best = i; } });
  bump(best);
});
stage.addEventListener("keydown", (e) => { if (/^[0-4]$/.test(e.key)) { e.preventDefault(); bump(+e.key); } });
setNumber(SEQ[0]); seq = 1; run();
if (still.matches) tick(performance.now());
`;

const body = k.plateHtml({
  fig: "Fig 3",
  title: "Soroban",
  hint: "Click a rod to add one",
  readout: "value 00007",
  keys: [
    { mark: "raised", label: "Beads: one heaven (5) and four earth (1) per rod" },
    { mark: "flat", label: "Divider bar: beads count when they touch it" },
  ],
  caption: "Ganita Sabha teaches Indian mathematics by hand. An abacus is the plainest version: place value you can push with a finger.",
  body: `<div class="iso-stage" tabindex="0" role="button" aria-label="Abacus: click a rod, or press 0 to 4, to add one to that digit">${svg}</div>`,
});

writePage("fig-abacus.html", { title: "Soroban", body, script: live });
