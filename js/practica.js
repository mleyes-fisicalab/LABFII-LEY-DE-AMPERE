/* ==========================================================================
   Cuaderno interactivo · Práctica 7 · Ley de Ampère (campo en el centro de un solenoide)
   ========================================================================== */
const MU0 = 4 * Math.PI * 1e-7;
const SOL = { N: 30, L: 0.360, D: 0.080 };             // espiras, longitud efectiva (m), diámetro (m)
const IS = [0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0];
const OFF = { x: 0.043, z: -0.021 };                    // campo de fondo en mT antes de compensar
const PXCM = 10.556, RX0 = 130;                        // escala del dibujo: px por cm, inicio de la regla
const COIL0 = RX0 + 1.9 * PXCM;                        // la bobina empieza en 1,9 cm de la regla

function lab() { return Object.assign({ I: 0, pol: -1, comp: null, run: 0 }, Store.get("lab", {})); }
function Btrue(I, pol) { return pol * MU0 * SOL.N * I / Math.sqrt(SOL.L ** 2 + SOL.D ** 2) * 1e3; } // mT
function tesla(s) {
  const b = Btrue(s.I, s.pol), c = s.comp || { x: 0, z: 0 };
  const q = v => Math.round(v * 100) / 100; // rango de 20 mT: resolución 0,01 mT
  return { x: q(b + OFF.x - c.x + 0.004 * gauss()), z: q(0.03 * b + OFF.z - c.z + 0.004 * gauss()) };
}
function rows1() {
  const d = Store.get("t1", null); if (d) return d;
  const r = IS.map(I => ({ I, b: [null, null, null] })); Store.set("t1", r); return r;
}
function avgB() { return rows1().map(r => { const v = r.b.filter(x => x != null && isFinite(x)); return { I: r.I, n: v.length, B: v.length ? mean(v) * 1e-3 : NaN }; }); }
function fitB() { return linreg(avgB().filter(r => r.n).map(r => [r.I, r.B])); }
function geom() { return Object.assign({ L: NaN, N: NaN }, Store.get("geom", {})); }
function mu0pre() { const v = Store.get("mu0pre", null); return v == null ? MU0 : v; }
function mu0med() { const f = fitB(), g = geom(); return f && isFinite(g.L) && isFinite(g.N) && g.N > 0 ? f.m * (g.L / 100) / g.N : NaN; }

/* ---------- tablas ---------- */
function t1HTML(editable = true) {
  const rs = rows1();
  const cell = (i, j) => { const v = rs[i].b[j]; return editable ? { v: `<input data-i="${i}" data-j="${j}" value="${v != null && isFinite(v) ? fmt(v, 2) : ""}" inputmode="decimal" aria-label="Bx lectura ${j + 1} para ${fmt(rs[i].I, 1)} A">` } : (v != null && isFinite(v) ? fmt(v, 2) : "—"); };
  return tableHTML({ id: "t1", caption: "Tabla 1. Campo axial Bₓ en el centro del solenoide (3 lecturas)", head: ["I (A)", "Bₓ₁ (mT)", "Bₓ₂ (mT)", "Bₓ₃ (mT)"],
    rows: rs.map((r, i) => [fmt(r.I, 1), cell(i, 0), cell(i, 1), cell(i, 2)]) });
}
function t2HTML() {
  const a = avgB();
  return tableHTML({ id: "t2", caption: "Tabla 2. Promedio del campo magnético en teslas", head: ["I (A)", ...a.map(r => fmt(r.I, 1))],
    rows: [[{ v: "B (T)", cls: "lbl" }, ...a.map(r => r.n ? sciT(r.B, 3) : "—")]] });
}
function resHTML() {
  const f = fitB(), g = geom(), mm = mu0med(), pre = mu0pre();
  return tableHTML({ id: "t3", caption: "Resultados del análisis", head: ["Magnitud", "Valor"], rows: [
    [{ v: "Ecuación de la gráfica", cls: "lbl" }, f ? eqStr(f, "·I", "B", 4) : "—"], [{ v: "R²", cls: "lbl" }, f ? fmt(f.r2, 5) : "—"],
    [{ v: "L (m) · N", cls: "lbl" }, isFinite(g.L) && isFinite(g.N) ? `${fmt(g.L / 100, 3)} m · ${g.N} espiras` : "Registra L y N en el laboratorio"],
    [{ v: "μ₀ medida (T·m/A)", cls: "lbl" }, sciT(mm, 4)], [{ v: "μ₀ preinforme (T·m/A)", cls: "lbl" }, sciT(pre, 4)],
    [{ v: "Eᵣ (%)", cls: "lbl" }, isFinite(mm) ? fmt(Math.abs(mm - pre) / pre * 100, 2) : "—"]] });
}

