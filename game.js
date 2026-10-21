(() => {
  console.log('✅ game.js CARREGADO — versão:', 'v6-frutas-3d');   // ⬅️ linha de teste
/* ================= CONFIG ================= */
const GRAV = 3.2;            // gravidade das frutas (baixa = mais flutuante)
const START_LIVES = 3;
const CUT_SPEED = 1.2;       // velocidade mínima da ponta do sabre (m/s) para cortar fruta
const BLADE_LEN = 0.9;

/* ================= CENA ================= */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07031a);
scene.fog = new THREE.Fog(0x07031a, 6, 24);
const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 60);
camera.position.set(0, 1.6, 0);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.xr.enabled = true;
renderer.localClippingEnabled = true;   // necessário para cortar as frutas ao meio (fruits.js)
document.body.appendChild(renderer.domElement);
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

scene.add(new THREE.HemisphereLight(0xffffff, 0x3a2266, 0.9));
const sun = new THREE.DirectionalLight(0xffffff, 0.8); sun.position.set(2, 5, 3); scene.add(sun);

/* ---- Cenário: arena neon (dojo futurista) ---- */
const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshBasicMaterial({ color: 0x0b0524 }));
floor.rotation.x = -Math.PI / 2; scene.add(floor);
const grid = new THREE.GridHelper(30, 30, 0xff2d95, 0x3a1a7a); grid.position.y = 0.01; scene.add(grid);
for (let i = 0; i < 9; i++) {
  [-3.5, 3.5].forEach((x, k) => {
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.08, 3.2, 0.08),
      new THREE.MeshBasicMaterial({ color: (i + k) % 2 ? 0x00e5ff : 0xff2d95 }));
    col.position.set(x, 1.6, -i * 2.2); scene.add(col);
  });
}
// portal de onde as frutas são lançadas
const gate = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.06, 8, 48), new THREE.MeshBasicMaterial({ color: 0x00e5ff }));
gate.position.set(0, 1.6, -10); scene.add(gate);
// estrelas
{
  const n = 400, p = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { p[i*3] = (Math.random()-.5)*40; p[i*3+1] = Math.random()*14+1; p[i*3+2] = -Math.random()*30-2; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, fog: false })));
}

/* ================= HUD (painel 3D) ================= */
const hc = document.createElement('canvas'); hc.width = 768; hc.height = 384;
const hx = hc.getContext('2d');
const htex = new THREE.CanvasTexture(hc);
const hud = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.9), new THREE.MeshBasicMaterial({ map: htex, transparent: true, fog: false }));
hud.position.set(0, 2.3, -3.2); hud.rotation.x = 0.15; scene.add(hud);

let best = 0;
try { best = +localStorage.getItem('fsv_best') || 0; } catch (e) {}

function drawHud() {
  hx.clearRect(0, 0, 768, 384);
  hx.fillStyle = 'rgba(10,5,30,.7)'; hx.fillRect(0, 0, 768, 384);
  hx.strokeStyle = '#00e5ff'; hx.lineWidth = 6; hx.strokeRect(3, 3, 762, 378);
  hx.textAlign = 'center'; hx.fillStyle = '#fff';
  if (state === 'play') {
    hx.font = 'bold 96px sans-serif'; hx.fillText('PONTOS ' + score, 384, 130);
    hx.fillStyle = '#ff4d6d'; hx.font = '84px sans-serif';
    hx.fillText('♥'.repeat(lives) + '♡'.repeat(Math.max(0, START_LIVES - lives)), 384, 240);
    hx.fillStyle = '#ffd54f'; hx.font = 'bold 52px sans-serif';
    hx.fillText(combo > 1 ? 'COMBO x' + combo : '', 384, 320);
  } else if (state === 'menu') {
    hx.font = 'bold 72px sans-serif'; hx.fillText('FRUIT SABER VR', 384, 120);
    hx.font = '42px sans-serif'; hx.fillStyle = '#00e5ff';
    hx.fillText('Corte a MELANCIA para começar', 384, 205);
    hx.fillStyle = '#ff4d6d'; hx.fillText('Nunca toque nas BOMBAS pretas!', 384, 275);
    hx.fillStyle = '#fff'; hx.font = '34px sans-serif'; hx.fillText('Recorde: ' + best, 384, 340);
  } else {
    hx.font = 'bold 80px sans-serif'; hx.fillStyle = '#ff4d6d'; hx.fillText('FIM DE JOGO', 384, 120);
    hx.fillStyle = '#fff'; hx.font = 'bold 56px sans-serif'; hx.fillText('Pontos: ' + score + '   Recorde: ' + best, 384, 215);
    hx.fillStyle = '#00e5ff'; hx.font = '40px sans-serif'; hx.fillText('Corte a MELANCIA para jogar de novo', 384, 300);
  }
  htex.needsUpdate = true;
}

