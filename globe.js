// Interactive 3D globe: dotted sphere, three city markers, arcs and an orbiting satellite.
(function () {
  var host = document.getElementById("globe");
  if (!host || !window.THREE) return;
  var T = window.THREE;
  var still = matchMedia("(prefers-reduced-motion: reduce)").matches;

  var scene = new T.Scene();
  var camera = new T.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(0, 0, 6.2);
  var renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  host.appendChild(renderer.domElement);

  var world = new T.Group();
  scene.add(world);
  var R = 1.6;
  var ll = function (lat, lon, r) {
    var phi = (90 - lat) * Math.PI / 180, th = (lon + 180) * Math.PI / 180;
    return new T.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
  };

  // core + dots
  world.add(new T.Mesh(new T.SphereGeometry(R * 0.985, 48, 32), new T.MeshBasicMaterial({ color: 0x070928 })));
  var N = 2200, pos = new Float32Array(N * 3), ga = Math.PI * (3 - Math.sqrt(5));
  for (var i = 0; i < N; i++) {
    var y = 1 - (i / (N - 1)) * 2, rad = Math.sqrt(1 - y * y), a = ga * i;
    pos[i * 3] = Math.cos(a) * rad * R; pos[i * 3 + 1] = y * R; pos[i * 3 + 2] = Math.sin(a) * rad * R;
  }
  var dg = new T.BufferGeometry(); dg.setAttribute("position", new T.BufferAttribute(pos, 3));
  world.add(new T.Points(dg, new T.PointsMaterial({ color: 0xb9c0ff, size: 0.026, sizeAttenuation: true })));
  // latitude rings
  [-60, -30, 0, 30, 60].forEach(function (lat) {
    var pts = [];
    for (var k = 0; k <= 96; k++) pts.push(ll(lat, (k / 96) * 360 - 180, R * 1.002));
    world.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: 0x2b3cff, transparent: true, opacity: 0.6 })));
  });

  // cities
  var cities = [
    { name: "HYDERABAD", lat: 17.38, lon: 78.48 },
    { name: "DELHI NCR", lat: 28.61, lon: 77.21 },
    { name: "BARCELONA", lat: 41.39, lon: 2.17 }
  ];
  var tagEls = [];
  cities.forEach(function (c) {
    c.v = ll(c.lat, c.lon, R * 1.01);
    var m = new T.Mesh(new T.SphereGeometry(0.035, 16, 12), new T.MeshBasicMaterial({ color: 0xff6a2b }));
    m.position.copy(c.v); world.add(m);
    var ring = new T.Mesh(new T.RingGeometry(0.05, 0.065, 32), new T.MeshBasicMaterial({ color: 0xff6a2b, side: T.DoubleSide, transparent: true }));
    ring.position.copy(c.v); ring.lookAt(c.v.clone().multiplyScalar(2)); world.add(ring); c.ring = ring;
    var el = document.createElement("div"); el.className = "tag"; el.textContent = c.name; host.appendChild(el); c.el = el;
  });
  function arc(a, b, lift) {
    var mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(R * (1 + lift));
    var curve = new T.QuadraticBezierCurve3(a, mid, b);
    var line = new T.Line(new T.BufferGeometry().setFromPoints(curve.getPoints(60)), new T.LineBasicMaterial({ color: 0xff6a2b }));
    world.add(line);
  }
  arc(cities[0].v, cities[1].v, 0.25);
  arc(cities[0].v, cities[2].v, 0.7);

  // satellite on a near-polar orbit
  var orbit = new T.Group(); orbit.rotation.set(0.25, 0, 1.3); world.add(orbit);
  var OR = R * 1.38, opts = [];
  for (var j = 0; j <= 120; j++) { var t = (j / 120) * Math.PI * 2; opts.push(new T.Vector3(Math.cos(t) * OR, 0, Math.sin(t) * OR)); }
  orbit.add(new T.Line(new T.BufferGeometry().setFromPoints(opts), new T.LineDashedMaterial({ color: 0x8a98ff, dashSize: 0.05, gapSize: 0.05 })));
  orbit.children[0].computeLineDistances();
  var sat = new T.Group();
  sat.add(new T.Mesh(new T.BoxGeometry(0.1, 0.1, 0.14), new T.MeshBasicMaterial({ color: 0xeceeff })));
  [-1, 1].forEach(function (s) {
    var p = new T.Mesh(new T.BoxGeometry(0.22, 0.012, 0.09), new T.MeshBasicMaterial({ color: 0xff6a2b }));
    p.position.x = s * 0.17; sat.add(p);
  });
  orbit.add(sat);
  var satEl = document.createElement("div"); satEl.className = "tag sat"; satEl.textContent = "SENTINEL-5P STYLE"; host.appendChild(satEl);

  // start facing India
  world.rotation.y = -1.25; world.rotation.x = 0.35;
  var drag = false, lx = 0, ly = 0, vel = 0, visible = false, size = 0;

  function resize() {
    var w = host.clientWidth; if (w === size) return; size = w;
    renderer.setSize(w, w, false); camera.aspect = 1; camera.updateProjectionMatrix();
  }
  host.addEventListener("pointerdown", function (e) { drag = true; lx = e.clientX; ly = e.clientY; host.setPointerCapture(e.pointerId); host.style.cursor = "grabbing"; });
  host.addEventListener("pointermove", function (e) {
    if (!drag) return;
    var dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
    world.rotation.y += dx * 0.008; world.rotation.x = Math.max(-1.2, Math.min(1.2, world.rotation.x + dy * 0.006)); vel = dx * 0.008;
  });
  var up = function () { drag = false; host.style.cursor = "grab"; };
  host.addEventListener("pointerup", up); host.addEventListener("pointercancel", up);

  var tmp = new T.Vector3(), clock = 0, last = 0;
  function project(obj, el, hideBehind) {
    obj.getWorldPosition(tmp);
    var facing = tmp.clone().normalize().dot(camera.position.clone().normalize()) > 0.18 || !hideBehind;
    var n = tmp.clone().project(camera);
    el.style.left = ((n.x + 1) / 2 * 100) + "%"; el.style.top = ((1 - n.y) / 2 * 100) + "%";
    el.style.opacity = facing ? 1 : 0;
  }
  function frame(now) {
    var dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016; last = now; clock += dt;
    if (!drag) { world.rotation.y += (still ? 0 : 0.12 * dt) + vel; vel *= 0.94; }
    sat.position.set(Math.cos(clock * 0.5) * OR, 0, Math.sin(clock * 0.5) * OR);
    cities.forEach(function (c) { var s = 1 + ((clock * 0.8) % 1); c.ring.scale.setScalar(s); c.ring.material.opacity = 1 - (s - 1); });
    renderer.render(scene, camera);
    cities.forEach(function (c) { var o = new T.Object3D(); o.position.copy(c.v); world.add(o); o.updateMatrixWorld(); project(o, c.el, true); world.remove(o); });
    project(sat, satEl, false);
    if (visible) requestAnimationFrame(frame);
  }
  new IntersectionObserver(function (e) {
    var v = e[e.length - 1].isIntersecting;
    if (v && !visible) { visible = true; last = 0; resize(); requestAnimationFrame(frame); } else visible = v;
  }, { rootMargin: "100px" }).observe(host);
  addEventListener("resize", resize);
  resize();
})();
