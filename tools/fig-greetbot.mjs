// Fig 2: GreetBot, the tabletop companion with an EVE-style visor. Eyes follow the pointer; click to greet.
import { k, writePage } from "./common.mjs";

const W = 600, H = 440;
const PLATE = { x: -96, y: -64, w: 192, d: 128, r: 8 };
const PLATE_H = 10, FOOT_H = 5;
const BASE_R = 40;
const BODY = { x: -24, y: -19, w: 48, d: 38, r: 10 };
const BODY_Z0 = 6, BODY_Z1 = 42;
const HEAD = { x: -31, y: -25, w: 62, d: 50, r: 13 };
const HEAD_Z0 = 48, HEAD_Z1 = 88;
const FACE_Y = HEAD.y + HEAD.d;           // front face plane
const VISOR = { x0: -20, x1: 20, z0: 58, z1: 80 };
const EYE_Z = 69;

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [0, 0, 112], [-96, 64, 60]],
  W, H, { pad: 26, azimuth: 42, elevation: 30 },
);
const at = (p) => k.iso(p, P);
const S = (p, s) => k.solidSvg(p, s);
const L = (d, s) => k.lineSvg(d, s);
const D = (pts, s) => k.dotsSvg(pts, s);

function table() {
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
  // Raspberry Pi 5 board beside the robot
  const pi = { x: 46, y: -50, w: 40, d: 28, r: 2 };
  out.push(S(k.slabOf(pi, 0, 2.4, P, 3), { tone: "mid" }));
  out.push(S(k.slabOf({ x: 54, y: -44, w: 12, d: 12, r: 1 }, 2.4, 1.6, P, 2), { tone: "hi" }));
  out.push(S(k.slabOf({ x: 74, y: -46, w: 9, d: 7, r: 1 }, 2.4, 4, P, 2), { tone: "lo" }));
  out.push(S(k.slabOf({ x: 74, y: -36, w: 9, d: 7, r: 1 }, 2.4, 4, P, 2), { tone: "lo" }));
  out.push(D(k.corners(pi, 2.4).map(([x, y]) => at([x, y, 2.4])), { size: 0.4 }));
  out.push(k.faceTextSvg(k.topMatrix([46, -18], 0, P, "x"), "PI 5 · OLLAMA 3B", { size: 3.2, tone: "mid" }));
  // microphone puck
  out.push(S(k.cylinder(-72, 36, 9, 0, 4, P, 28), { tone: "mid" }));
  out.push(L(k.ring(-72, 36, 6, 4, P, 28), { tone: "lo" }));
  out.push(D([at([-72, 36, 4])], { size: 0.6, tone: "lit" }));
  return out.join("");
}

function robot() {
  const out = [];
  out.push(S(k.cylinder(0, 0, BASE_R, 0, BODY_Z0, P, 56, 0.8), { tone: "mid" }));
  out.push(L(k.ring(0, 0, BASE_R - 4, BODY_Z0, P, 56), { tone: "lo" }));
  out.push(S(k.slabOf(BODY, BODY_Z0, BODY_Z1 - BODY_Z0, P, 7, 1), { tone: "hi", crease: "lo" }));
  out.push(L([14, 22, 30].map((z) => k.sideSeam(BODY, z, P, 7)).join(""), { tone: "faint" }));
  // speaker grille on the front of the body
  const grille = [];
  for (let z = 16; z <= 34; z += 4) grille.push(k.segment([-9, BODY.y + BODY.d + 0.1, z], [9, BODY.y + BODY.d + 0.1, z], P));
  out.push(L(grille.join(""), { tone: "lo" }));
  out.push(S(k.cylinder(0, 0, 9, BODY_Z1, HEAD_Z0 - BODY_Z1, P, 28), { tone: "mid" }));
  // side pods (ears)
  out.push(S(k.slabOf({ x: HEAD.x - 6, y: -9, w: 6, d: 18, r: 2 }, 58, 18, P, 3), { tone: "mid" }));
  out.push(S(k.slabOf(HEAD, HEAD_Z0, HEAD_Z1 - HEAD_Z0, P, 9, 1.2), { tone: "hi", crease: "lo" }));
  out.push(S(k.slabOf({ x: HEAD.x + HEAD.w, y: -9, w: 6, d: 18, r: 2 }, 58, 18, P, 3), { tone: "mid" }));
  out.push(L(k.sideSeam(HEAD, HEAD_Z0 + 5, P, 9), { tone: "faint" }));
  out.push(L(k.planOutline(k.insetPlan(HEAD, 5), HEAD_Z1, P, 9), { tone: "faint" }));
  // visor glass: a rounded window on the front face
  const v = (x, z) => at([x, FACE_Y + 0.15, z]);
  const rr = 6, pts = [];
  const corner = (cx, cz, a0) => { for (let i = 0; i <= 5; i++) { const a = a0 + (i / 5) * Math.PI / 2; pts.push(v(cx + Math.cos(a) * rr, cz + Math.sin(a) * rr)); } };
  corner(VISOR.x1 - rr, VISOR.z1 - rr, 0); corner(VISOR.x0 + rr, VISOR.z1 - rr, Math.PI / 2);
  corner(VISOR.x0 + rr, VISOR.z0 + rr, Math.PI); corner(VISOR.x1 - rr, VISOR.z0 + rr, Math.PI * 1.5);
  out.push(`<path d="M${pts.map((p) => p.join(" ")).join("L")}Z" style="fill:var(--anatomy-halo);stroke:var(--anatomy-mid);stroke-width:.6"/>`);
  out.push(`<g data-part="eyes"></g>`);
  // antenna with lit bulb
  out.push(S(k.cylinder(0, 0, 1.4, HEAD_Z1, 14, P, 16), { tone: "mid", crease: "none" }));
  out.push(S(k.cylinder(0, 0, 3.6, HEAD_Z1 + 14, 4, P, 22), { tone: "mid" }));
  out.push(`<path data-part="bulb" class="iso-line" data-tone="lit" d="${k.ring(0, 0, 1.8, HEAD_Z1 + 18, P, 14)}" style="stroke-width:1.6"/>`);
  return out.join("");
}