/* ================= ÁUDIO ================= */
let AC;
function snd(f, d, type = 'sine', v = 0.15, slide = 0) {
  if (!AC) return;
  const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
  o.connect(g); g.connect(AC.destination); o.start(); o.stop(t + d);
}

/* ================= TIPOS DE FRUTA / BOMBA ================= */
// As frutas agora vêm de fruits.js (Fruits.list / Fruits.random / Fruits.byName)
const BOMB = { r: .13 };
BOMB.geo = new THREE.SphereGeometry(BOMB.r, 20, 14);
BOMB.mat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: .3, emissive: 0x550000, emissiveIntensity: .8 });
BOMB.ringGeo = new THREE.TorusGeometry(BOMB.r * 1.15, .012, 8, 24);
BOMB.ringMat = new THREE.MeshBasicMaterial({ color: 0xff1744 });

/* ================= ESTADO ================= */
let state = 'menu', score = 0, lives = START_LIVES, combo = 0, elapsed = 0,
    waveTimer = 1, flash = 0, pendingStart = false, pendingGameOver = false, clock = 0;
const items = [], debris = [], parts = [];   // ← ESSA LINHA ESTAVA FALTANDO

/* ================= SABRES (controles do óculos) ================= */
const sabers = [];
for (let i = 0; i < 2; i++) {
  const c = renderer.xr.getController(i);
  const color = i === 0 ? 0x00e5ff : 0xff2d95;
  const group = new THREE.Group();
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, .16, 12), new THREE.MeshStandardMaterial({ color: 0x888888, metalness: .8, roughness: .3 }));
  handle.rotation.x = -Math.PI / 2; handle.position.z = -0.02;
  const blade = new THREE.Mesh(new THREE.CylinderGeometry(.011, .011, BLADE_LEN, 10), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  blade.rotation.x = -Math.PI / 2; blade.position.z = -0.1 - BLADE_LEN / 2;
  const glow = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, BLADE_LEN, 10), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .35 }));
  glow.rotation.x = -Math.PI / 2; glow.position.z = blade.position.z;
  group.add(handle, blade, glow);
  group.visible = false;
  c.add(group); scene.add(c);
  const s = { c, group, glow, base: new THREE.Vector3(), tip: new THREE.Vector3(), prev: null, speed: 0, vel: new THREE.Vector3(), gp: null, active: false };
  c.addEventListener('connected', e => {
    s.gp = e.data.gamepad || null; s.active = true; group.visible = true;
    if (e.data.handedness === 'left') glow.material.color.set(0x00e5ff);
    if (e.data.handedness === 'right') glow.material.color.set(0xff2d95);
  });
  c.addEventListener('disconnected', () => { s.active = false; group.visible = false; s.prev = null; });
  sabers.push(s);
}
function haptic(s, intensity, ms) {
  try {
    const a = s.gp && (s.gp.hapticActuators && s.gp.hapticActuators[0]);
    if (a && a.pulse) a.pulse(intensity, ms);
    else if (s.gp && s.gp.vibrationActuator) s.gp.vibrationActuator.playEffect('dual-rumble', { duration: ms, strongMagnitude: intensity, weakMagnitude: intensity });
  } catch (e) {}
}

