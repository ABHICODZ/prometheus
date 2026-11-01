// ASCII portrait: your photos rebuilt from glyphs in a WebGL shader.
// The pointer opens a lens onto the real photo; switching photos dissolves cell by cell.
(function () {
  var stage = document.getElementById("portraitStage");
  var canvas = document.getElementById("portraitGl");
  if (!stage || !canvas) return;
  var gl = canvas.getContext("webgl", { antialias: false });
  if (!gl) { stage.classList.add("nogl"); return; }
  var still = matchMedia("(prefers-reduced-motion: reduce)").matches;

  var PHOTOS = [
    { src: "assets/photos/p6697.jpg", focus: [0.62, 0.4], cap: "AT THE PODIUM · GCET" },
    { src: "assets/photos/p6702.jpg", focus: [0.2, 0.5], cap: "BID2BUILD IDEATHON · GCET · AUG 2025" }
  ];
  var RAMP = " .:-=+*#%@";

  var vs = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
  var fs = [
    "precision mediump float;",
    "uniform vec2 res;uniform vec2 mouse;uniform float t;uniform float mixT;uniform float cell;uniform float lens;",
    "uniform sampler2D a;uniform sampler2D b;uniform sampler2D atlas;",
    "uniform vec4 fa;uniform vec4 fb;",
    "float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}",
    "vec2 map(vec2 uv,vec4 f){return vec2(f.x+(uv.x-.5)*f.z,f.y+(uv.y-.5)*f.w);}",
    "vec3 pick(vec2 uv,float useB){return mix(texture2D(a,map(uv,fa)).rgb,texture2D(b,map(uv,fb)).rgb,useB);}",
    "void main(){",
    " vec2 frag=gl_FragCoord.xy;",
    " vec2 id=floor(frag/cell);",
    " vec2 c=(id+.5)*cell;",
    " float rnd=h(id);",
    " float useB=step(rnd,mixT);",
    " float edge=1.-smoothstep(0.,.06,abs(rnd-mixT));",
    " float d=distance(c,mouse);",
    " float L=1.-smoothstep(lens*.55,lens,d);",
    " vec2 jit=(vec2(h(id+1.7),h(id+9.1))-.5)*cell*3.*(1.-L)*smoothstep(lens*1.6,lens*.8,d)*step(.01,lens);",
    " vec3 col=pick((c+jit)/res,useB);",
    " float lum=dot(col,vec3(.299,.587,.114));",
    " lum=clamp(pow(clamp((lum-.04)*1.35,0.,1.),.85),0.,.999);",
    " float idx=floor(lum*10.);",
    " vec2 local=fract(frag/cell);",
    " float g=texture2D(atlas,vec2((idx+local.x)/10.,local.y)).r;",
    " float spark=step(.9985,h(id+floor(t*3.)))*.9;",
    " vec3 paper=vec3(.925,.933,1.);vec3 orange=vec3(1.,.416,.169);vec3 ink=vec3(.027,.035,.157);",
    " vec3 gc=mix(paper,col*1.35+.1,.5);",
    " gc=mix(gc,orange,clamp(edge+spark,0.,1.));",
    " vec3 ascii=ink+(col*.10)+g*gc;",
    " vec3 real=pick(frag/res,useB);",
    " vec3 outc=mix(ascii,real,L);",
    " float ring=smoothstep(lens*1.02,lens,d)*(1.-smoothstep(lens*.97,lens*.9,d));",
    " outc=mix(outc,orange,ring*.9*step(.01,lens));",
    " gl_FragColor=vec4(outc,1.);",
    "}"
  ].join("\n");

  function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
  var prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { stage.classList.add("nogl"); return; }
  gl.useProgram(prog);
  var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var U = {}; ["res", "mouse", "t", "mixT", "cell", "lens", "a", "b", "atlas", "fa", "fb"].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });

  // glyph atlas drawn with canvas 2D
  var at = document.createElement("canvas"), G = 40; at.width = G * RAMP.length; at.height = G;
  var cx = at.getContext("2d"); cx.fillStyle = "#000"; cx.fillRect(0, 0, at.width, at.height);
  cx.fillStyle = "#fff"; cx.textAlign = "center"; cx.textBaseline = "middle"; cx.font = "700 " + Math.round(G * 0.8) + 'px "DM Mono", ui-monospace, Menlo, monospace';
  for (var i = 0; i < RAMP.length; i++) cx.fillText(RAMP[i], i * G + G / 2, G / 2 + 2);

  function tex(unit, source, flip) {
    var t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flip);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }
  var imgs = [], ready = 0;
  var dpr = Math.min(devicePixelRatio || 1, 2), W = 0, H = 0;
  var cur = 0, mixT = 0, mixGoal = 0, mouse = [-999, -999], goal = [-999, -999], lens = 0, lensGoal = 0;
  var visible = false, last = 0, clock = 0, auto = true, autoClock = 0;
  var caption = document.getElementById("portraitCap"), btns = document.querySelectorAll("[data-photo]");

  function frameFor(i) {
    var im = imgs[i]; if (!im) return [0.5, 0.5, 1, 1];
    var ca = W / H, ia = im.naturalWidth / im.naturalHeight, vx = 1, vy = 1;
    if (ca > ia) vy = ia / ca; else vx = ca / ia;
    var fx = Math.min(1 - vx / 2, Math.max(vx / 2, PHOTOS[i].focus[0]));
    var fy = Math.min(1 - vy / 2, Math.max(vy / 2, PHOTOS[i].focus[1]));
    return [fx, 1 - fy, vx, vy];
  }
  function resize() {
    var r = stage.getBoundingClientRect(); W = Math.max(2, Math.round(r.width * dpr)); H = Math.max(2, Math.round(r.height * dpr));
    canvas.width = W; canvas.height = H; gl.viewport(0, 0, W, H);
  }
  function select(i) {
    if (i === cur && mixGoal === (i ? 1 : 0)) return;
    cur = i; mixGoal = i ? 1 : 0;
    btns.forEach(function (b) { b.setAttribute("aria-pressed", String(+b.dataset.photo === i)); });
    if (caption) caption.textContent = PHOTOS[i].cap;
  }
  btns.forEach(function (b) { b.addEventListener("click", function () { auto = false; select(+b.dataset.photo); }); });

  function point(e) { var r = stage.getBoundingClientRect(); return [(e.clientX - r.left) * dpr, (r.height - (e.clientY - r.top)) * dpr]; }
  stage.addEventListener("pointermove", function (e) { goal = point(e); if (mouse[0] < -900) mouse = goal.slice(); lensGoal = Math.max(90, Math.min(W, H) * 0.24); });
  stage.addEventListener("pointerdown", function (e) { goal = point(e); mouse = goal.slice(); lensGoal = Math.max(90, Math.min(W, H) * 0.34); });
  stage.addEventListener("pointerup", function () { lensGoal = Math.max(90, Math.min(W, H) * 0.24); });
  stage.addEventListener("pointerleave", function () { lensGoal = 0; });

  function draw() {
    var cell = (innerWidth < 700 ? 5 : 6) * dpr;
    gl.uniform2f(U.res, W, H); gl.uniform2f(U.mouse, mouse[0], mouse[1]); gl.uniform1f(U.t, clock);
    gl.uniform1f(U.mixT, mixT); gl.uniform1f(U.cell, cell); gl.uniform1f(U.lens, lens);
    gl.uniform1i(U.a, 0); gl.uniform1i(U.b, 1); gl.uniform1i(U.atlas, 2);
    var fa = frameFor(0), fb = frameFor(1);
    gl.uniform4f(U.fa, fa[0], fa[1], fa[2], fa[3]); gl.uniform4f(U.fb, fb[0], fb[1], fb[2], fb[3]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function frame(now) {
    var dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016; last = now;
    clock += still ? 0 : dt;
    mouse[0] += (goal[0] - mouse[0]) * (1 - Math.exp(-dt / 0.07)); mouse[1] += (goal[1] - mouse[1]) * (1 - Math.exp(-dt / 0.07));
    lens += (lensGoal - lens) * (1 - Math.exp(-dt / 0.12));
    mixT += (mixGoal - mixT) * (1 - Math.exp(-dt / 0.55));
    if (Math.abs(mixGoal - mixT) < 0.002) mixT = mixGoal;
    if (auto && !still) { autoClock += dt; if (autoClock > 7) { autoClock = 0; select(cur ? 0 : 1); } }
    draw();
    if (visible && !still) requestAnimationFrame(frame);
  }
  function start() {
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, null);
    tex(0, imgs[0], 1); tex(1, imgs[1], 1); tex(2, at, 0);
    resize(); stage.classList.add("live");
    new IntersectionObserver(function (e) {
      var v = e[e.length - 1].isIntersecting;
      if (v && !visible) { visible = true; last = 0; requestAnimationFrame(frame); } else visible = v;
    }, { rootMargin: "80px" }).observe(stage);
    draw();
    addEventListener("resize", function () { resize(); draw(); });
  }
  PHOTOS.forEach(function (p, i) {
    var im = new Image(); im.onload = function () { imgs[i] = im; if (++ready === PHOTOS.length) { (document.fonts && document.fonts.ready || Promise.resolve()).then(start); } };
    im.src = p.src;
  });
})();