/* ---------- dibujo del montaje ---------- */
function solenoidSVG(s) {
  const cy = 150, ry = 40, x1 = COIL0, x2 = COIL0 + 36 * PXCM, mid = (x1 + x2) / 2, on = Math.abs(s.I) > 0;
  let back = "", front = "";
  for (let i = 0; i < SOL.N; i++) {
    const x = x1 + i * (x2 - x1) / (SOL.N - 1), w = 5;
    back += `<path d="M${x},${cy - ry} C${x + w},${cy - ry / 2} ${x + w},${cy + ry / 2} ${x + w * .4},${cy + ry}" fill="none" stroke="#8c4519" stroke-width="1.6" opacity=".4"/>`;
    front += `<path d="M${x + w * .4},${cy + ry} C${x - w},${cy + ry / 2} ${x - w},${cy - ry / 2} ${x + w * 1.4},${cy - ry}" fill="none" stroke="${on ? "#c76a2a" : "#9a5a2c"}" stroke-width="2.4"/>`;
  }
  const dir = s.pol > 0 ? 1 : -1, op = on ? 0.25 + 0.7 * Math.abs(s.I) / 2 : 0;
  const arrows = [0.2, 0.4, 0.6, 0.8].map(f => { const x = x1 + (x2 - x1) * f; return `<path d="M${x - 14 * dir},${cy - 22} H${x + 14 * dir} M${x + 8 * dir},${cy - 27} L${x + 14 * dir},${cy - 22} L${x + 8 * dir},${cy - 17}" stroke="var(--acc)" stroke-width="2" fill="none" opacity="${op.toFixed(2)}"/>`; }).join("");
  const tk = []; for (let c = 0; c <= 40; c++) { const x = RX0 + c * PXCM; tk.push(`<line x1="${x}" y1="246" x2="${x}" y2="${c % 5 ? 254 : 260}" stroke="#3a3226"/>${c % 5 ? "" : `<text x="${x}" y="274" text-anchor="middle">${c}</text>`}`); }
  return `<svg viewBox="0 0 640 300" role="img" aria-label="Solenoide con la sonda Hall axial en su centro y regla en centímetros">
  ${back}<rect x="${x1 - 30}" y="${cy - ry - 3}" width="${x2 - x1 + 60}" height="${2 * ry + 6}" rx="10" fill="rgba(190,214,218,.28)" stroke="#3a3226"/>
  <line x1="12" y1="${cy}" x2="${mid}" y2="${cy}" stroke="#3a3226" stroke-width="7" stroke-linecap="round"/><line x1="12" y1="${cy}" x2="${mid}" y2="${cy}" stroke="#cfd4d8" stroke-width="4.5" stroke-linecap="round"/>
  <rect x="${mid - 6}" y="${cy - 5}" width="10" height="10" fill="#2d2a26"/>${arrows}${front}
  <text x="${mid}" y="${cy + ry + 22}" text-anchor="middle" style="fill:var(--fg)">sonda Hall en el centro</text>
  <rect x="${RX0 - 8}" y="240" width="${40 * PXCM + 16}" height="40" fill="#f0dfb0" stroke="#3a3226" rx="2"/>${tk.join("")}<text x="${RX0 + 40 * PXCM + 2}" y="292" text-anchor="end" style="font-size:10px">cm</text>
  <text x="16" y="28" class="lb">Vista lateral · bobina de ${on ? fmt(s.I, 2) + " A" : "0 A"}</text></svg>`;
}

/* ---------- explorador del lazo amperiano ---------- */
function explState() {
  return Object.assign({ shape: "circle", wires: [{ x: 0, y: 0, I: 10 }, { x: 5.5, y: 2.5, I: -6 }], loop: { cx: 0.6, cy: 0.3, r: 3.6, w: 7, h: 5.5 }, sel: 0 }, Store.get("expl", {}));
}
function fieldAt(st, x, y) { // x, y en cm → B en µT
  let bx = 0, by = 0;
  for (const w of st.wires) { const dx = (x - w.x) / 100, dy = (y - w.y) / 100, r2 = dx * dx + dy * dy; if (r2 < 1e-8) continue; const k = MU0 * w.I / (2 * Math.PI * r2) * 1e6; bx += -k * dy; by += k * dx; }
  return [bx, by];
}
function loopPts(st, N = 1440) {
  const L = st.loop, pts = [];
  if (st.shape === "circle") for (let i = 0; i < N; i++) { const t = i / N * 2 * Math.PI; pts.push([L.cx + L.r * Math.cos(t), L.cy + L.r * Math.sin(t)]); }
  else { const x0 = L.cx - L.w / 2, x1 = L.cx + L.w / 2, y0 = L.cy - L.h / 2, y1 = L.cy + L.h / 2, n = N / 4;
    const seg = (a, b) => { for (let i = 0; i < n; i++) pts.push([a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n]); };
    seg([x1, L.cy], [x1, y1]); seg([x1, y1], [x0, y1]); seg([x0, y1], [x0, y0]); seg([x0, y0], [x1, y0]); seg([x1, y0], [x1, L.cy]); }
  return pts;
}
function inside(st, x, y) { const L = st.loop; return st.shape === "circle" ? Math.hypot(x - L.cx, y - L.cy) < L.r : Math.abs(x - L.cx) < L.w / 2 && Math.abs(y - L.cy) < L.h / 2; }
function circulation(st) {
  const P = loopPts(st), n = P.length; let sum = 0, s = 0; const prof = [];
  for (let i = 0; i < n; i++) {
    const a = P[i], b = P[(i + 1) % n], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], dl = Math.hypot(dx, dy);
    const [bx, by] = fieldAt(st, mx, my), bt = (bx * dx + by * dy) / dl;
    sum += bt * 1e-6 * dl / 100; s += dl; if (i % 8 === 0) prof.push([s, bt]);
  }
  const Ienc = st.wires.filter(w => inside(st, w.x, w.y)).reduce((q, w) => q + w.I, 0);
  return { circ: sum, Ienc, mu: MU0 * Ienc, prof, perim: s };
}