/* ================= OBJETOS ================= */
function makeItem(def, pos, vel, opts = {}) {
  let mesh, bomb = def === null;
  if (bomb) {
    mesh = new THREE.Mesh(BOMB.geo, BOMB.mat);
    const ring = new THREE.Mesh(BOMB.ringGeo, BOMB.ringMat); mesh.add(ring); mesh.userData.ring = ring;
  } else mesh = Fruits.create(def);
  mesh.position.copy(pos); scene.add(mesh);
  items.push({
    mesh, def, bomb, r: bomb ? BOMB.r : def.r, vel, dead: false, start: !!opts.start, still: !!opts.still,
    spin: new THREE.Vector3((Math.random()-.5)*6, (Math.random()-.5)*6, (Math.random()-.5)*6),
  });
}
function spawnFruit(bomb) {
  const T = Math.max(1.5, 2.5 - elapsed * 0.01);           // tempo de voo até o jogador
  const p0 = new THREE.Vector3((Math.random() - .5) * 3, 0.3, -10);
  const xt = (Math.random() - .5) * 1.5, yt = 1.0 + Math.random() * 0.7, zt = -0.5;
  const v = new THREE.Vector3((xt - p0.x) / T, (yt - p0.y + 0.5 * GRAV * T * T) / T, (zt - p0.z) / T);
  makeItem(bomb ? null : Fruits.random(), p0, v);
}
function spawnWave() {
  const n = 1 + Math.floor(Math.random() * Math.min(4, 1 + elapsed / 25 + 1));
  const bombChance = Math.min(0.12 + elapsed * 0.003, 0.32);
  let bombs = 0;
  for (let i = 0; i < n; i++) {
    const b = Math.random() < bombChance && bombs < 2 && n > 1; // bomba sempre no meio de frutas
    if (b) bombs++;
    setTimeout(() => { if (state === 'play') spawnFruit(b); }, i * 220);
  }
}
function spawnStartFruit() {
  makeItem(Fruits.byName('melancia'), new THREE.Vector3(0, 1.4, -1.6), new THREE.Vector3(), { start: true, still: true });
}
function clearItems() { items.forEach(i => scene.remove(i.mesh)); items.length = 0; }

function burst(pos, color, n, speed) {
  const key = 'p' + color;
  burst.m = burst.m || {}; burst.g = burst.g || new THREE.SphereGeometry(.018, 6, 6);
  const mat = burst.m[key] || (burst.m[key] = new THREE.MeshBasicMaterial({ color }));
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(burst.g, mat); m.position.copy(pos); scene.add(m);
    parts.push({ m, life: .6, vel: new THREE.Vector3((Math.random()-.5)*speed, Math.random()*speed*.8, (Math.random()-.5)*speed) });
  }
}

/* ================= AÇÕES ================= */
function slice(it, s) {
  const def = it.def, pos = it.mesh.position.clone();
  const dir = s.vel.clone(); if (dir.lengthSq() < 1e-4) dir.set(1, 0, 0); dir.normalize();
  const axis = s.tip.clone().sub(s.base).normalize();
  let n = new THREE.Vector3().crossVectors(dir, axis);
  if (n.lengthSq() < 1e-4) n.set(0, 1, 0);
  n.normalize();
  Fruits.halves(it.mesh, n).forEach((g, k) => {
    const sg = k ? -1 : 1;
    scene.add(g);
    debris.push({ g, life: 1.6, vel: it.vel.clone().multiplyScalar(.5).addScaledVector(n, sg * 1.1).add(new THREE.Vector3(0, .6, 0)),
      spin: new THREE.Vector3((Math.random()-.5)*5, (Math.random()-.5)*5, (Math.random()-.5)*5) });
  });
  burst(pos, def.juice, 12, 2);
  haptic(s, .6, 60);
  it.dead = true;
  if (it.start) { pendingStart = true; snd(520, .25, 'triangle', .2, 600); return; }
  combo++; score += 10 * (1 + Math.floor(combo / 5));
  snd(500 + Math.min(combo, 12) * 40, .15, 'triangle', .18, 400);
  drawHud();
}
function hitBomb(it, s) {
  it.dead = true; combo = 0; lives--; flash = 1;
  burst(it.mesh.position, 0xff9100, 24, 4);
  haptic(sabers[0], 1, 300); haptic(sabers[1], 1, 300);
  snd(140, .5, 'sawtooth', .3, -90);
  if (lives <= 0) pendingGameOver = true;       // ✅ sinaliza
  else drawHud();
}
function startGame() {
  clearItems(); score = 0; lives = START_LIVES; combo = 0; elapsed = 0; waveTimer = 1; state = 'play'; drawHud();
}
function gameOver() {
  state = 'over';
  if (score > best) { best = score; try { localStorage.setItem('fsv_best', best); } catch (e) {} }
  clearItems(); spawnStartFruit(); drawHud();
}

