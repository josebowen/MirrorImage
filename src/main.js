// Mirror Image. One mission: the two mirror-image forms of ibuprofen.
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GlowPoints, skyDome, mulberry, clamp, lerp } from './fx.js';
import { buildIbuprofen, mirrorOf, makeMesh, makePocket, configuration, PRIORITY } from './molecule.js';
import { TEXT, ABOUT, cite } from './content.js';

const $ = (s) => document.querySelector(s);
const qs = new URLSearchParams(location.search);
const DTCAP = parseFloat(qs.get('dtcap')) || 0.05;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const lite = Math.min(innerWidth, innerHeight) < 700;
const isPhone = () => innerWidth < 820;
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------- renderer and scene ----------
const canvas = $('#gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.92;
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 900);
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x07051a, 0.008);
scene.add(skyDome(0x1c1550, 0x0a0722, 0x030210));
const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.35;
scene.add(new THREE.HemisphereLight(0xcfc4ff, 0x120a30, 0.7));
const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(-6, 12, 14); scene.add(key);
const rim = new THREE.DirectionalLight(0xff7ad9, 0.7); rim.position.set(10, -4, -12); scene.add(rim);

const dataA = buildIbuprofen('S'), dataB = mirrorOf(dataA);
const A = { ...makeMesh(dataA), name: 'A', pos: V(-6.5, 0, 0), q: new THREE.Quaternion(), tq: null };
const B = { ...makeMesh(dataB), name: 'B', pos: V(6.5, 0, 0), q: new THREE.Quaternion(), tq: null };
const ghost = makeMesh(dataA, true); ghost.group.visible = false;
scene.add(A.group, B.group, ghost.group);
const Q0 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.5, -0.7, 0.25));
const mirrorQ = (q) => new THREE.Quaternion(q.x, -q.y, -q.z, q.w);
A.group.quaternion.copy(Q0); B.group.quaternion.copy(mirrorQ(Q0)); A.group.position.copy(A.pos); B.group.position.copy(B.pos);

// mirror plane
const mirrorMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, uniforms: { uT: { value: 0 }, uA: { value: 1 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: `varying vec2 vUv; uniform float uT; uniform float uA;
    void main(){ vec2 p = abs(vUv-0.5)*2.0; float edge = smoothstep(0.93, 1.0, max(p.x,p.y)); float sheen = smoothstep(0.08, 0.0, abs(fract(vUv.x*0.6+vUv.y*0.6-uT*0.07)-0.5)-0.02);
      float v = 0.035 + 0.5*edge + 0.07*sheen + 0.05*(1.0-p.y); gl_FragColor = vec4(vec3(0.72,0.66,1.0)*v*uA, 1.0); }` });
const mirrorMesh = new THREE.Mesh(new THREE.PlaneGeometry(15, 14), mirrorMat); mirrorMesh.rotation.y = Math.PI / 2; scene.add(mirrorMesh);

// pocket stage
const PY = -46, HOVER = 4.6;
const pocket = makePocket(dataA.dirs); pocket.group.position.set(0, PY, 0); scene.add(pocket.group);
const pocketLight = new THREE.PointLight(0x9a8cff, 60, 40, 2); pocketLight.position.set(0, PY + 10, 6); scene.add(pocketLight);

const glow = new GlowPoints(2600); scene.add(glow.points);
const glowX = new GlowPoints(600); glowX.mat.depthTest = false; glowX.points.renderOrder = 12; scene.add(glowX.points);
const rnd = mulberry(5), dust = []; for (let i = 0; i < (lite ? 500 : 1000); i++) dust.push((rnd() - 0.5) * 120, (rnd() - 0.5) * 130 - 20, (rnd() - 0.5) * 90 - 20, rnd() * 6.28, rnd());

