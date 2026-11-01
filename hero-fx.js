// Hero WebGL: a halftone dot screen (the dithered look of sebg.ch) that swells into orange near the pointer
// and rings outward on click. One full-screen triangle, one fragment shader.
(function () {
  var hero = document.querySelector(".hero");
  var canvas = document.getElementById("heroGl");
  if (!hero || !canvas) return;
  var gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false });
  if (!gl) return;
  var still = matchMedia("(prefers-reduced-motion: reduce)").matches;

  var vs = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
  var fs = [
    "precision mediump float;",
    "uniform vec2 res;uniform vec2 mouse;uniform float t;uniform float click;uniform float ct;",
    "float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}",
    "void main(){",
    " float cell=res.x<700.?11.:16.;",
    " vec2 frag=gl_FragCoord.xy;",
    " vec2 c=(floor(frag/cell)+.5)*cell;",
    " vec2 local=frag-c;",
    " float field=.5+.5*sin(c.x*.006+t*.55)*cos(c.y*.007-t*.4);",
    " field=field*.55+.45*(.5+.5*sin((c.x+c.y)*.004+t*.3));",
    " float d=distance(c,mouse);",
    " float lens=exp(-d*d/(2.*150.*150.));",
    " float ring=0.;",
    " float rd=ct*520.;",
    " ring=exp(-pow((d-rd)/38.,2.))*click*(1.-clamp(ct*1.1,0.,1.));",
    " float v=clamp(field*.55+lens*.9+ring*.9,0.,1.);",
    " float r=cell*.5*v*1.05;",
    " float dot_=1.-smoothstep(r-.7,r+.7,length(local));",
    " vec3 paper=vec3(.925,.933,1.);vec3 orange=vec3(1.,.416,.169);",
    " float hot=clamp(lens*1.3+ring,0.,1.);",
    " vec3 col=mix(paper,orange,hot);",
    " float a=dot_*(.16+.78*hot);",
    " gl_FragColor=vec4(col*a,a);",
    "}"
  ].join("\n");

  function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
  var prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var U = {}; ["res", "mouse", "t", "click", "ct"].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });

  var dpr = Math.min(devicePixelRatio || 1, 1.5), W = 0, H = 0;
  var mouse = [-999, -999], goal = [-999, -999], clickT = 9, visible = true, last = 0, clock = 0;
  function resize() {
    var r = hero.getBoundingClientRect(); W = Math.round(r.width * dpr); H = Math.round(r.height * dpr);
    canvas.width = W; canvas.height = H; gl.viewport(0, 0, W, H);
  }
  hero.addEventListener("pointermove", function (e) {
    var r = hero.getBoundingClientRect();
    goal = [(e.clientX - r.left) * dpr, (r.height - (e.clientY - r.top)) * dpr];
    if (mouse[0] < -900) mouse = goal.slice();
  });
  hero.addEventListener("pointerleave", function () { goal = [-999, -999]; mouse = [-999, -999]; });
  hero.addEventListener("pointerdown", function (e) {
    var r = hero.getBoundingClientRect();
    mouse = goal = [(e.clientX - r.left) * dpr, (r.height - (e.clientY - r.top)) * dpr]; clickT = 0;
  });
  function frame(now) {
    var dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016; last = now;
    clock += still ? 0 : dt; clickT += dt;
    mouse[0] += (goal[0] - mouse[0]) * (1 - Math.exp(-dt / 0.09)); mouse[1] += (goal[1] - mouse[1]) * (1 - Math.exp(-dt / 0.09));
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(U.res, W, H); gl.uniform2f(U.mouse, mouse[0], mouse[1]); gl.uniform1f(U.t, clock);
    gl.uniform1f(U.click, 1); gl.uniform1f(U.ct, clickT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (visible && !still) requestAnimationFrame(frame);
  }
  new IntersectionObserver(function (e) {
    var v = e[e.length - 1].isIntersecting;
    if (v && !visible) { visible = true; last = 0; requestAnimationFrame(frame); } else visible = v;
  }).observe(hero);
  addEventListener("resize", resize);
  resize(); requestAnimationFrame(frame);
})();