/* ================= LOOP ================= */
const A = new THREE.Vector3(), B = new THREE.Vector3(), AB = new THREE.Vector3(), P = new THREE.Vector3();
function segDist(p, a, b) {
  AB.subVectors(b, a); const t = Math.max(0, Math.min(1, P.subVectors(p, a).dot(AB) / AB.lengthSq()));
  return P.copy(a).addScaledVector(AB, t).distanceTo(p);
}
function update(dt) {
  clock += dt;
  if (state === 'play') {
    elapsed += dt; waveTimer -= dt;
    if (waveTimer <= 0) { spawnWave(); waveTimer = Math.max(0.9, 2.2 - elapsed * 0.014); }
  }

  // sabres
  sabers.forEach(s => {
    if (!s.active) return;
    s.c.updateMatrixWorld(true);
    s.base.set(0, 0, -0.1).applyMatrix4(s.c.matrixWorld);
    s.tip.set(0, 0, -(0.1 + BLADE_LEN)).applyMatrix4(s.c.matrixWorld);
    if (s.prev && dt > 0) { s.vel.subVectors(s.tip, s.prev).divideScalar(dt); s.speed = s.vel.length(); }
    s.prev = (s.prev || new THREE.Vector3()).copy(s.tip);
  });

  // frutas e bombas
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i]; if (!it || !it.mesh) continue;      // guarda defensiva
    const m = it.mesh;
    if (!it.still) { it.vel.y -= GRAV * dt; m.position.addScaledVector(it.vel, dt); }
    m.rotation.x += it.spin.x * dt; m.rotation.y += it.spin.y * dt; m.rotation.z += it.spin.z * dt;
    if (it.bomb) m.userData.ring.scale.setScalar(1 + Math.sin(clock * 10) * .12);
    if (it.start) m.position.y = 1.4 + Math.sin(clock * 2) * .04;

    if (!it.dead) {
      for (const s of sabers) {
        if (!s.active) continue;
        if (segDist(m.position, s.base, s.tip) < it.r + 0.04) {
          if (it.bomb) { hitBomb(it, s); break; }
          const velocidadeMinima = it.start ? 0.15 : CUT_SPEED;
          if (s.speed > velocidadeMinima) { slice(it, s); break; }
        }
      }
    }

    if (!it.dead && (m.position.z > 1.2 || m.position.y < -1)) {
      if (!it.bomb && state === 'play' && combo) { combo = 0; drawHud(); }
      it.dead = true;
    }

    if (it.dead) {
      scene.remove(m);
      const idx = items.indexOf(it);
      if (idx >= 0) items.splice(idx, 1);      // ✅ remove o certo, sempre
    }
  }

  if (pendingGameOver) { pendingGameOver = false; gameOver(); }   // ✅ fora do loop
  if (pendingStart)    { pendingStart = false;    startGame(); }

  // metades cortadas
  for (let i = debris.length - 1; i >= 0; i--) {
    const d = debris[i]; d.life -= dt; d.vel.y -= GRAV * dt;
    d.g.position.addScaledVector(d.vel, dt);
    d.g.rotation.x += d.spin.x * dt; d.g.rotation.z += d.spin.z * dt;
    d.g.userData.update();   // mantém o plano de corte acompanhando a metade
    if (d.life < .4) d.g.scale.setScalar(Math.max(d.life / .4, .01));
    if (d.life <= 0) { scene.remove(d.g); debris.splice(i, 1); }
  }

  // partículas
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]; p.life -= dt; p.vel.y -= GRAV * dt;
    p.m.position.addScaledVector(p.vel, dt);
    p.m.scale.setScalar(Math.max(p.life / .6, .01));
    if (p.life <= 0) { scene.remove(p.m); parts.splice(i, 1); }
  }

  if (flash > 0) { flash = Math.max(0, flash - dt * 2.5); scene.background.setRGB(.03 + flash * .7, .012, .1); }
}
let last = 0;
renderer.setAnimationLoop(t => {
  const dt = Math.min((t - last) / 1000 || 0.016, 0.05); last = t;
  update(dt); renderer.render(scene, camera);
});