const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: lite ? 0 : 4 });
const composer = new EffectComposer(renderer, rt);
composer.addPass(new RenderPass(scene, camera)); composer.addPass(new UnrealBloomPass(new THREE.Vector2(4, 4), 0.4, 0.5, 0.95)); composer.addPass(new OutputPass());
let W = 1, H = 1;
function resize() { W = innerWidth; H = innerHeight; const pr = Math.min(devicePixelRatio || 1, lite ? 1.5 : 2); renderer.setPixelRatio(pr); renderer.setSize(W, H, false); composer.setPixelRatio(pr); composer.setSize(W, H); camera.aspect = W / H; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

// ---------- state ----------
const S = { step: 'title', T: 0, active: null, score: {}, preds: {}, rank: [], rankMiss: false, centerMiss: false, fb: '', fbClass: '', best: 0, timer: 0, hold: 0 };
const ORDER = ['title', 'mirror', 'center', 'rank', 'turn', 'pocket', 'debrief'];
const GLOW = { Acid: 0xff5fa8, Aryl: 0xffb54a, Me: 0x59d98a, H: 0xffffff, center: 0xc3b1ff };

// ---------- camera rig ----------
const VIEWS = { title: { t: [0, 0, 0], w: 27, h: 13, yaw: 0.18, pitch: 0.1, pf: 0.9 }, mirror: { t: [0, 0, 0], w: 27, h: 14, yaw: 0.12, pitch: 0.08, pf: 0.95 }, solo: { t: [-6.5, -0.6, 0], w: 16, h: 17, yaw: 0, pitch: 0.05 }, pocket: { t: [0, PY + 0.5, 0], w: 30, h: 19, yaw: 0.0, pitch: 0.62 } };
const rig = { t: V(0, 0, 0), d: 40, yaw: 0.2, pitch: 0.1, view: VIEWS.title, uy: 0, up: 0, ox: 0, oy: 0 };
const tf = () => Math.tan(camera.fov * Math.PI / 360), tmp = V(0, 0, 0), tmp2 = V(0, 0, 0);
function layout() {
  const ph = isPhone();
  if (S.step === 'title') return ph ? { ox: 0, oy: H * 0.2, fw: W, fh: H * 0.5 } : { ox: -W * 0.2, oy: 0, fw: W * 0.58, fh: H };
  if (ph) { const pb = $('#panel').offsetHeight; return { ox: 0, oy: (pb - 50) / 2, fw: W, fh: Math.max(160, H - pb - 50) }; }
  const P = $('#panel').offsetWidth + 24; return { ox: P / 2, oy: 0, fw: W - P, fh: H };
}
const fitDist = (v, L) => Math.max(v.h * H / (2 * tf() * L.fh), v.w * (W < H ? (v.pf || 0.62) : 1) * H / (2 * tf() * L.fw));
function setView(n, snap) { rig.view = VIEWS[n]; rig.uy = rig.up = 0; if (snap || reduce) { const L = layout(); rig.t.fromArray(rig.view.t); rig.yaw = rig.view.yaw; rig.pitch = rig.view.pitch; rig.d = fitDist(rig.view, L); rig.ox = L.ox; rig.oy = L.oy; } }
function updateRig(dt) {
  const v = rig.view, L = layout(), k = reduce ? 1 : 1 - Math.exp(-2.6 * dt);
  rig.t.lerp(tmp.fromArray(v.t), k); rig.yaw = lerp(rig.yaw, v.yaw, k); rig.pitch = lerp(rig.pitch, v.pitch, k); rig.d = lerp(rig.d, fitDist(v, L), k);
  const ko = reduce ? 1 : 1 - Math.exp(-5 * dt); rig.ox = lerp(rig.ox, L.ox, ko); rig.oy = lerp(rig.oy, L.oy, ko);
  const yaw = rig.yaw + rig.uy, pitch = clamp(rig.pitch + rig.up, -0.5, 1.0);
  camera.position.set(rig.t.x + rig.d * Math.sin(yaw) * Math.cos(pitch), rig.t.y + rig.d * Math.sin(pitch), rig.t.z + rig.d * Math.cos(yaw) * Math.cos(pitch));
  camera.lookAt(rig.t); camera.setViewOffset(W, H, rig.ox, rig.oy, W, H); camera.updateMatrixWorld();
  const sc = H * renderer.getPixelRatio() * 0.5 / tf(); glow.mat.uniforms.uScale.value = sc; glowX.mat.uniforms.uScale.value = sc;
  const fd = Math.min(0.008, 0.5 / rig.d); scene.fog.density = fd; glow.mat.uniforms.uFog.value = fd; glowX.mat.uniforms.uFog.value = 0;
}

// ---------- input: drag rotates the active molecule, tap picks an atom ----------
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function rotateActive(dx, dy) {
  const m = S.active;
  if (!m) { // the camera only orbits on the title and debrief screens, so a drag never moves the whole scene mid-task
    if (S.step === 'title' || S.step === 'debrief') { rig.uy = clamp(rig.uy - dx * 0.6, -0.7, 0.7); rig.up = clamp(rig.up + dy * 0.5, -0.3, 0.4); } return; }
  const up = tmp.set(0, 1, 0).applyQuaternion(camera.quaternion), right = tmp2.set(1, 0, 0).applyQuaternion(camera.quaternion);
  const q = new THREE.Quaternion().setFromAxisAngle(up, dx).multiply(new THREE.Quaternion().setFromAxisAngle(right, dy));
  m.group.quaternion.premultiply(q).normalize(); m.tq = null; S.moved = true;
}
{ let drag = null, moved = 0;
  canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY }; moved = 0; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; moved += Math.abs(dx) + Math.abs(dy); rotateActive(dx * 0.008, dy * 0.008); drag = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener('pointerup', (e) => { if (drag && moved < 6) pick(e.clientX, e.clientY); drag = null; });
  canvas.addEventListener('pointercancel', () => { drag = null; });
  canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAbout();
    if (/^(INPUT|BUTTON|A|SELECT)$/.test(document.activeElement.tagName)) return;
    const s = 0.14; if (e.key === 'ArrowLeft') rotateActive(-s, 0); else if (e.key === 'ArrowRight') rotateActive(s, 0); else if (e.key === 'ArrowUp') rotateActive(0, -s); else if (e.key === 'ArrowDown') rotateActive(0, s); else return; e.preventDefault();
  });
}
function pick(x, y) {
  if (S.step !== 'center' && S.step !== 'rank') return;
  ndc.set(x / W * 2 - 1, -(y / H * 2 - 1)); camera.setViewOffset(W, H, rig.ox, rig.oy, W, H); camera.updateProjectionMatrix();
  ray.setFromCamera(ndc, camera); const hit = ray.intersectObjects(A.atomMeshes, false)[0]; if (!hit) return;
  const atom = dataA.atoms[hit.object.userData.atom];
  if (S.step === 'center' && S.sub === 'find') {
    if (atom.kind === 'center') { S.score.center = !S.centerMiss; S.sub = 'done'; feedback(TEXT.centerRight, 'good'); tone(660, 0.05); render(); }
    else { S.centerMiss = true; feedback(TEXT.centerWrong[atom.kind] || TEXT.centerWrong.h, 'bad'); tone(180, 0.04); }
  } else if (S.step === 'rank' && S.sub === 'rank') {
    const g = atom.group; if (g === 'center') return feedback(TEXT.rankCenter, 'bad'); if (S.rank.includes(g)) return;
    const want = PRIORITY[S.rank.length];
    if (g === want) { S.rank.push(g); tone(520 + S.rank.length * 90, 0.05); feedback(TEXT.rankOk[g], 'good'); if (S.rank.length === 3) { S.rank.push('H'); } if (S.rank.length === 4) { S.score.rank = !S.rankMiss; S.sub = 'done'; render(); } }
    else { S.rankMiss = true; feedback(TEXT.rankWrong[want][g], 'bad'); tone(180, 0.04); }
  }
}