/* ---------- páginas ---------- */
const PAGES = [
{ id: "portada", cover: true, group: "Inicio", nav: "Portada", html: () => coverHTML() },
{
  id: "introduccion", group: "Inicio", nav: "Objetivos y materiales",
  eyebrow: "Introducción", title: "Objetivos, materiales y ruta de trabajo",
  html: () => `<div class="grid2"><div class="card"><h3>Objetivos</h3><ul class="clean">
    <li>Verificar que la circulación $\\oint \\vec B\\cdot d\\vec\\ell$ depende solo de la corriente encerrada.</li>
    <li>Medir el campo magnético axial en el centro de un solenoide para distintas corrientes.</li>
    <li>Comprobar que el campo es proporcional a la corriente.</li>
    <li>Determinar experimentalmente la permeabilidad magnética del vacío μ₀ y su error porcentual.</li></ul></div>
  <div class="card"><h3>Materiales</h3><ul class="clean"><li>Solenoide enrollado sobre tubo acrílico</li><li>Fuente de alimentación DC con limitación de corriente</li>
    <li>Amperímetro</li><li>Teslámetro con sonda Hall axial (rango de 20 mT)</li><li>Soporte para la sonda, regla y cables de conexión</li></ul></div></div>
  <div class="callout warn"><b>Precaución.</b> No toque ningún cable o conexión mientras la fuente esté encendida. La bobina se calienta a medida que aumenta la corriente: después de 10 minutos de uso continuo, apague la fuente y espere otros 10 minutos antes de seguir midiendo.</div>
  <div class="stack"><h2>Ruta del cuaderno</h2><div class="steps">
    <div><b>Marco teórico</b><br><span class="small">Ley de Ampère, solenoide y explorador del lazo amperiano.</span></div>
    <div><b>Datos experimentales</b><br><span class="small">L, N y Tabla 1 con tres lecturas de Bₓ por corriente.</span></div>
    <div><b>Análisis</b><br><span class="small">Tabla 2, gráfica B = f(I), μ₀ medida y error.</span></div>
    <div><b>Preguntas y conclusiones</b><br><span class="small">Respuestas, autoevaluación e informe final.</span></div></div></div>
  <div class="callout acc"><b>Tus datos se quedan en este navegador.</b> Si trabajas con el montaje real, escribe tus lecturas en la Tabla 1: el análisis se recalcula solo.</div>`
},
{
  id: "teoria", group: "Marco teórico", nav: "Ley de Ampère y solenoide",
  eyebrow: "1 · Marco teórico", title: "La ley de Ampère y el campo de un solenoide",
  html: () => `
  <p class="lead">Una corriente eléctrica produce un campo magnético. La ley de Ampère relaciona la circulación de ese campo a lo largo de una curva cerrada con la corriente que la curva encierra.</p>
  <div class="grid2">
    <div class="card stack"><h3>Enunciado</h3><p>Para cualquier curva cerrada C, llamada lazo amperiano,</p>
      <div class="eq">$$\\oint_C \\vec B\\cdot d\\vec\\ell=\\mu_0\\, I_{\\text{enc}}$$</div>
      <p>$I_{\\text{enc}}$ es la corriente neta que atraviesa la superficie limitada por C. La regla de la mano derecha fija el signo de cada corriente según el sentido del recorrido.</p>
      <p class="small">$\\mu_0 = 4\\pi\\times10^{-7}\\ \\text{T·m/A} \\approx 1{,}2566\\times10^{-6}\\ \\text{T·m/A}$</p></div>
    <div class="card stack"><h3>Solenoide largo</h3><p>Dentro de un solenoide largo el campo es casi uniforme y paralelo al eje; afuera es casi nulo. Se toma un lazo rectangular con un lado de longitud ℓ dentro de la bobina y el otro afuera. Solo el lado interior contribuye:</p>
      <div class="eq">$$B\\,\\ell=\\mu_0\\,\\frac{N}{L}\\,\\ell\\, I\\qquad\\Longrightarrow\\qquad B=\\frac{\\mu_0 N I}{L}$$</div>
      <p>N es el número de espiras y L la longitud efectiva de la bobina.</p></div>
  </div>
  <div class="grid2">
    <div class="card stack"><h3>Cómo obtener μ₀ de la gráfica</h3><p>Si se grafica B en función de I, la recta tiene pendiente</p>
      <div class="eq">$$m=\\frac{\\mu_0 N}{L}\\qquad\\Longrightarrow\\qquad \\mu_{0,\\text{medida}}=\\frac{m\\,L}{N}$$</div>
      <p class="small">B en teslas (1 mT = 10⁻³ T), I en amperios y L en metros.</p></div>
    <div class="card stack"><h3>El solenoide real no es infinito</h3><p>En el centro de un solenoide de longitud L y diámetro D,</p>
      <div class="eq">$$B=\\frac{\\mu_0 N I}{\\sqrt{L^2+D^2}}$$</div>
      <p>Cuando $D \\ll L$ se recupera la expresión del solenoide largo. Con un tubo de 8 cm y una bobina de 36 cm, la diferencia es de un 2 %: es una de las causas del error.</p></div>
  </div>`
},
{
  id: "explorador", group: "Marco teórico", nav: "Explorador del lazo amperiano",
  eyebrow: "1 · Marco teórico", title: "Explorador del lazo amperiano",
  html: () => `<p class="lead">Arrastra los conductores y el lazo. Cambia su forma y tamaño. La circulación calculada numéricamente siempre coincide con μ₀ por la corriente encerrada, aunque el campo sobre el lazo cambie punto a punto.</p>
  <div class="row"><div class="seg" id="shape"><button data-s="circle">Lazo circular</button><button data-s="rect">Lazo rectangular</button></div>
    <button class="btn sm" id="addw">Agregar conductor</button><button class="btn sm" id="delw">Quitar conductor seleccionado</button><button class="btn sm" id="rst">Restablecer</button></div>
  <div class="expl"><canvas id="ex" aria-label="Campo magnético de los conductores y lazo amperiano. Arrastra para mover."></canvas></div>
  <div class="card tight row" style="gap:16px"><label class="f" style="flex:1;min-width:220px"><span>Corriente del conductor seleccionado: <b class="mono" id="ival"></b></span><input type="range" id="isl" min="-20" max="20" step="1"></label>
    <span class="small" style="flex:1;min-width:200px">⊙ corriente hacia afuera de la pantalla (positiva) · ⊗ hacia adentro (negativa). El lazo se recorre en sentido antihorario.</span></div>
  <div class="res3"><div class="card tight"><div class="meterlbl">Corriente encerrada</div><div class="v" id="ienc"></div></div>
    <div class="card tight"><div class="meterlbl" style="text-transform:none;letter-spacing:.04em">μ₀ · I<sub>enc</sub></div><div class="v" id="mui"></div></div>
    <div class="card tight"><div class="meterlbl" style="text-transform:none;letter-spacing:.04em">∮ B · dℓ numérica</div><div class="v" id="circ"></div></div></div>
  <div class="card stack"><h3>Componente tangencial del campo a lo largo del lazo</h3><p class="small">El área bajo esta curva, en las unidades del SI, es la circulación. Mueve un conductor fuera del lazo: la curva cambia, pero su área neta no.</p><div id="prof"></div></div>`,
  mount(el) {
    const st = explState(), cv = $("#ex", el), ctx = cv.getContext("2d");
    const P = new CartesianPlane($("#prof", el), { id: "prof", height: 260, xLabel: "s (cm)", yLabel: "Bₜ (µT)" });
    let scale = 1, ox = 0, oy = 0; // px por cm y origen
    const W2P = (x, y) => [ox + x * scale, oy - y * scale], P2W = (px, py) => [(px - ox) / scale, (oy - py) / scale];
    const save = () => Store.set("expl", st);
    const draw = () => {
      const dpr = devicePixelRatio || 1, W = cv.clientWidth, H = cv.clientHeight; if (!W) return;
      if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      scale = Math.min(W / 22, H / 16); ox = W / 2; oy = H / 2;
      const g1 = cssVar("--grid1"), g2 = cssVar("--grid2"), acc = cssVar("--acc"), gold = cssVar("--gold"), bad = cssVar("--bad"), fg = cssVar("--fg"), fg3 = cssVar("--fg3"), c5 = cssVar("--c5");
      const xm = W / 2 / scale, ym = H / 2 / scale;
      for (const [st2, col] of [[1, g1], [5, g2]]) { ctx.strokeStyle = col; ctx.beginPath(); for (let x = Math.ceil(-xm / st2) * st2; x <= xm; x += st2) { const p = W2P(x, 0)[0]; ctx.moveTo(p, 0); ctx.lineTo(p, H); } for (let y = Math.ceil(-ym / st2) * st2; y <= ym; y += st2) { const p = W2P(0, y)[1]; ctx.moveTo(0, p); ctx.lineTo(W, p); } ctx.stroke(); }
      ctx.fillStyle = fg3; ctx.font = `500 11px ${cssVar("--f-mono")}`; ctx.fillText("1 cuadro = 1 cm", 10, H - 10);
      // flechas del campo
      const stp = 1.1;
      for (let x = -Math.floor(xm / stp) * stp; x <= xm; x += stp) for (let y = -Math.floor(ym / stp) * stp; y <= ym; y += stp) {
        if (st.wires.some(w => Math.hypot(x - w.x, y - w.y) < 0.7)) continue;
        const [bx, by] = fieldAt(st, x, y), b = Math.hypot(bx, by); if (b < 1e-3) continue;
        const len = Math.min(0.45 * scale * stp, (6 + 9 * Math.log10(1 + b / 8))), ux = bx / b, uy = by / b, [px, py] = W2P(x, y);
        const a = clamp(0.25 + Math.log10(1 + b / 10) * 0.5, 0.25, 0.95);
        ctx.strokeStyle = acc; ctx.globalAlpha = a; ctx.lineWidth = 1.4; const x2 = px + ux * len / 2, y2 = py - uy * len / 2;
        ctx.beginPath(); ctx.moveTo(px - ux * len / 2, py + uy * len / 2); ctx.lineTo(x2, y2);
        ctx.lineTo(x2 - ux * 4 + uy * 3, y2 + uy * 4 + ux * 3); ctx.moveTo(x2, y2); ctx.lineTo(x2 - ux * 4 - uy * 3, y2 + uy * 4 - ux * 3); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // lazo coloreado según B tangencial
      const pts = loopPts(st, 720), n = pts.length;
      for (let i = 0; i < n; i++) {
        const a = pts[i], b = pts[(i + 1) % n], [bx, by] = fieldAt(st, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2), dx = b[0] - a[0], dy = b[1] - a[1], bt = (bx * dx + by * dy) / Math.hypot(dx, dy);
        ctx.strokeStyle = bt >= 0 ? gold : bad; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(...W2P(...a)); ctx.lineTo(...W2P(...b)); ctx.stroke();
      }
      for (const f of [0.12, 0.37, 0.62, 0.87]) { const i = Math.floor(f * n), a = W2P(...pts[i]), b = W2P(...pts[(i + 4) % n]), ang = Math.atan2(b[1] - a[1], b[0] - a[0]); ctx.fillStyle = fg; ctx.save(); ctx.translate(...a); ctx.rotate(ang); ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(-5, -5); ctx.lineTo(-5, 5); ctx.fill(); ctx.restore(); }
      const L = st.loop, [hcx, hcy] = W2P(L.cx, L.cy), hdl = W2P(st.shape === "circle" ? L.cx + L.r : L.cx + L.w / 2, st.shape === "circle" ? L.cy : L.cy + L.h / 2);
      ctx.strokeStyle = fg; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(hcx - 6, hcy); ctx.lineTo(hcx + 6, hcy); ctx.moveTo(hcx, hcy - 6); ctx.lineTo(hcx, hcy + 6); ctx.stroke();
      ctx.fillStyle = gold; ctx.beginPath(); ctx.arc(...hdl, 7, 0, 7); ctx.fill(); ctx.strokeStyle = cssVar("--bg"); ctx.lineWidth = 2; ctx.stroke();
      // conductores
      st.wires.forEach((w, i) => {
        const [px, py] = W2P(w.x, w.y), col = w.I >= 0 ? bad : c5;
        ctx.fillStyle = cssVar("--bg2"); ctx.strokeStyle = col; ctx.lineWidth = i === st.sel ? 3.5 : 2; ctx.beginPath(); ctx.arc(px, py, 12, 0, 7); ctx.fill(); ctx.stroke();
        if (w.I >= 0) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(px, py, 3.5, 0, 7); ctx.fill(); } else { ctx.beginPath(); ctx.moveTo(px - 6, py - 6); ctx.lineTo(px + 6, py + 6); ctx.moveTo(px + 6, py - 6); ctx.lineTo(px - 6, py + 6); ctx.stroke(); }
        ctx.fillStyle = fg; ctx.font = `600 12px ${cssVar("--f-mono")}`; ctx.fillText(`${w.I > 0 ? "+" : ""}${w.I} A`, px + 15, py - 12);
      });
    };
    const results = () => {
      const c = circulation(st);
      $("#ienc", el).textContent = fmt(c.Ienc, 1) + " A"; $("#mui", el).textContent = fmt(c.mu * 1e6, 3) + " µT·m"; $("#circ", el).textContent = fmt(c.circ * 1e6, 3) + " µT·m";
      P.setSeries([{ id: "bt", type: "line", data: c.prof, label: "Bₜ a lo largo del lazo", color: "--c1" }], true);
      const w = st.wires[st.sel]; $("#isl", el).value = w ? w.I : 0; $("#ival", el).textContent = w ? `${w.I} A` : "—"; $("#isl", el).disabled = !w;
      $$("#shape button", el).forEach(b => b.setAttribute("aria-pressed", String(b.dataset.s === st.shape)));
    };
    const all = () => { draw(); results(); save(); };
    let drag = null;
    cv.addEventListener("pointerdown", e => {
      const r = cv.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top, [x, y] = P2W(px, py); cv.setPointerCapture(e.pointerId);
      const wi = st.wires.findIndex(w => Math.hypot(...W2P(w.x, w.y).map((v, k) => v - [px, py][k])) < 16);
      const L = st.loop, h = W2P(st.shape === "circle" ? L.cx + L.r : L.cx + L.w / 2, st.shape === "circle" ? L.cy : L.cy + L.h / 2);
      if (wi >= 0) { st.sel = wi; drag = { k: "w", i: wi, dx: x - st.wires[wi].x, dy: y - st.wires[wi].y }; }
      else if (Math.hypot(h[0] - px, h[1] - py) < 14) drag = { k: "size" };
      else if (inside(st, x, y)) drag = { k: "loop", dx: x - L.cx, dy: y - L.cy };
      all();
    });
    cv.addEventListener("pointermove", e => {
      const r = cv.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top, [x, y] = P2W(px, py);
      if (!drag) { const L = st.loop; cv.style.cursor = st.wires.some(w => Math.hypot(...W2P(w.x, w.y).map((v, k) => v - [px, py][k])) < 16) ? "grab" : inside(st, x, y) ? "move" : "default"; return; }
      const snap = v => Math.round(v * 10) / 10;
      if (drag.k === "w") { st.wires[drag.i].x = snap(x - drag.dx); st.wires[drag.i].y = snap(y - drag.dy); }
      if (drag.k === "loop") { st.loop.cx = snap(x - drag.dx); st.loop.cy = snap(y - drag.dy); }
      if (drag.k === "size") { const L = st.loop; if (st.shape === "circle") L.r = clamp(Math.hypot(x - L.cx, y - L.cy), 0.5, 9); else { L.w = clamp(2 * Math.abs(x - L.cx), 1, 20); L.h = clamp(2 * Math.abs(y - L.cy), 1, 15); } }
      draw(); if (!drag.t || performance.now() - drag.t > 60) { drag.t = performance.now(); results(); }
    });
    const up = () => { if (drag) { drag = null; all(); } }; cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
    $$("#shape button", el).forEach(b => b.onclick = () => { st.shape = b.dataset.s; all(); });
    $("#isl", el).oninput = e => { const w = st.wires[st.sel]; if (w) { w.I = +e.target.value; all(); } };
    $("#addw", el).onclick = () => { if (st.wires.length >= 5) { toast("Máximo cinco conductores"); return; } st.wires.push({ x: -5 + st.wires.length * 2, y: -4, I: 5 }); st.sel = st.wires.length - 1; all(); };
    $("#delw", el).onclick = () => { if (st.wires.length) { st.wires.splice(st.sel, 1); st.sel = 0; all(); } };
    $("#rst", el).onclick = () => { Store.set("expl", null); Object.assign(st, explState()); Store.set("expl", null); all(); };
    const ro = new ResizeObserver(draw); ro.observe(cv); NB.onLeave(() => ro.disconnect());
    document.addEventListener("nb-theme", draw); NB.onLeave(() => document.removeEventListener("nb-theme", draw));
    all();
  }
},
{
  id: "laboratorio", group: "Datos experimentales", nav: "Laboratorio virtual",
  eyebrow: "2 · Datos experimentales", title: "Montaje de la Figura 1 y toma de datos",
  html: () => `<p class="lead">Sigue los pasos de la guía: mide la bobina, compensa el teslámetro, ajusta la corriente y registra tres lecturas del campo axial Bₓ para cada corriente de la Tabla 1.</p>
  <div class="bench" style="display:block"><div class="stage" id="stg"></div></div>
  <div class="grid2">
    <div class="card stack"><div class="sechead"><span class="num">1</span><h3>Longitud efectiva y número de espiras</h3></div>
      <p class="small">Usa la regla del dibujo: mide solo el tramo donde están enrolladas las espiras y cuéntalas.</p>
      <div class="row"><label class="f"><span>L (cm)</span><input type="text" id="gL" inputmode="decimal" style="width:110px"></label><label class="f"><span>N (espiras)</span><input type="text" id="gN" inputmode="numeric" style="width:110px"></label>
        <button class="btn sm" id="gchk" style="align-self:flex-end">Verificar</button></div><div id="gmsg" class="small"></div></div>
    <div class="card stack"><div class="sechead"><span class="num">2</span><h3>Teslámetro · rango de 20 mT</h3></div>
      <div class="grid2" style="gap:10px"><div><div class="meterlbl" style="text-transform:none">Bₓ (axial)</div><div class="meter" id="mx"></div></div><div><div class="meterlbl" style="text-transform:none">B<sub>z</sub></div><div class="meter" id="mz"></div></div></div>
      <div class="row"><button class="btn sm" id="comp">Compensar Bₓ y B<sub>z</sub> a 0 mT</button><span id="cst"></span></div></div>
  </div>
  <div class="grid2">
    <div class="card stack"><div class="sechead"><span class="num">3</span><h3>Fuente y amperímetro</h3></div>
      <p class="small">Corriente máxima de la fuente ajustada en 3,2 A. Sube el voltaje hasta que el amperímetro marque la corriente de la tabla.</p>
      <div class="grid2" style="gap:10px"><div><div class="meterlbl">Amperímetro</div><div class="meter" id="ma"></div></div><div><div class="meterlbl">Uso continuo</div><div class="meter" id="mt"></div></div></div>
      <label class="f"><span>Corriente: <b class="mono" id="iv"></b></span><input type="range" id="isl" min="0" max="2" step="0.01"></label>
      <div class="chips" id="ich"></div>
      <div class="row"><button class="btn sm" id="pol">Invertir conexión del solenoide</button><button class="btn sm" id="off">Apagar la fuente</button></div></div>
    <div class="card stack"><div class="sechead"><span class="num">4</span><h3>Registro</h3></div>
      <button class="btn pri" id="rec">Registrar lectura de Bₓ</button><p class="small" id="rmsg"></p>
      <p class="small"><b>Nota de la guía:</b> si el teslámetro indica un campo negativo, invierte la conexión del solenoide para que la lectura sea positiva.</p></div>
  </div>
  <div class="stack"><div class="row" style="justify-content:space-between"><h2>Tabla 1</h2><div class="row">${copyBtn("#t1")}<button class="btn sm" id="clr">Borrar la tabla</button></div></div><div id="tw"></div></div>`,
  mount(el) {
    let s = lab(), shown = { x: 0, z: 0 }; const g = geom();
    $("#gL", el).value = isFinite(g.L) ? fmt(g.L, 1) : ""; $("#gN", el).value = isFinite(g.N) ? g.N : "";
    const saveG = () => { Store.set("geom", { L: num($("#gL", el).value), N: num($("#gN", el).value) }); };
    $("#gL", el).oninput = saveG; $("#gN", el).oninput = saveG;
    $("#gchk", el).onclick = () => { saveG(); const G = geom(); const okL = Math.abs(G.L - SOL.L * 100) <= 0.5, okN = G.N === SOL.N;
      $("#gmsg", el).innerHTML = (okL ? '<span class="pill ok">L correcta</span>' : '<span class="pill warn">Revisa L: mide de la primera a la última espira</span>') + " " + (okN ? '<span class="pill ok">N correcto</span>' : '<span class="pill warn">Vuelve a contar las espiras</span>'); };
    const table = () => {
      $("#tw", el).innerHTML = t1HTML();
      $$("#t1 input", el).forEach(inp => inp.onchange = () => { const r = rows1(), v = num(inp.value); r[+inp.dataset.i].b[+inp.dataset.j] = isFinite(v) ? v : null; Store.set("t1", r); table(); paint(); });
    };
    const paint = () => {
      Store.set("lab", s); $("#stg", el).innerHTML = solenoidSVG(s);
      $("#isl", el).value = s.I; $("#iv", el).textContent = fmt(s.I, 2) + " A"; $("#ma", el).innerHTML = fmt(s.I, 2) + "<small>A</small>";
      const done = rows1().filter(r => r.b.every(x => x != null)).map(r => r.I);
      $("#ich", el).innerHTML = IS.map(v => `<button data-i="${v}" aria-pressed="${Math.abs(v - s.I) < 1e-9}" class="${done.includes(v) ? "done" : ""}">${fmt(v, 1)} A</button>`).join("");
      $$("#ich button", el).forEach(b => b.onclick = () => { s.I = +b.dataset.i; paint(); });
      $("#cst", el).innerHTML = s.comp ? '<span class="pill ok">Compensado</span>' : '<span class="pill warn">Sin compensar</span>';
      const row = rows1().find(r => Math.abs(r.I - s.I) < 1e-9);
      $("#rmsg", el).textContent = !row ? "Ajusta una de las corrientes de la Tabla 1 para registrar." : `Lecturas para ${fmt(s.I, 1)} A: ${row.b.filter(x => x != null).length} de 3.`;
    };
    $("#isl", el).oninput = e => { s.I = Math.round(+e.target.value * 100) / 100; paint(); };
    $("#pol", el).onclick = () => { s.pol = -s.pol; paint(); toast("Conexión del solenoide invertida"); };
    $("#off", el).onclick = () => { s.I = 0; paint(); };
    $("#comp", el).onclick = () => { if (s.I !== 0) { toast("Apaga la corriente antes de compensar"); return; } s.comp = { x: OFF.x + 0.002 * gauss(), z: OFF.z + 0.002 * gauss() }; paint(); toast("Teslámetro compensado"); };
    $("#rec", el).onclick = () => {
      const r = rows1(), row = r.find(x => Math.abs(x.I - s.I) < 1e-9);
      if (!row) { toast("Esa corriente no está en la Tabla 1"); return; }
      const j = row.b.findIndex(x => x == null); if (j < 0) { toast("Ya hay 3 lecturas para esta corriente"); return; }
      row.b[j] = shown.x; Store.set("t1", r); table(); paint();
      toast(shown.x < 0 ? "Registrado. La lectura es negativa: invierte la conexión." : "Lectura registrada");
    };
    $("#clr", el).onclick = () => { Store.set("t1", IS.map(I => ({ I, b: [null, null, null] }))); table(); paint(); toast("Tabla 1 borrada"); };
    table(); paint();
    let t0 = 0, last = performance.now();
    NB.raf(t => {
      const dt = (t - last) / 1000; last = t; if (s.I > 0) s.run += dt; else s.run = Math.max(0, s.run - dt);
      if (t - t0 < 400) return; t0 = t; shown = tesla(s);
      const mx = $("#mx", el), mz = $("#mz", el), mt = $("#mt", el);
      if (mx) { mx.innerHTML = fmt(shown.x, 2) + "<small>mT</small>"; mz.innerHTML = fmt(shown.z, 2) + "<small>mT</small>"; }
      if (mt) { const m = Math.floor(s.run / 60), sec = Math.floor(s.run % 60); mt.innerHTML = `${m}:${String(sec).padStart(2, "0")}<small>${s.run > 600 ? "¡pausa!" : "min"}</small>`; mt.style.color = s.run > 600 ? "#ff8a7a" : ""; }
      Store.set("lab", s);
    });
  }
},
{
  id: "analisis", group: "Análisis", nav: "Gráfica B = f(I) y μ₀",
  eyebrow: "3 · Análisis", title: "Promedios, gráfica y permeabilidad magnética del vacío",
  html: () => `<div class="stack"><div class="row" style="justify-content:space-between"><h2>Tabla 2</h2>${copyBtn("#t2")}</div>${t2HTML()}
    <p class="small">B es el promedio de las tres lecturas de Bₓ convertido a teslas.</p></div>
  <div class="card stack"><h3>Campo magnético en función de la corriente</h3><div id="pl"></div></div>
  <div class="grid2"><div class="card"><div class="eq">$$B=\\frac{\\mu_0NI}{L}\\;\\Rightarrow\\;\\mu_{0,\\text{medida}}=\\frac{m\\,L}{N}$$</div></div>
    <div class="card"><div class="eq">$$E_r=\\frac{\\left|\\mu_{0,\\text{medida}}-\\mu_{0,\\text{preinforme}}\\right|}{\\mu_{0,\\text{preinforme}}}\\times100\\,\\%$$</div></div></div>
  <div class="card stack"><label class="f" style="max-width:340px"><span>μ₀ consultada en el preinforme (T·m/A)</span><input type="text" id="pre" value="${mu0pre().toExponential(4).replace(".", ",")}"></label></div>
  <div class="stack"><div class="row" style="justify-content:space-between"><h2>Resultados</h2>${copyBtn("#t3")}</div><div id="rw">${resHTML()}</div></div>`,
  mount(el) {
    const a = avgB().filter(r => r.n), f = fitB();
    const P = new CartesianPlane($("#pl", el), { id: "bi", height: 380, xLabel: "I (A)", yLabel: "B (T)" });
    P.setSeries([{ id: "p", type: "points", data: a.map(r => [r.I, r.B]), label: "Tabla 2", color: "--c1", fmtX: v => fmt(v, 2) + " A", fmtY: v => sciT(v, 3) + " T" },
      ...(f ? [{ id: "f", type: "fn", f: x => f.m * x + f.b, label: "Ajuste lineal", color: "--c2", dash: "dash" }] : [])], true);
    if (!a.length) P.setView({ xmin: -0.1, xmax: 2.2, ymin: -2e-5, ymax: 2.5e-4 });
    $("#pre", el).onchange = e => { const v = num(e.target.value); if (isFinite(v) && v > 0) Store.set("mu0pre", v); $("#rw", el).innerHTML = resHTML(); };
  }
},
{ id: "preguntas", group: "Preguntas", nav: "Preguntas del informe", eyebrow: "4 · Preguntas", title: "Preguntas",
  html: () => questionsHTML([
    ["p1", "¿Qué tan estables fueron las lecturas del teslámetro? ¿Hubo variaciones significativas?", "Compara las tres lecturas de cada corriente con la resolución del rango de 20 mT (0,01 mT). A corrientes bajas, ¿qué fracción del valor representa esa resolución?"],
    ["p2", "¿Cómo es la relación entre el campo magnético B y la corriente I?", "Observa la forma de la gráfica, el valor de R² y el intercepto. Relaciónalo con $B=\\mu_0 N I/L$."],
    ["p3", "¿El método empleado es confiable para calcular la permeabilidad magnética del vacío?", "Usa el error porcentual. Piensa en cuánto depende el resultado de la medida de L y del conteo de N, y en la aproximación de solenoide largo."],
    ["p4", "Mencione al menos tres causas físicas o instrumentales que puedan contribuir al error porcentual obtenido en este experimento.", "Considera la longitud finita del solenoide comparada con su diámetro, la posición y orientación de la sonda, la compensación del campo de fondo, la resolución del teslámetro, el calentamiento de la bobina y la medida de L."]]) },
{ id: "conclusiones", group: "Conclusiones", nav: "Conclusiones y autoevaluación", eyebrow: "5 · Conclusiones", title: "Conclusiones y autoevaluación",
  html: conclusionsHTML,
  mount(el) {
    quiz($("#quiz", el), "q7s", [
      { q: "Un solenoide largo de 30 espiras y 0,36 m de longitud lleva 2,0 A. El campo en su centro es aproximadamente:", o: ["0,21 mT", "2,1 mT", "21 mT", "0,021 mT"], a: 0, why: "$B=\\mu_0NI/L=(4\\pi\\times10^{-7})(30)(2{,}0)/0{,}36\\approx2{,}1\\times10^{-4}$ T." },
      { q: "Si se duplica la corriente en el solenoide, el campo en su centro:", o: ["Se reduce a la mitad", "No cambia", "Se duplica", "Se cuadruplica"], a: 2, why: "B es directamente proporcional a I." },
      { q: "En la gráfica B contra I, la pendiente es igual a:", o: ["μ₀ L / N", "μ₀ N / L", "N / μ₀ L", "μ₀ N I"], a: 1, why: "$B=(\\mu_0N/L)\\,I$." },
      { q: "¿Para qué se compensan Bₓ y B<sub>z</sub> a 0 mT antes de encender la fuente?", o: ["Para cambiar el rango", "Para restar el campo de fondo y que la lectura se deba solo a la bobina", "Para invertir la polaridad", "Para calibrar el amperímetro"], a: 1, why: "Sin compensar, el campo terrestre y el del laboratorio se suman a todas las lecturas." },
      { q: "Un lazo amperiano encierra corrientes de +8 A y −3 A; afuera hay otra de +10 A. La circulación de B vale:", o: ["μ₀ · 15 A", "μ₀ · 5 A", "μ₀ · 21 A", "Cero"], a: 1, why: "Solo cuenta la corriente encerrada, con su signo: 8 − 3 = 5 A." }]);
  } },
{ id: "informe", group: "Cierre", nav: "Mi informe", eyebrow: "Cierre", title: "Mi informe",
  html: () => reportHTML(t1HTML(false) + t2HTML() + resHTML(), ["p1", "p2", "p3", "p4"]),
  mount(el) { bindReport(el, "INFORME 7 · LEY DE AMPÈRE", ["p1", "p2", "p3", "p4"]); } }
];
NB.init({ storeKey: "utp-lab2-ampere-solenoide", numero: 7, practica: "Ley de Ampère", illustration: illAmpere(), pages: PAGES });
