// Fig 1: a roadside air-quality mast with a gauge console. Hover sets the AQI.
import { k, writePage } from "./common.mjs";

const W = 600, H = 440;
const PLATE = { x: -80, y: -80, w: 160, d: 160, r: 8 };
const PLATE_H = 10, FOOT_H = 5;
const MAST_TOP = 150;
const HOUSING = { x: -24, y: -24, w: 48, d: 48, r: 5 };
const HZ0 = 62, HZ1 = 104;
const PANEL = { x: -40, y: -40, w: 80, d: 80, r: 3 };
const CON = { x: 22, y: -72, w: 52, d: 44, r: 4 };
const CON_H = 16;
const DIAL = [48, -50], DIAL_R = 17, DIAL_Z = CON_H, DIAL_H = 6, DIAL_TOP = DIAL_Z + DIAL_H;
const INLET = [0, 0, HZ1 + 8];

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [0, 0, MAST_TOP + 14], [-80, 80, 30]],
  W, H, { pad: 28, azimuth: 42, elevation: 30 },
);
const at = (p) => k.iso(p, P);
const S = (p, s) => k.solidSvg(p, s);
const L = (d, s) => k.lineSvg(d, s);
const D = (pts, s) => k.dotsSvg(pts, s);

function plate() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  const feet = [...k.corners(PLATE, 20)].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
  for (const [x, y] of feet) {
    out.push(S(k.cylinder(x, y, 8, -PLATE_H - FOOT_H, 1.6, P, 24), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 6, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 24), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 6), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 11);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.4, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  const strip = { x: -66, y: PLATE.y + PLATE.d - 22, w: 100, d: 8, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const t = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.8, 0.6, [2, 3.8], P);
  out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
  out.push(k.faceTextSvg(k.topMatrix([-66, strip.y - 3], 0, P, "x"), "DELHI NCR  28.61N 77.21E", { size: 3.2, tone: "mid" }));
  return out.join("");
}

function mast() {
  const out = [];
  out.push(S(k.cylinder(0, 0, 11, 0, 4, P, 32), { tone: "mid" }));
  out.push(S(k.cylinder(0, 0, 7, 4, 4, P, 28), { tone: "mid" }));
  out.push(S(k.cylinder(0, 0, 4.4, 8, HZ0 - 8, P, 28), { tone: "mid", crease: "none" }));
  out.push(L([20, 34, 48].map((z) => k.sideArc(0, 0, 4.4, z, P, 14)).join(""), { tone: "faint" }));
  // sensor housing with louvres
  out.push(S(k.slabOf(HOUSING, HZ0, HZ1 - HZ0, P, 6, 1), { tone: "hi", crease: "lo" }));
  const louvres = [];
  for (let z = HZ0 + 6; z < HZ1 - 3; z += 5) louvres.push(k.sideSeam(HOUSING, z, P, 6));
  out.push(L(louvres.join(""), { tone: "lo" }));
  out.push(L(k.planOutline(k.insetPlan(HOUSING, 4), HZ1, P, 6), { tone: "faint" }));
  // inlet funnel
  out.push(S(k.cylinder(0, 0, 8, HZ1, 3, P, 28), { tone: "mid" }));
  out.push(S(k.cylinder(0, 0, 4.4, HZ1 + 3, MAST_TOP - HZ1 - 3, P, 28), { tone: "mid", crease: "none" }));
  out.push(L([120, 134].map((z) => k.sideArc(0, 0, 4.4, z, P, 14)).join(""), { tone: "faint" }));
  // solar panel
  out.push(S(k.slabOf(PANEL, MAST_TOP, 3, P, 4, 0.5), { tone: "hi", crease: "lo" }));
  const cells = [];
  for (let i = 1; i < 4; i++) {
    const v = PANEL.x + (PANEL.w * i) / 4, u = PANEL.y + (PANEL.d * i) / 4;
    cells.push(k.lineOnTop([v, PANEL.y + 3], [v, PANEL.y + PANEL.d - 3], MAST_TOP + 3, P));
    cells.push(k.lineOnTop([PANEL.x + 3, u], [PANEL.x + PANEL.w - 3, u], MAST_TOP + 3, P));
  }
  out.push(L(cells.join(""), { tone: "lo" }));
  out.push(L(k.planOutline(k.insetPlan(PANEL, 2.5), MAST_TOP + 3, P, 4), { tone: "mid" }));
  // anemometer
  out.push(S(k.cylinder(0, 0, 1.6, MAST_TOP + 3, 14, P, 16), { tone: "mid", crease: "none" }));
  out.push(S(k.cylinder(0, 0, 3.4, MAST_TOP + 17, 3, P, 20), { tone: "mid" }));
  return out.join("");
}

