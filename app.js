(function () {
  var P = window.PORTFOLIO || {};
  document.documentElement.classList.add("js");

  document.querySelectorAll("[data-f]").forEach(function (el) {
    var v = P[el.getAttribute("data-f")];
    if (v != null) el.textContent = v;
  });
  document.title = (P.fullName || P.name) + " — Portfolio";

  function h(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  var pl = document.getElementById("projects");
  (P.projects || []).forEach(function (p) {
    var li = h("li", "reveal"), a = h(p.link ? "a" : "div", "card");
    if (p.link) { a.href = p.link; a.target = "_blank"; a.rel = "noopener"; }
    var meta = h("div", "meta"); meta.append(h("span", null, p.tag), h("span", null, p.year));
    var body = h("div"); body.append(h("h3", null, p.title), h("p", null, p.blurb));
    var tags = h("div", "tags");
    (p.stack || []).forEach(function (s) { tags.append(h("i", null, s)); });
    body.append(tags);
    a.append(meta, body);
    if (p.link) a.append(h("span", "go", "OPEN ↗"));
    li.append(a); pl.append(li);
  });

  var bl = document.getElementById("beyondList");
  (P.beyond || []).forEach(function (b) {
    var li = h("li", "reveal"), c = h("div", "card");
    c.append(h("h3", null, b.title), h("p", null, b.blurb)); li.append(c); bl.append(li);
  });

  var sl = document.getElementById("stackList");
  (P.stack || []).forEach(function (s) {
    var li = h("li", "reveal"); li.append(h("span", null, s[0]), h("span", null, s[1])); sl.append(li);
  });

  var ex = document.getElementById("exp");
  (P.experience || []).forEach(function (e) {
    var li = h("li"); li.append(h("span", null, e.what), h("span", null, e.where), h("span", null, e.when)); ex.append(li);
  });

  var so = document.getElementById("socials");
  (P.socials || []).forEach(function (s) {
    var li = h("li"), a = h("a", null, s.name); a.href = s.url; a.target = "_blank"; a.rel = "noopener";
    li.append(a); so.append(li);
  });

  var mail = document.getElementById("mail");
  mail.textContent = P.email || ""; mail.href = "mailto:" + (P.email || "");

  // figure iframes report their height
  window.addEventListener("message", function (e) {
    if (!e.data || !e.data.figHeight) return;
    document.querySelectorAll("iframe.fig").forEach(function (f) {
      if (f.contentWindow === e.source) f.style.height = e.data.figHeight + "px";
    });
  });

  var io = "IntersectionObserver" in window && new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: .08 });
  document.querySelectorAll(".reveal").forEach(function (el) { if (io) io.observe(el); else el.classList.add("in"); });

  function done() { document.body.classList.remove("loading"); }
  window.addEventListener("load", function () { setTimeout(done, 900); });
  setTimeout(done, 3000);
})();
