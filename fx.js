// Small interaction effects: cursor blob, magnetic nav, card tilt with glare, text scramble, headline reveal.
(function () {
  var fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var still = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // cursor blob
  if (fine && !still) {
    var blob = document.createElement("div"); blob.className = "blob"; document.body.appendChild(blob);
    var x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y, big = false;
    addEventListener("pointermove", function (e) { tx = e.clientX; ty = e.clientY; blob.style.opacity = 1; });
    document.addEventListener("pointerover", function (e) {
      big = !!e.target.closest("a, button, .card, [role=button], iframe, .globe");
      blob.classList.toggle("big", big);
      blob.classList.toggle("hide", !!e.target.closest(".pstage"));
    });
    (function loop() {
      x += (tx - x) * 0.18; y += (ty - y) * 0.18;
      blob.style.transform = "translate(" + (x - 14) + "px," + (y - 14) + "px)";
      requestAnimationFrame(loop);
    })();
  }

  // magnetic nav links and socials
  if (fine && !still) {
    document.querySelectorAll(".nav nav a, .socials a, .logo").forEach(function (a) {
      a.addEventListener("pointermove", function (e) {
        var r = a.getBoundingClientRect();
        a.style.transform = "translate(" + ((e.clientX - r.left - r.width / 2) * 0.3) + "px," + ((e.clientY - r.top - r.height / 2) * 0.4) + "px)";
      });
      a.addEventListener("pointerleave", function () { a.style.transform = ""; });
    });
  }

  // tilt cards with a moving glare
  if (fine && !still) {
    document.addEventListener("pointermove", function (e) {
      var c = e.target.closest && e.target.closest(".cards .card");
      document.querySelectorAll(".card.tilt").forEach(function (o) { if (o !== c) { o.classList.remove("tilt"); o.style.transform = ""; } });
      if (!c) return;
      var r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      c.classList.add("tilt");
      c.style.transform = "perspective(800px) rotateX(" + ((0.5 - py) * 8) + "deg) rotateY(" + ((px - 0.5) * 10) + "deg) translateY(-6px)";
      c.style.setProperty("--gx", (px * 100) + "%"); c.style.setProperty("--gy", (py * 100) + "%");
    });
  }

  // text scramble on hover for nav and eyebrows
  var CH = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/#<>";
  function scramble(el) {
    var final = el.dataset.t || (el.dataset.t = el.textContent), n = 0;
    clearInterval(el._s);
    el._s = setInterval(function () {
      el.textContent = final.split("").map(function (ch, i) { return ch === " " || i < n ? ch : CH[Math.floor(Math.random() * CH.length)]; }).join("");
      n += 0.7; if (n >= final.length) { clearInterval(el._s); el.textContent = final; }
    }, 28);
  }
  if (!still) document.querySelectorAll(".nav nav a, .socials a, .card .go").forEach(function (el) { el.addEventListener("pointerenter", function () { scramble(el); }); });

  // headline: letters rise in, staggered
  if (!still) document.querySelectorAll(".hero h1, section h2").forEach(function (h) {
    var parts = []; h.childNodes.forEach(function (n) { parts.push(n); });
    h.textContent = "";
    var i = 0;
    parts.forEach(function (n) {
      if (n.nodeName === "BR") { h.appendChild(document.createElement("br")); return; }
      n.textContent.split(/(\s+)/).forEach(function (word) {
        if (/^\s+$/.test(word) || !word) { h.appendChild(document.createTextNode(word)); return; }
        var w = document.createElement("span"); w.className = "w";
        word.split("").forEach(function (c) { var s = document.createElement("span"); s.className = "ch"; s.textContent = c; s.style.transitionDelay = (i++ * 28) + "ms"; w.appendChild(s); });
        h.appendChild(w);
      });
    });
    h.classList.add("split");
    var show = function () { h.classList.add("on"); };
    if ("IntersectionObserver" in window) {
      var o = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { show(); o.disconnect(); } }, { threshold: 0.15 });
      o.observe(h);
    } else show();
  });
})();