function console_() {
  const out = [`<path class="iso-halo" d="${k.haloOf(CON, 0, CON_H, P)}"/>`];
  out.push(S(k.slabOf(CON, 0, CON_H, P, 6, 1), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(CON, 3), CON_H, P, 6), { tone: "faint" }));
  const [x, y] = DIAL;
  out.push(S(k.cylinder(x, y, DIAL_R, DIAL_Z, DIAL_H, P, 56, 0.8), { tone: "hi", crease: "lo" }));
  out.push(L(k.knurl(x, y, DIAL_R, DIAL_TOP - 2.6, DIAL_TOP, 72, P, 0.3), { tone: "lo" }));
  out.push(L(k.ring(x, y, DIAL_R - 2, DIAL_TOP, P, 56), { tone: "lo" }));
  const t = k.radialTicks(x, y, DIAL_R - 2.6, 50, 5, DIAL_TOP, [1.2, 2.6], P, -Math.PI * 0.75, Math.PI * 1.5);
  out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
  out.push(L(k.ring(x, y, 1.6, DIAL_TOP, P, 14), { tone: "mid" }));
  // beacon + switch row
  out.push(S(k.cylinder(CON.x + 9, CON.y + CON.d - 9, 4.4, CON_H, 5, P, 20), { tone: "mid" }));
  out.push(`<path data-part="beacon" class="iso-line" data-tone="green" d="${k.ring(CON.x + 9, CON.y + CON.d - 9, 2.4, CON_H + 5, P, 16)}" style="stroke-width:1.6"/>`);
  for (let i = 0; i < 3; i++) out.push(S(k.slabOf({ x: CON.x + 20 + i * 8, y: CON.y + CON.d - 12, w: 5, d: 6, r: 1 }, CON_H, 1.6, P, 2), { tone: "lo", crease: "none" }));
  out.push(k.faceTextSvg(k.topMatrix([CON.x + 6, CON.y + 8], CON_H, P, "x"), "AQI", { size: 4, tone: "mid" }));
  return out.join("");
}

const needleAt = (v, r = DIAL_R - 4.4) => {
  const a = -Math.PI * 0.75 + (v / 500) * Math.PI * 1.5;
  const [x, y] = DIAL;
  return k.lineOnTop([x - Math.sin(a) * 3, y + Math.cos(a) * 3], [x + Math.sin(a) * r, y - Math.cos(a) * r], DIAL_TOP + 0.2, P);
};

const svg = k.figureSvg({
  width: W, height: H,
  label: "A roadside air-quality mast on a base plate. A louvred sensor housing draws in air through an inlet under a solar panel, and a console beside it shows the air quality index on a dial with a coloured beacon. Move the pointer to raise or lower the index and the air fills with particles.",
  body: [
    plate(),
    mast(),
    console_(),
    `<path data-part="needle" class="iso-line" data-tone="lit" d="${needleAt(120)}" style="stroke-width:1.2"/>`,
    `<g data-part="motes"></g>`,
  ],
});