const svg = k.figureSvg({
  width: W, height: H,
  label: "GreetBot, a tabletop companion robot with a round base, a body with a speaker grille and a head with a dark visor showing two glowing capsule eyes. A Raspberry Pi board and a microphone puck sit on the table beside it. The eyes follow the pointer and the robot greets on click.",
  body: [table(), robot()],
});

const live = `
const P = ${JSON.stringify(P)};
const FACE_Y = ${FACE_Y}, V = ${JSON.stringify(VISOR)}, EYE_Z = ${EYE_Z};
const stage = document.querySelector(".iso-stage"), svg = stage.querySelector("svg");
const eyes = svg.querySelector('[data-part="eyes"]'), bulb = svg.querySelector('[data-part="bulb"]');
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const NS = "http://www.w3.org/2000/svg";
const pathEl = document.createElementNS(NS, "path");
pathEl.style.fill = "var(--anatomy-lit)"; pathEl.style.stroke = "var(--anatomy-lit)"; pathEl.style.strokeWidth = "1.2";
pathEl.style.strokeLinejoin = "round"; eyes.appendChild(pathEl);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const pt = (x, z) => iso([x, FACE_Y + 0.3, z], P);
function capsule(cx, cz, w, h) {
  const out = [];
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; out.push(pt(cx + Math.cos(a) * w, cz + Math.sin(a) * h)); }
  return "M" + out.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join("L") + "Z";
}
function happy(cx, cz, w) {
  const out = [];
  for (let i = 0; i <= 10; i++) { const a = Math.PI * (i / 10); out.push(pt(cx + Math.cos(a) * w, cz - 3 + Math.sin(a) * w * 0.8)); }
  return "M" + out.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join("L");
}
let look = [0, 0], want = [0, 0], blink = 0, nextBlink = 2, greet = 0, clock = 0, last = 0, visible = true, frame = 0, mode = "listening";
function draw() {
  const lx = look[0] * 5, lz = look[1] * 3;
  if (greet > 0) {
    pathEl.style.fill = "none";
    pathEl.setAttribute("d", happy(-9 + lx, EYE_Z + lz, 5.2) + happy(9 + lx, EYE_Z + lz, 5.2));
  } else {
    pathEl.style.fill = "var(--anatomy-lit)";
    const h = 7.2 * (blink > 0 ? Math.max(0.08, Math.abs(blink * 2 - 1)) : 1);
    pathEl.setAttribute("d", capsule(-9 + lx, EYE_Z + lz, 3.6, h) + capsule(9 + lx, EYE_Z + lz, 3.6, h));
  }
  bulb.style.opacity = String(0.55 + 0.45 * Math.sin(clock * 3));
  const m = greet > 0 ? "hello!" : mode;
  if (readout.textContent !== m) readout.textContent = m;
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60; last = now; clock += dt;
  look[0] += (want[0] - look[0]) * (1 - Math.exp(-dt / 0.12)); look[1] += (want[1] - look[1]) * (1 - Math.exp(-dt / 0.12));
  nextBlink -= dt; if (nextBlink <= 0 && blink <= 0) { blink = 0.0001; nextBlink = 2 + Math.random() * 3; }
  if (blink > 0) { blink += dt / 0.16; if (blink >= 1) blink = 0; }
  if (greet > 0) greet -= dt;
  if (!hover) { want = [Math.sin(clock * 0.6) * 0.7, Math.sin(clock * 0.9) * 0.3]; mode = Math.sin(clock * 0.25) > 0.6 ? "thinking" : "listening"; }
  draw();
  frame = visible && !still.matches ? requestAnimationFrame(tick) : 0;
}
let hover = false;
const run = () => { if (!frame) { last = 0; frame = requestAnimationFrame(tick); } };
new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) run(); }).observe(stage);
stage.addEventListener("pointermove", (e) => {
  const b = svg.getBoundingClientRect();
  hover = true; mode = "looking";
  want = [clamp(((e.clientX - b.left) / b.width - 0.5) * 2.4, -1, 1), clamp(-((e.clientY - b.top) / b.height - 0.45) * 2.4, -1, 1)]; run();
});
stage.addEventListener("pointerleave", () => { hover = false; });
const hello = () => { greet = 1.6; run(); };
stage.addEventListener("click", hello);
stage.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); hello(); } });
draw(); if (!still.matches) run();
`;

const body = k.plateHtml({
  fig: "Fig 2",
  title: "GreetBot",
  hint: "Move to be watched · click to say hi",
  readout: "listening",
  keys: [
    { mark: "lit", label: "Visor eyes and antenna light" },
    { mark: "raised", label: "Pi 5 board and mic on the table" },
  ],
  caption: "GreetBot, the tabletop companion that made the top 16 at the IEEE expo: Pygame visor, local Ollama brain, Raspberry Pi 5.",
  body: `<div class="iso-stage" tabindex="0" role="button" aria-label="GreetBot: move to make it look, press Enter to greet">${svg}</div>`,
});

writePage("fig-greetbot.html", { title: "GreetBot", body, script: live });