/* ================= ENTRAR EM VR + MODO DESKTOP ================= */
const btn     = document.getElementById('enter');
const msg     = document.getElementById('msg');
const ui      = document.getElementById('ui');
const btnTest = document.getElementById('testDesktop');

/* ---- Função que liga o modo mouse (desktop) ---- */
function enableDesktopMode() {
  // Cria o sabre visível como filho da câmera
  const bladeGeo = new THREE.CylinderGeometry(.015, .015, BLADE_LEN, 10);
  const glowGeo  = new THREE.CylinderGeometry(.035, .035, BLADE_LEN, 10);
  const blade = new THREE.Mesh(bladeGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
  const glow  = new THREE.Mesh(glowGeo,  new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: .35 }));
  blade.rotation.x = glow.rotation.x = Math.PI / 2;
  const zCenter = -0.1 - BLADE_LEN / 2;
  blade.position.set(0, 0, zCenter);
  glow.position.set(0, 0, zCenter);
  camera.add(blade, glow);
  scene.add(camera);   // a câmera precisa estar na cena pra renderizar seus filhos

  // Reaproveita o sabres[0] apontando para a câmera
  const s = sabers[0];
  s.c    = camera;
  s.glow = glow;
  s.gp   = null;    // sem haptic
  s.active = true;

  // Controles do mouse: gira a câmera
  addEventListener('mousemove', (e) => {
    if (ui.style.display !== 'none') return;
    const nx = (e.clientX / innerWidth)  * 2 - 1;
    const ny = -(e.clientY / innerHeight) * 2 + 1;
    camera.rotation.y = -nx * Math.PI * 0.45;
    camera.rotation.x =  ny * Math.PI * 0.25;
  });

  // Clique = "cutucada" pra cortar a melancia
  addEventListener('click', () => {
    if (ui.style.display !== 'none') return;
    camera.rotation.y += 0.4;
    setTimeout(() => { camera.rotation.y -= 0.4; }, 60);
  });

  ui.style.display = 'none';
  msg.textContent  = 'Corte as frutas com o mouse!';
  console.log('[DESKTOP] Modo teste ativo. Mova o mouse e clique para cortar a melancia.');
}

/* ---- Inicialização do botão VR ---- */
(async () => {
  if (!navigator.xr) {
    msg.textContent = 'WebXR indisponível (precisa HTTPS). Teste no desktop:';
    if (btnTest) { btnTest.style.display = 'inline-block'; btnTest.onclick = enableDesktopMode; }
    return;
  }
  const ok = await navigator.xr.isSessionSupported('immersive-vr').catch(() => false);
  if (!ok) {
    msg.textContent = 'Este dispositivo não suporta VR imersivo. Teste no desktop:';
    if (btnTest) { btnTest.style.display = 'inline-block'; btnTest.onclick = enableDesktopMode; }
    return;
  }
  msg.textContent = 'Corte as frutas com os sabres e fuja das bombas!';
  btn.disabled = false;
  if (btnTest) btnTest.style.display = 'inline-block';
})();

/* ---- Entrar em VR ---- */
btn.onclick = async () => {
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const session = await navigator.xr.requestSession('immersive-vr', {
      optionalFeatures: ['local-floor', 'bounded-floor']
    });
    renderer.xr.setReferenceSpaceType('local-floor');
    await renderer.xr.setSession(session);
    ui.style.display = 'none';
    session.addEventListener('end', () => { ui.style.display = 'flex'; });
  } catch (e) {
    msg.textContent = 'Erro ao iniciar VR: ' + e.message;
  }
};

/* ---- Botão de teste desktop ---- */
if (btnTest) {
  btnTest.style.display = 'inline-block';
  btnTest.onclick = enableDesktopMode;
}

/* ================= INÍCIO ================= */
spawnStartFruit(); drawHud();
})();