const live = `
const P = ${JSON.stringify(P)};
const DIAL = ${JSON.stringify(DIAL)}, DIAL_R = ${DIAL_R}, DIAL_TOP = ${DIAL_TOP}, INLET = ${JSON.stringify(INLET)};
const stage = document.querySelector(".iso-stage"), svg = stage.querySelector("svg");
const needle = svg.querySelector('[data-part="needle"]'), beacon = svg.querySelector('[data-part="beacon"]');
const motesG = svg.querySelector('[data-part="motes"]'), readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const NS = "http://www.w3.org/2000/svg";
const needleAt = ${needleAt.toString().replace("k.lineOnTop", "lineOnTop")};
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const N = 70, motes = [];
for (let i = 0; i < N; i++) {
  const c = document.createElementNS(NS, "circle"); c.setAttribute("r", "1.3"); c.style.fill = "var(--anatomy-lit)";
  motesG.appendChild(c);
  motes.push({ c, x: 0, y: 0, z: 0, born: false, v: 0.5 + Math.random() });
}
const spawn = (m) => {
  const a = Math.random() * Math.PI * 2, r = 70 + Math.random() * 40;
  m.x = Math.cos(a) * r; m.y = Math.sin(a) * r; m.z = 70 + Math.random() * 90; m.v = 0.6 + Math.random() * 0.9;
};
motes.forEach(spawn);
let aqi = 120, target = 120, manual = false, idle = 0, last = 0, clock = 0, visible = true, frame = 0;
const band = (v) => v < 100 ? ["good", "green"] : v < 250 ? ["moderate", "blue"] : ["severe", "red"];
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60; last = now;
  clock += dt;
  if (!manual) target = 40 + (Math.sin(clock * 0.35) * 0.5 + 0.5) * 420;
  else { idle -= dt; if (idle <= 0) manual = false; }
  aqi += (target - aqi) * (1 - Math.exp(-dt / 0.45));
  needle.setAttribute("d", needleAt(aqi));
  const [label, tone] = band(aqi);
  beacon.setAttribute("data-tone", tone);
  const text = "AQI " + Math.round(aqi) + " · " + label;
  if (readout.textContent !== text) readout.textContent = text;
  stage.setAttribute("aria-valuenow", String(Math.round(aqi))); stage.setAttribute("aria-valuetext", text);
  const live = Math.round(8 + (aqi / 500) * (N - 8));
  motes.forEach((m, i) => {
    if (i >= live) { m.c.setAttribute("opacity", "0"); return; }
    const dx = INLET[0] - m.x, dy = INLET[1] - m.y, dz = INLET[2] - m.z, d = Math.hypot(dx, dy, dz);
    if (d < 5) { spawn(m); }
    const s = m.v * 28 * dt / Math.max(d, 1);
    m.x += dx * s + Math.sin(clock * 2 + i) * 0.25; m.y += dy * s + Math.cos(clock * 1.7 + i) * 0.25; m.z += dz * s;
    const p = iso([m.x, m.y, m.z], P);
    m.c.setAttribute("cx", p[0].toFixed(1)); m.c.setAttribute("cy", p[1].toFixed(1));
    m.c.setAttribute("opacity", String(clamp(1 - d / 220, 0.15, 0.95)));
  });
  frame = visible && !still.matches ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame) { last = 0; frame = requestAnimationFrame(tick); } };
new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) run(); }).observe(stage);
const steer = (v) => { manual = true; idle = 3; target = clamp(v, 10, 490); };
stage.addEventListener("pointermove", (e) => {
  const b = svg.getBoundingClientRect(); steer(((e.clientX - b.left) / b.width) * 500); run();
});
stage.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); steer(target + 50); run(); }
  if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); steer(target - 50); run(); }
});
if (still.matches) { tick(performance.now()); tick(performance.now() + 16); } else run();
`;

const body = k.plateHtml({
  fig: "Fig 1",
  title: "Air-quality mast",
  hint: "Move across to change the air",
  readout: "AQI 120 · moderate",
  keys: [
    { mark: "lit", label: "Needle and particles: what the sensor reads" },
    { mark: "raised", label: "Louvred housing, inlet and solar cap" },
  ],
  caption: "The idea behind VayuDrishti: a station that breathes in the air, reads it on a dial and flags it with a beacon.",
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Air quality index: left and right arrow keys change it" aria-valuemin="0" aria-valuemax="500" aria-valuenow="120">${svg}</div>`,
});

writePage("fig-station.html", { title: "Air-quality mast", body, script: live });