// ---------- sound ----------
let actx = null, soundOn = true;
function tone(hz, g = 0.04, dur = 0.2, type = 'triangle') { if (!actx || !soundOn) return; const t = actx.currentTime, o = actx.createOscillator(), a = actx.createGain(); o.type = type; o.frequency.value = hz; a.gain.setValueAtTime(g, t); a.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(a); a.connect(actx.destination); o.start(t); o.stop(t + dur); }
const chord = () => [523, 659, 784].forEach((f, i) => setTimeout(() => tone(f, 0.05, 0.7, 'sine'), i * 90));

// ---------- geometry checks ----------
const worldDir = (m, g, out) => out.copy(m.data.dirs[g]).applyQuaternion(m.group.quaternion);
const COS = Math.cos(24 * Math.PI / 180), a1 = V(0, 0, 0), a2 = V(0, 0, 0);
function overlap() { let n = 0; for (const g of PRIORITY) { worldDir(B, g, a1); a2.copy(dataA.dirs[g]).applyQuaternion(ghost.group.quaternion); if (a1.dot(a2) > COS) n++; } return n; }
function contacts(m) { const hit = []; for (const g of ['Acid', 'Aryl', 'Me']) { worldDir(m, g, a1); if (a1.dot(dataA.dirs[g]) > COS) hit.push(g); } return hit; }
function hAway() { worldDir(A, 'H', a1); a2.copy(camera.position).sub(A.group.position).normalize(); return a1.dot(a2) < -0.9; }
function viewedConfig(m) { const d = {}; for (const g of PRIORITY) d[g] = worldDir(m, g, V(0, 0, 0)); return configuration(d); }

