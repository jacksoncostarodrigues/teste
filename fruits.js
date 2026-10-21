/* fruits.js — frutas 3D procedurais para o Fruit Saber VR
   Carregar DEPOIS do three.js e ANTES do game.js.
   API: Fruits.list | Fruits.random() | Fruits.byName('melancia') | Fruits.create(def) | Fruits.halves(grupo, normalMundo) */
(function () {
  const V2 = (x, y) => new THREE.Vector2(x, y), V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const mat = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .5, emissive: c, emissiveIntensity: .12 }, o));
  const tex = (w, h, draw, rx = 1, ry = 1) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t;
  };
  // corpo de revolução; "flesh" = cor do interior (aparece quando a fruta é cortada)
  const body = (pts, m, flesh) => { const me = new THREE.Mesh(new THREE.LatheGeometry(pts, 24), m); me.userData.flesh = flesh; return me; };
  // perfil: n pontos, raio R, meia-altura H, covinha em cima (top) e embaixo (bot), widen() muda a largura ao longo da altura
  const prof = (n, R, H, top = 0, bot = 0, widen = () => 1) => {
    const p = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n * Math.PI;
      p.push(V2(Math.sin(t) * R * widen(t), -Math.cos(t) * H + bot * Math.exp(-((t / .4) ** 2)) - top * Math.exp(-(((Math.PI - t) / .4) ** 2))));
    }
    return p;
  };
  const stem = (h = .05, c = 0x5d4037, tilt = .2) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(.006, .008, h, 6), mat(c)); m.rotation.z = tilt; return m; };
  const leaf = (c = 0x43a047, s = 1) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.03 * s, 8, 6), mat(c)); m.scale.set(1, .15, .5); return m; };
  const put = (o, x, y, z) => { o.position.set(x, y, z); return o; };

  const D = [];
  const add = (name, r, juice, build) => D.push({ name, r, juice, build });

  add('maçã', .12, 0xfff3c4, () => {
    const g = new THREE.Group();
    g.add(body(prof(18, .11, .095, .035, .015, t => 1 + .1 * Math.max(0, (t - 1.57) / 1.57)), mat(0xd32f2f), 0xfff3c4));
    g.add(put(stem(.06), 0, .085, 0)); const l = put(leaf(), .03, .1, 0); l.rotation.z = .4; g.add(l); return g;
  });

  add('laranja', .125, 0xffb74d, () => {
    const g = new THREE.Group();
    g.add(body(prof(18, .12, .11, .01, .01), mat(0xfb8c00, { roughness: .8 }), 0xffb74d));
    g.add(put(leaf(0x558b2f, .5), 0, .1, 0)); return g;
  });

  add('limão', .11, 0xfff9c4, () => {
    const g = new THREE.Group(), m = mat(0xfdd835);
    g.add(body(prof(18, .075, .1), m, 0xfff9c4));
    const top = put(new THREE.Mesh(new THREE.ConeGeometry(.02, .035, 8), m), 0, .115, 0);
    const bot = put(new THREE.Mesh(new THREE.ConeGeometry(.02, .035, 8), m), 0, -.115, 0); bot.rotation.x = Math.PI;
    g.add(top, bot); g.rotation.z = 1.2; return g;
  });

  add('kiwi', .1, 0x9ccc65, () => {
    const g = new THREE.Group(); g.add(body(prof(16, .085, .065), mat(0x8d6e63, { roughness: .95 }), 0x9ccc65)); return g;
  });

  add('banana', .14, 0xfff3c4, () => {
    const g = new THREE.Group();
    const c = new THREE.CatmullRomCurve3([V3(-.13, .03, 0), V3(-.07, -.03, 0), V3(0, -.05, 0), V3(.07, -.03, 0), V3(.13, .03, 0)]);
    const m = new THREE.Mesh(new THREE.TubeGeometry(c, 16, .03, 10, false), mat(0xffe135)); m.userData.flesh = 0xfff3c4; g.add(m);
    [-1, 1].forEach(s => g.add(put(new THREE.Mesh(new THREE.SphereGeometry(.018, 8, 8), mat(0x4e342e)), s * .135, .035, 0)));
    return g;
  });

  add('morango', .1, 0xff8a80, () => {
    const g = new THREE.Group();
    const t = tex(128, 128, (x, w, h) => {
      x.fillStyle = '#e53935'; x.fillRect(0, 0, w, h); x.fillStyle = '#ffe082';
      for (let i = 0; i < 70; i++) { x.beginPath(); x.ellipse(Math.random() * w, Math.random() * h, 2, 3, 0, 0, 7); x.fill(); }
    });
    const pts = [V2(0, -.085), V2(.025, -.075), V2(.055, -.045), V2(.078, 0), V2(.085, .035), V2(.08, .06), V2(.05, .075), V2(.015, .075), V2(0, .07)];
    g.add(body(pts, mat(0xffffff, { map: t, emissive: 0xe53935, emissiveIntensity: .15 }), 0xff8a80));
    for (let k = 0; k < 6; k++) {
      const a = k / 6 * Math.PI * 2, l = leaf(0x43a047, .8);
      l.position.set(Math.cos(a) * .03, .075, Math.sin(a) * .03); l.rotation.y = -a; l.rotation.z = .3; g.add(l);
    }
    g.add(put(stem(.04, 0x558b2f, 0), 0, .095, 0)); return g;
  });

  add('melancia', .2, 0xff5252, () => {
    const g = new THREE.Group();
    const t = tex(256, 64, (x, w, h) => {
      x.fillStyle = '#43a047'; x.fillRect(0, 0, w, h); x.fillStyle = '#1b5e20';
      for (let s = 0; s < w; s += 32) for (let y = 0; y < h; y++) x.fillRect(s + Math.sin(y * .25) * 4, y, 12, 1);
    });
    g.add(body(prof(20, .15, .2), mat(0xffffff, { map: t, emissive: 0x2e7d32, emissiveIntensity: .2 }), 0xff5252)); return g;
  });

  add('abacaxi', .15, 0xfff176, () => {
    const g = new THREE.Group();
    const t = tex(128, 128, (x, w, h) => {
      x.fillStyle = '#f9a825'; x.fillRect(0, 0, w, h); x.strokeStyle = '#8d6e00'; x.lineWidth = 3;
      for (let i = -h; i < w; i += 16) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + h, h); x.moveTo(i + h, 0); x.lineTo(i, h); x.stroke(); }
    }, 2, 2);
    g.add(body(prof(18, .085, .115, .01, .01), mat(0xffffff, { map: t, emissive: 0xf9a825, emissiveIntensity: .12 }), 0xfff176));
    for (let k = 0; k < 9; k++) {
      const lg = new THREE.Group(), c = new THREE.Mesh(new THREE.ConeGeometry(.015, .13, 6), mat(0x2e7d32));
      c.position.set(.025, .19, 0); c.rotation.z = -.35; lg.add(c); lg.rotation.y = k / 9 * Math.PI * 2; g.add(lg);
    }
    return g;
  });

  add('pera', .13, 0xf9fbe7, () => {
    const g = new THREE.Group();
    const pts = [V2(0, -.11), V2(.05, -.105), V2(.09, -.08), V2(.105, -.04), V2(.095, 0), V2(.07, .03), V2(.05, .06), V2(.04, .09), V2(.025, .115), V2(0, .12)];
    g.add(body(pts, mat(0xaed581), 0xf9fbe7));
    g.add(put(stem(.05, 0x5d4037, .3), .005, .135, 0)); g.add(put(leaf(0x558b2f, .8), .035, .13, 0)); return g;
  });

  add('uva', .13, 0xc5e1a5, () => {
    const g = new THREE.Group(), geo = new THREE.SphereGeometry(.03, 10, 8), m = mat(0x7b1fa2);
    [[.06, 4, .045], [.02, 4, .04], [-.02, 3, .03], [-.06, 2, .018], [-.09, 1, 0]].forEach(([y, n, rr]) => {
      for (let i = 0; i < n; i++) {
        const a = i / n * Math.PI * 2 + y * 20, b = new THREE.Mesh(geo, m); b.userData.flesh = 0xc5e1a5;
        g.add(put(b, Math.cos(a) * rr, y, Math.sin(a) * rr));
      }
    });
    g.add(put(stem(.07, 0x558b2f, .15), 0, .105, 0)); return g;
  });

  add('cereja', .11, 0xe57373, () => {
    const g = new THREE.Group(), geo = new THREE.SphereGeometry(.045, 14, 10), m = mat(0xb71c1c, { roughness: .25 });
    [[-.04, -.04, 0], [.045, -.045, .01]].forEach(p => {
      const b = new THREE.Mesh(geo, m); b.userData.flesh = 0xe57373; g.add(put(b, ...p));
      const c = new THREE.CatmullRomCurve3([V3(p[0], p[1] + .04, p[2]), V3(p[0] * .6, .03, 0), V3(0, .1, 0)]);
      g.add(new THREE.Mesh(new THREE.TubeGeometry(c, 8, .004, 5), mat(0x558b2f)));
    });
    return g;
  });

  window.Fruits = {
    list: D,
    byName: n => D.find(d => d.name === n),
    random() { return D[Math.floor(Math.random() * D.length)]; },
    create(def) { const g = def.build(); g.userData.r = def.r; return g; },

    /* Corta o modelo em 2 metades usando um plano de corte (clipping).
       O interior aparece pintando as faces de trás com a cor da polpa. */
    halves(src, n) {
      src.updateMatrixWorld(true);
      const nl = n.clone().applyQuaternion(src.quaternion.clone().invert()).normalize(); // normal no espaço local
      return [1, -1].map(sg => {
        const g = src.clone(true), local = new THREE.Plane(nl.clone().multiplyScalar(sg), 0), world = new THREE.Plane();
        const meshes = []; g.traverse(o => o.isMesh && meshes.push(o));
        meshes.forEach(m => {
          const skin = m.material.clone(); skin.clippingPlanes = [world];
          if (m.userData.flesh !== undefined) {
            const inner = new THREE.Mesh(m.geometry, new THREE.MeshStandardMaterial({
              color: m.userData.flesh, emissive: m.userData.flesh, emissiveIntensity: .35, side: THREE.BackSide, clippingPlanes: [world] }));
            inner.position.copy(m.position); inner.quaternion.copy(m.quaternion); inner.scale.copy(m.scale);
            m.parent.add(inner);
          } else skin.side = THREE.DoubleSide;
          m.material = skin;
        });
        g.userData.update = () => { g.updateMatrixWorld(true); world.copy(local).applyMatrix4(g.matrixWorld); };
        g.userData.update();
        return g;
      });
    }
  };
})();
