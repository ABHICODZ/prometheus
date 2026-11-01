// Byte, the website cat. Follows the pointer along the bottom of the screen, naps when ignored, purrs when clicked.
(function () {
  var pet = document.getElementById("pet"), speech = document.getElementById("petSpeech");
  if (!pet) return;
  var still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var W = 86, y = 0, vy = 0, held = false, moved = 0, x = 40, goal = x, facing = 1, state = "sit", idleFor = 0, lastMove = performance.now(), last = 0, talk = 0, wander = 0;
  var lines = ["mrrp", "feed me bugs", "ship it", "purr", "nice portfolio", "zzz soon"];
  var maxX = function () { return Math.max(0, innerWidth - W - 8); };

  function set(s) {
    if (state === s) return;
    state = s;
    pet.classList.remove("walk", "sit", "sleep");
    pet.classList.add(s);
  }
  function say(t) { speech.textContent = t; speech.classList.add("on"); clearTimeout(talk); talk = setTimeout(function () { speech.classList.remove("on"); }, 1600); }
  function heart() {
    var r = pet.getBoundingClientRect(), s = document.createElement("span");
    s.className = "heart"; s.textContent = "♥"; s.style.left = (r.left + 30 + Math.random() * 30) + "px"; s.style.top = (r.top + 6) + "px";
    document.body.appendChild(s); setTimeout(function () { s.remove(); }, 1200);
  }
  function pat() {
    pet.classList.remove("jump"); void pet.offsetWidth; pet.classList.add("jump");
    set("sit"); idleFor = 0; say(lines[Math.floor(Math.random() * lines.length)]);
    for (var i = 0; i < 4; i++) setTimeout(heart, i * 120);
  }
  pet.addEventListener("click", function () { if (moved < 6) pat(); });
  pet.addEventListener("pointerdown", function (e) {
    held = true; moved = 0; pet.setPointerCapture(e.pointerId); say("put me down!");
    var sx = e.clientX, sy = e.clientY, bx = x, by = y;
    var mv = function (ev) { moved = Math.max(moved, Math.hypot(ev.clientX - sx, ev.clientY - sy)); x = Math.min(maxX(), Math.max(0, bx + ev.clientX - sx)); y = Math.min(0, by + ev.clientY - sy); goal = x; };
    var up = function () { held = false; pet.removeEventListener("pointermove", mv); pet.removeEventListener("pointerup", up); if (moved >= 6) say("wheee"); };
    pet.addEventListener("pointermove", mv); pet.addEventListener("pointerup", up);
  });
  pet.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pat(); } });
  pet.addEventListener("mouseenter", function () { if (state === "sleep") { set("sit"); idleFor = 0; } say("hm?"); });

  addEventListener("pointermove", function (e) {
    goal = Math.min(maxX(), Math.max(0, e.clientX - W / 2)); lastMove = performance.now(); idleFor = 0;
  });
  addEventListener("scroll", function () { idleFor = 0; }, { passive: true });

  function tick(now) {
    var dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016; last = now;
    if (!held && y < 0) { vy += 1800 * dt; y = Math.min(0, y + vy * dt); if (y === 0) { vy = 0; set("sit"); } } else if (held) vy = 0;
    var dist = held ? 0 : goal - x;
    if (Math.abs(dist) > 24 && state !== "sleep") {
      set("walk"); facing = dist > 0 ? 1 : -1;
      var speed = Math.min(150 + Math.abs(dist) * 0.8, 360) * dt;
      x += Math.sign(dist) * Math.min(speed, Math.abs(dist));
      idleFor = 0;
    } else {
      if (state === "walk") set("sit");
      idleFor += dt;
      if (state === "sit" && idleFor > 9) set("sleep");
      if (state === "sit") { wander += dt; if (wander > 7 && now - lastMove > 5000) { wander = 0; goal = Math.random() * maxX(); } }
    }
    if (state === "sleep" && Math.abs(dist) > 24) set("walk");
    pet.classList.toggle("flip", facing < 0);
    pet.style.transform = "translate(" + Math.round(x) + "px," + Math.round(y) + "px)";
    pet.style.left = "0px";
    requestAnimationFrame(tick);
  }
  set("sit");
  if (!still) requestAnimationFrame(tick); else { pet.style.left = "40px"; set("sit"); }
  setTimeout(function () { say("hi, I'm Byte. Scroll and I'll show you around."); }, 1800);
  var guide = { "#portrait": "that is Abhinav. wave at him", ".message": "that's the pitch", "#work": "13 projects. go on, click one", ".bench": "that's GreetBot. pet it", "#beyond": "not everything is code", "#world": "drag the globe", "#stack": "try the abacus", "#contact": "say hi to Abhinav" };
  if ("IntersectionObserver" in window) {
    var go = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting && state !== "sleep") { say(guide[e.target.dataset.g]); go.unobserve(e.target); } });
    }, { threshold: 0.35 });
    Object.keys(guide).forEach(function (sel) { var el = document.querySelector(sel); if (el) { el.dataset.g = sel; go.observe(el); } });
  }
})();