// ---------- labels ----------
const labelBox = $('#labels'), labels = {};
const mk = (id, cls, html) => { const el = document.createElement('div'); el.className = 'lab ' + cls; el.innerHTML = html; labelBox.appendChild(el); labels[id] = el; };
mk('A', 'tag', 'A'); mk('B', 'tag', 'B');
const GN = { Acid: 'COOH', Aryl: 'ring', Me: 'CH<sub>3</sub>', H: 'H' };
for (const g of PRIORITY) mk('g' + g, 'grp', GN[g]);
mk('sAcid', 'site', 'charged site'); mk('sAryl', 'site', 'greasy channel'); mk('sMe', 'site', 'small notch');
function place(id, v, on) { const el = labels[id]; v.project(camera); const ok = on && v.z < 1; el.style.opacity = ok ? 1 : 0; if (ok) el.style.transform = `translate(${((v.x + 1) / 2 * W).toFixed(1)}px,${((1 - v.y) / 2 * H).toFixed(1)}px) translate(-50%,-50%)`; }
function updateLabels() {
  const st = S.step, two = st === 'mirror' || st === 'pocket' || st === 'debrief';
  place('A', tmp.copy(A.group.position).add(tmp2.set(0, 5.2, 0)), st !== 'title'); place('B', tmp.copy(B.group.position).add(tmp2.set(0, 5.2, 0)), two);
  labels.A.textContent = S.score.call !== undefined ? 'A · (S)' : 'A'; labels.B.textContent = S.score.call !== undefined ? 'B · (R)' : 'B';
  const showG = st === 'rank' || st === 'turn' || (st === 'pocket' && S.sub !== 'predict');
  const m = st === 'pocket' && S.active === B ? B : A;
  for (const g of PRIORITY) { const dist = g === 'Aryl' ? 4.4 : g === 'H' ? 1.9 : 3.1; const i = S.rank.indexOf(g); labels['g' + g].innerHTML = (i >= 0 && st !== 'pocket' ? `<b>${i + 1}</b>` : '') + GN[g]; place('g' + g, worldDir(m, g, tmp).multiplyScalar(dist).add(m.group.position), showG && (st !== 'rank' || i >= 0 || S.sub === 'done')); }
  const ps = st === 'pocket';
  place('sAcid', tmp.copy(dataA.dirs.Acid).multiplyScalar(8.6).add(pocket.group.position), ps); place('sMe', tmp.copy(dataA.dirs.Me).multiplyScalar(7.6).add(pocket.group.position), ps); place('sAryl', tmp.copy(dataA.dirs.Aryl).multiplyScalar(9.5).add(pocket.group.position).add(tmp2.set(0, -4.2, 3)), ps);
}

// ---------- panel ----------
const panel = $('#panelBody');
const seg = (name, opts, two) => `<div class="seg ${two ? 'two' : ''}">${opts.map(([v, l]) => `<label><input type="radio" name="${name}" value="${v}" ${S.preds[name] === v ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div>`;
const btn = (act, label, cls = 'pri', dis) => `<button class="btn ${cls}" data-act="${act}" ${dis ? 'disabled' : ''}>${label}</button>`;
function feedback(t, cls) { S.fb = t; S.fbClass = cls || ''; const el = $('#fb'); if (el) { el.innerHTML = t; el.className = 'fb ' + S.fbClass; } }
const fbBox = () => `<p id="fb" class="fb ${S.fbClass}" role="status">${S.fb}</p>`;
const src = (list) => `<p class="src">Source: ${list.map(cite).join(', ')}</p>`;
function render() {
  const st = S.step, sub = S.sub; let h = ''; document.body.dataset.state = st;
  document.querySelectorAll('#steps li').forEach((li, i) => { const cur = ORDER.indexOf(st) - 1; li.className = i === cur ? 'cur' : i < cur ? 'done' : ''; });
  const T = TEXT;
  if (st === 'mirror') {
    h = `<p class="kick">Step 1 of 5</p><h2 tabindex="-1">${T.mirror.title}</h2>`;
    if (sub === 'predict') h += T.mirror.intro + `<fieldset class="q"><legend>${T.mirror.q}</legend>${seg('m', [['yes', 'Yes'], ['no', 'No']], true)}</fieldset><div class="row">${btn('mirrorTry', 'Try it', 'pri', !S.preds.m)}${S.preds.m ? '' : '<span class="hint" id="need">Choose Yes or No first.</span>'}</div>`;
    else if (sub === 'try') h += T.mirror.try + `<div class="row">${btn('mirrorCheck', 'I am done trying')}</div>`;
    else h += `<ul class="verdict"><li class="${S.score.m ? 'ok' : 'no'}"><span class="mark">${S.score.m ? '✓' : '✕'}</span><div><b>They cannot be superimposed.</b><small>${S.score.m ? 'You predicted that.' : 'You predicted they could.'} Your best was ${S.best} of 4 groups.</small></div></li></ul>` + T.mirror.result + src(['5.2']) + `<div class="row">${btn('next', 'Next: find out why')}</div>`;
  } else if (st === 'center') {
    h = `<p class="kick">Step 2 of 5</p><h2 tabindex="-1">${T.center.title}</h2>${T.center.intro}${fbBox()}${src(['5.2'])}<div class="row">${btn('next', 'Next: rank the groups', 'pri', sub !== 'done')}</div>`;
  } else if (st === 'rank') {
    h = `<p class="kick">Step 3 of 5</p><h2 tabindex="-1">${T.rank.title}</h2>${T.rank.intro}${fbBox()}${src(['5.5'])}<div class="row">${btn('next', 'Next: name it', 'pri', sub !== 'done')}</div>`;
  } else if (st === 'turn') {
    h = `<p class="kick">Step 4 of 5</p><h2 tabindex="-1">${T.turn.title}</h2>`;
    if (sub === 'turn') h += T.turn.intro + `<div class="row">${btn('showTurn', 'Show me', 'ghost')}</div>`;
    else if (sub === 'call') h += T.turn.call + `<fieldset class="q"><legend>The path 1 to 2 to 3 runs</legend>${seg('c', [['R', 'Clockwise: R'], ['S', 'Counterclockwise: S']], true)}</fieldset>`;
    else h += `<ul class="verdict"><li class="${S.score.call ? 'ok' : 'no'}"><span class="mark">${S.score.call ? '✓' : '✕'}</span><div><b>Counterclockwise. A is (S)-ibuprofen.</b><small>${S.score.call ? 'Correct.' : 'You chose clockwise.'}</small></div></li></ul>` + T.turn.result + src(['5.5']) + `<div class="row">${btn('next', 'Next: test both in the body')}</div>`;
  } else if (st === 'pocket') {
    h = `<p class="kick">Step 5 of 5</p><h2 tabindex="-1">${T.pocket.title}</h2>`;
    if (sub === 'predict') h += T.pocket.intro + `<fieldset class="q"><legend>${T.pocket.q}</legend>${seg('p', [['both', 'Both seat'], ['one', 'Only one seats'], ['none', 'Neither seats']])}</fieldset><div class="row">${btn('dockA', 'Dock molecule A', 'pri', !S.preds.p)}${S.preds.p ? '' : '<span class="hint" id="need">Choose a prediction first.</span>'}</div>`;
    else if (sub === 'dockA') h += T.pocket.dockA + `<div class="row">${btn('showDock', 'Show me', 'ghost')}</div>`;
    else if (sub === 'seatedA') h += T.pocket.seatedA + `<div class="row">${btn('dockB', 'Now dock molecule B')}</div>`;
    else if (sub === 'dockB') h += T.pocket.dockB + `<div class="row">${btn('giveUp', 'It will not seat', 'pri', S.best < 2 && S.timer < 14)}</div>`;
    else h += `<ul class="verdict"><li class="${S.score.p ? 'ok' : 'no'}"><span class="mark">${S.score.p ? '✓' : '✕'}</span><div><b>Only one seats: A, the (S) form.</b><small>${S.score.p ? 'You predicted that.' : 'You predicted otherwise.'}</small></div></li></ul>` + T.pocket.result + `<p class="beyond">${T.pocket.beyond}</p>` + src(['5.12', '5.13']) + `<div class="row">${btn('next', 'See the debrief')}</div>`;
  } else if (st === 'debrief') {
    const sc = S.score, items = [['m', 'Predicted the mirror test'], ['center', 'Found the chirality center on the first try'], ['rank', 'Ranked the groups without a miss'], ['call', 'Named the configuration'], ['p', 'Predicted the pocket']];
    const n = items.filter(([k]) => sc[k]).length;
    h = `<p class="kick">Debrief</p><h2 tabindex="-1">${n} of 5</h2><ul class="obj">${items.map(([k, t]) => `<li class="${sc[k] ? 'ok' : ''}"><span class="mark">${sc[k] ? '✓' : '○'}</span><div>${t}</div></li>`).join('')}</ul><h3>What you practiced</h3><ul class="try">${T.objectives.map((o) => `<li>${o}</li>`).join('')}</ul><h3>About ibuprofen</h3>${T.debrief}<p class="src">${T.credit}</p><div class="row">${btn('restart', 'Start over')}${btn('about', 'About this demo', 'ghost')}</div>`;
  }
  panel.innerHTML = h; panel.parentElement.scrollTop = 0; const h2 = panel.querySelector('h2'); if (h2 && S.focusNext) h2.focus({ preventScroll: true }); S.focusNext = true;
}
panel.addEventListener('change', (e) => {
  const t = e.target; if (t.type !== 'radio') return; S.preds[t.name] = t.value;
  if (t.name === 'c') { S.score.call = t.value === viewedConfig(A); S.sub = 'done'; tone(S.score.call ? 660 : 180, 0.05); render(); return; }
  const b = panel.querySelector('.btn.pri'); if (b) b.disabled = false; const need = $('#need'); if (need) need.remove();
});
document.addEventListener('click', (e) => { const b = e.target.closest('[data-act]'); if (b) act(b.dataset.act); });

const hint = (t) => { const el = $('#hint'); el.textContent = t || ''; el.classList.toggle('on', !!t); };
function meter(label, n, max) { const el = $('#meter'); if (label == null) return el.classList.remove('on'); el.classList.add('on'); el.innerHTML = `<span>${label}</span>` + (max ? `<span class="pips">${Array.from({ length: max }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span><span>${n} of ${max}</span>` : ''); }

function go(step, sub) {
  S.step = step; S.sub = sub; S.fb = ''; S.fbClass = ''; S.active = null; S.best = 0; S.timer = 0; S.hold = 0; S.moved = false; hint(''); meter(null); ghost.group.visible = false;
  A.setGlow({}); B.setGlow({});
  if (step === 'title') { A.pos.set(-6.5, 0, 0); B.pos.set(6.5, 0, 0); setView('title'); }
  if (step === 'mirror') { A.pos.set(-6.5, 0, 0); B.pos.set(6.5, 0, 0); A.tq = Q0.clone(); B.tq = mirrorQ(Q0); setView('mirror'); S.active = B; hint('Drag to turn molecule B.'); }
  if (step === 'center') { S.sub = 'find'; A.tq = Q0.clone(); A.pos.set(-6.5, 0, 0); B.pos.set(22, 0, -6); setView('solo'); S.active = A; feedback(TEXT.centerStart); hint('Drag to turn the molecule. Tap an atom to choose it.'); }
  if (step === 'rank') { S.sub = 'rank'; S.rank = []; S.rankMiss = false; S.active = A; setView('solo'); feedback(TEXT.rankStart); hint('Tap any atom in a group to choose that group.'); }
  if (step === 'turn') { S.sub = 'turn'; S.active = A; setView('solo'); hint('Drag to turn the molecule.'); }
  if (step === 'pocket') { S.sub = 'predict'; setView('pocket'); A.pos.set(-12, PY + 6, -5); B.pos.set(12, PY + 6, -5); A.tq = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.6, 0.9, 0.2)); B.tq = mirrorQ(A.tq); }
  if (step === 'debrief') { setView('pocket'); A.pos.set(0, PY, 0); A.tq = new THREE.Quaternion(); B.pos.set(12, PY + 6, -5); }
  render();
}
function act(a) {
  if (a === 'begin') { try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } go('mirror', 'predict'); }
  else if (a === 'mirrorTry') { S.sub = 'try'; S.active = B; ghost.group.visible = true; ghost.group.position.copy(B.pos); ghost.group.quaternion.copy(A.group.quaternion); hint('Drag molecule B. The faint outline is molecule A.'); render(); }
  else if (a === 'mirrorCheck') { S.score.m = S.preds.m === 'no'; S.sub = 'done'; S.active = null; ghost.group.visible = false; meter(null); hint(''); B.tq = mirrorQ(Q0); render(); }
  else if (a === 'next') go(ORDER[ORDER.indexOf(S.step) + 1], S.step === 'title' ? 'predict' : undefined);
  else if (a === 'showTurn') { const away = tmp.copy(A.group.position).sub(camera.position).normalize(); worldDir(A, 'H', a1); A.tq = new THREE.Quaternion().setFromUnitVectors(a1, away).multiply(A.group.quaternion); }
  else if (a === 'dockA') { S.sub = 'dockA'; S.active = A; A.pos.set(0, PY + HOVER, 0); S.best = 0; hint('Drag to turn molecule A until all three contacts light.'); render(); }
  else if (a === 'showDock') { A.tq = new THREE.Quaternion(); }
  else if (a === 'dockB') { S.sub = 'dockB'; S.active = B; A.pos.set(-12, PY + 6, -5); A.tq = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.6, 0.9, 0.2)); B.pos.set(0, PY + HOVER, 0); S.best = 0; S.timer = 0; hint('Drag to turn molecule B. Try for three contacts.'); render(); }
  else if (a === 'giveUp') { S.score.p = S.preds.p === 'one'; S.sub = 'done'; S.active = null; meter(null); hint(''); render(); }
  else if (a === 'restart') { S.score = {}; S.preds = {}; S.rank = []; S.centerMiss = false; A.group.quaternion.copy(Q0); B.group.quaternion.copy(mirrorQ(Q0)); go('title'); }
  else if (a === 'about') { $('#modal').hidden = false; $('#modalClose').focus(); }
  else if (a === 'closeAbout') closeAbout();
  else if (a === 'sound') { soundOn = !soundOn; $('#soundBtn').textContent = soundOn ? 'Sound on' : 'Sound off'; $('#soundBtn').setAttribute('aria-pressed', soundOn); }
}
function closeAbout() { $('#modal').hidden = true; }
$('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeAbout(); });
$('#aboutBody').innerHTML = ABOUT;

// ---------- frame ----------
const beam = (p0, p1, r, g, b) => { for (let i = 0; i <= 10; i++) { const u = i / 10; glowX.add(lerp(p0.x, p1.x, u), lerp(p0.y, p1.y, u), lerp(p0.z, p1.z, u), r, g, b, 0.5 + 0.4 * Math.sin(S.T * 8 - i)); } };
const SITE = { Acid: [5.0, 0.5, 0.9, 2.0], Aryl: [7.5, 2.0, 1.3, 0.3], Me: [4.2, 0.5, 2.0, 0.9] };
let last = performance.now(), prevN = 0;
function frame(now) {
  const dt = Math.min(DTCAP, Math.max(0.001, (now - last) / 1000)); last = now; S.T += dt; const t = S.T, st = S.step;
  updateRig(dt);
  if (st === 'title' && !reduce) { const q = new THREE.Quaternion().setFromAxisAngle(tmp.set(0.25, 1, 0.1).normalize(), dt * 0.35); A.group.quaternion.premultiply(q); B.group.quaternion.copy(mirrorQ(A.group.quaternion)); }
  for (const m of [A, B]) {
    const k = reduce ? 1 : 1 - Math.exp(-3.2 * dt); tmp.copy(m.pos); if (!reduce) tmp.y += Math.sin(t * 0.8 + (m === A ? 0 : 2)) * 0.12; m.group.position.lerp(tmp, k);
    if (m.tq) { m.group.quaternion.slerp(m.tq, reduce ? 1 : 1 - Math.exp(-5 * dt)); if (m.group.quaternion.angleTo(m.tq) < 0.01) { m.group.quaternion.copy(m.tq); m.tq = null; } }
  }
  mirrorMat.uniforms.uT.value = t; mirrorMat.uniforms.uA.value = lerp(mirrorMat.uniforms.uA.value, st === 'title' || st === 'mirror' ? 1 : 0, 1 - Math.exp(-3 * dt));

  glow.begin(); glowX.begin();
  for (let i = 0; i < dust.length; i += 5) { const ph = dust[i + 3], b = 0.14 + 0.1 * Math.sin(t * 0.6 + ph * 3); glow.add(dust[i] + Math.sin(t * 0.1 + ph) * 2, dust[i + 1] + Math.cos(t * 0.08 + ph) * 2, dust[i + 2], 0.7 * b, 0.55 * b, 1.2 * b, 0.4 + dust[i + 4] * 0.7); }

  if (st === 'mirror' && S.sub === 'try') { ghost.group.position.copy(B.group.position); const n = overlap(); S.best = Math.max(S.best, n); if (n > prevN) tone(440 + n * 110, 0.04); prevN = n; meter('Groups lined up', n, 4); }
  if (st === 'center') A.setGlow(S.sub === 'done' ? { center: [GLOW.center, 1.6] } : {});
  if (st === 'rank') { const map = {}; S.rank.forEach((g) => { map[g] = [GLOW[g], 0.9]; }); map.center = [GLOW.center, 0.8]; A.setGlow(map); }
  if (st === 'turn') {
    const map = { center: [GLOW.center, 0.5], H: [0xffffff, 0.5 + 0.4 * Math.sin(t * 5)] }; A.setGlow(map);
    if (S.sub === 'turn') { const ok = hAway(); meter(ok ? 'Hydrogen is pointing away' : 'Turn the hydrogen to the back'); S.hold = ok && !A.tq ? S.hold + dt : 0; if (S.hold > 0.5) { S.sub = 'call'; S.active = null; meter(null); hint(''); tone(660, 0.05); render(); } }
    if (S.sub !== 'turn') { // animated path 1 -> 2 -> 3 around the center
      const P = ['Acid', 'Aryl', 'Me'].map((g) => worldDir(A, g, V(0, 0, 0)));
      for (let i = 0; i < 48; i++) { const u = (i / 48) * 3, k = Math.floor(u) % 3, f = u - Math.floor(u); tmp.copy(P[k]).lerp(P[(k + 1) % 3], f).normalize().multiplyScalar(2.6).add(A.group.position);
        const head = ((t * 0.9 - u) % 3 + 3) % 3, b = 0.25 + 1.6 * Math.max(0, 1 - head / 0.8) * (head < 0.8 ? 1 : 0) + (k === 2 ? -0.12 : 0); glowX.add(tmp.x, tmp.y, tmp.z, 1.6 * b, 1.3 * b, 0.4 * b, 0.42); }
    }
  }
  if (st === 'pocket' || st === 'debrief') {
    for (const g of ['Acid', 'Me']) pocket.sites[g].material.emissiveIntensity = 0.4 + 0.2 * Math.sin(t * 3);
    const m = S.sub === 'dockA' ? A : S.sub === 'dockB' ? B : null;
    if (m) {
      const hit = contacts(m), n = hit.length; S.best = Math.max(S.best, n); if (n > prevN) tone(440 + n * 110, 0.04); prevN = n; meter('Contacts', n, 3);
      const map = {}; for (const g of hit) { map[g] = [GLOW[g], 1.0]; const s = SITE[g]; beam(worldDir(m, g, tmp).multiplyScalar(g === 'Aryl' ? 4 : 2.6).add(m.group.position), tmp2.copy(dataA.dirs[g]).multiplyScalar(s[0]).add(pocket.group.position), s[1], s[2], s[3]); } m.setGlow(map);
      if (m === A && n === 3 && !A.tq) { S.hold += dt; if (S.hold > 0.35) { A.tq = new THREE.Quaternion(); A.pos.set(0, PY, 0); S.sub = 'seatedA'; S.active = null; meter('Seated', 3, 3); hint(''); chord(); render(); } } else S.hold = 0;
      if (m === B) { const was = S.timer < 14 && S.best < 2; if (S.moved) S.timer += dt; if (was && (S.timer >= 14 || S.best >= 2)) { const b = panel.querySelector('[data-act=giveUp]'); if (b) b.disabled = false; } }
    }
    if (S.sub === 'seatedA' || st === 'debrief') A.setGlow({ Acid: [GLOW.Acid, 0.8], Aryl: [GLOW.Aryl, 0.6], Me: [GLOW.Me, 0.8] });
  }
  glow.end(); glowX.end();
  updateLabels();
  composer.render();
  requestAnimationFrame(frame);
}

window.__demo = {
  state: () => ({ step: S.step, sub: S.sub, active: S.active && S.active.name, camOrbit: [rig.uy, rig.up], qB: B.group.quaternion.toArray().map((v) => +v.toFixed(3)), score: S.score, best: S.best, configA: dataA.config, configB: dataB.config, viewedA: viewedConfig(A), atoms: dataA.atoms.length, overlap: S.step === 'mirror' ? overlap() : null, contactsA: contacts(A).length, contactsB: contacts(B).length }),
  go: (s, sub) => { go(s, sub); setView(Object.keys(VIEWS).find((k) => VIEWS[k] === rig.view), true); for (const m of [A, B]) { m.group.position.copy(m.pos); if (m.tq) { m.group.quaternion.copy(m.tq); m.tq = null; } } },
  act, rotate: (dx, dy) => rotateActive(dx, dy),
  pickKind: (kind, group) => { const i = dataA.atoms.findIndex((a) => a.kind === kind && (!group || a.group === group)); const p = dataA.atoms[i].p.clone().applyQuaternion(A.group.quaternion).add(A.group.position).project(camera); pick((p.x + 1) / 2 * W, (1 - p.y) / 2 * H); },
  predict: (k, v) => { S.preds[k] = v; },
  // best achievable alignment counts by brute-force search over rotations
  search: () => { const r = mulberry(3), out = { mirror: 0, dockA: 0, dockB: 0 }, q = new THREE.Quaternion(); for (let i = 0; i < 60000; i++) { q.set(r() - 0.5, r() - 0.5, r() - 0.5, r() - 0.5).normalize(); let nA = 0, nB = 0, nM = 0; for (const g of PRIORITY) { a1.copy(dataB.dirs[g]).applyQuaternion(q); if (a1.dot(dataA.dirs[g]) > COS) { nM++; if (g !== 'H') nB++; } a1.copy(dataA.dirs[g]).applyQuaternion(q); if (g !== 'H' && a1.dot(dataA.dirs[g]) > COS) nA++; } out.mirror = Math.max(out.mirror, nM); out.dockA = Math.max(out.dockA, nA); out.dockB = Math.max(out.dockB, nB); } return out; },
};

setView('title', true); render();
requestAnimationFrame(frame);
