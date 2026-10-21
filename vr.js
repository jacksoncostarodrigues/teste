import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

(() => {
  "use strict";

  const TABULEIRO_ID = "tabuleiro";

  let renderer;
  let scene;
  let camera;
  let boardGroup;
  let statusElement;
  let vrButton;

  let xrSession = null;
  let controller1;
  let controller2;

  const raycaster = new THREE.Raycaster();
  const tempMatrix = new THREE.Matrix4();

  const cellObjects = [];
  const cellMaterials = [];
  const markObjects = new Array(9).fill(null);

  let painelResultado = null;
  let textoResultado = null;
  let botaoJogarNovamente = null;
  let textoBotaoNovamente = null;
  let partidaFinalizadaVR = false;

  let observer = null;
  let lastBoardState = "";
  let initialized = false;

  // --------------------------------------------------
  // Interface de acesso ao modo VR
  // --------------------------------------------------

  function createInterface() {
    if (document.getElementById("btnEntrarVR")) return;

    const container =
      document.getElementById("telaJogo") ||
      document.getElementById(TABULEIRO_ID)?.parentElement ||
      document.body;

    vrButton = document.createElement("button");
    vrButton.id = "btnEntrarVR";
    vrButton.type = "button";
    vrButton.textContent = "🥽 Entrar no modo VR";

    Object.assign(vrButton.style, {
      display: "block",
      margin: "16px auto",
      padding: "12px 20px",
      border: "0",
      borderRadius: "10px",
      background: "#6750e8",
      color: "#ffffff",
      fontSize: "16px",
      fontWeight: "700",
      cursor: "pointer"
    });

    statusElement = document.createElement("p");
    statusElement.id = "statusVR";
    statusElement.setAttribute("role", "status");
    statusElement.style.textAlign = "center";
    statusElement.style.fontSize = "14px";

    container.appendChild(vrButton);
    container.appendChild(statusElement);

    vrButton.addEventListener("click", enterVR);

    if (!navigator.xr) {
      vrButton.title =
        "Abra o jogo no navegador compatível do Meta Quest usando HTTPS.";
      setStatus(
        "O VR depende de um navegador compatível com WebXR e de uma conexão segura HTTPS."
      );
    } else {
      setStatus("Modo VR disponível para teste em um dispositivo compatível.");
    }
  }

  function setStatus(message) {
    if (statusElement) statusElement.textContent = message;
  }

  // --------------------------------------------------
  // Criação do ambiente Three.js
  // --------------------------------------------------

  function initializeScene() {
    if (initialized) return;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080b18);

    camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      50
    );

    camera.position.set(0, 1.6, 0);

    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    Object.assign(renderer.domElement.style, {
      display: "none",
      position: "fixed",
      inset: "0",
      width: "100%",
      height: "100%",
      zIndex: "99999"
    });

    document.body.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xc6ddff, 0x171126, 2));

    const light = new THREE.DirectionalLight(0xffffff, 2.5);
    light.position.set(1, 3, 2);
    scene.add(light);

    createBoard3D();
    createControllers();

    window.addEventListener("resize", resizeRenderer);

    initialized = true;
  }

  // --------------------------------------------------
  // Tabuleiro 3D: nove casas selecionáveis
  // --------------------------------------------------

  function createBoard3D() {
    boardGroup = new THREE.Group();

    boardGroup.position.set(0, 1.4, -2.2);
    scene.add(boardGroup);

    const background = new THREE.Mesh(
      new THREE.BoxGeometry(2.28, 2.28, 0.09),
      new THREE.MeshStandardMaterial({
        color: 0x121a35,
        metalness: 0.35,
        roughness: 0.3,
        emissive: 0x101c50,
        emissiveIntensity: 0.6
      })
    );

    background.position.z = -0.07;
    boardGroup.add(background);

    const gridMaterial = new THREE.MeshStandardMaterial({
      color: 0x56c8ff,
      emissive: 0x187cff,
      emissiveIntensity: 1.2,
      metalness: 0.2,
      roughness: 0.25
    });

    // Linhas verticais e horizontais
    for (let i = 1; i <= 2; i++) {
      const offset = -1.14 + i * 0.76;

      const vertical = new THREE.Mesh(
        new THREE.BoxGeometry(0.025, 2.18, 0.025),
        gridMaterial
      );

      vertical.position.set(offset, 0, 0);
      boardGroup.add(vertical);

      const horizontal = new THREE.Mesh(
        new THREE.BoxGeometry(2.18, 0.025, 0.025),
        gridMaterial
      );

      horizontal.position.set(0, offset, 0);
      boardGroup.add(horizontal);
    }

    for (let index = 0; index < 9; index++) {
      const row = Math.floor(index / 3);
      const col = index % 3;

      const material = new THREE.MeshStandardMaterial({
        color: 0x18264a,
        transparent: true,
        opacity: 0.55,
        emissive: 0x10234a,
        emissiveIntensity: 0.35,
        roughness: 0.3
      });

      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(0.69, 0.69, 0.025),
        material
      );

      panel.position.set(
        (col - 1) * 0.76,
        (1 - row) * 0.76,
        0.035
      );

      panel.userData.cellIndex = index;
      panel.userData.originalColor = material.color.clone();

      boardGroup.add(panel);

      cellObjects.push(panel);
      cellMaterials.push(material);
    }

    const title = makeText(
      "JOGO DA VELHA",
      0.13,
      "#ffffff"
    );

    title.position.set(0, 1.31, 0.04);
    boardGroup.add(title);

    const instruction = makeText(
      "APONTE O CONTROLE E APERTE O GATILHO",
      0.055,
      "#8edfff"
    );

    instruction.position.set(0, -1.31, 0.04);
    boardGroup.add(instruction);

    synchronizeBoard();
  }

  // Cria texto usando geometria 2D simples, sem fontes externas.
  function makeText(text, size, color) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.width = 1024;
    canvas.height = 128;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = color;
    context.font = "bold 46px Arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, 512, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(size * 8, size),
      material
    );

    return mesh;
  }

  // --------------------------------------------------
  // Símbolos X e O em 3D
  // --------------------------------------------------

  function createMark(symbol, color) {
    const group = new THREE.Group();

    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.8,
      metalness: 0.25,
      roughness: 0.25
    });

    if (symbol === "X") {
      for (const angle of [Math.PI / 4, -Math.PI / 4]) {
        const bar = new THREE.Mesh(
          new THREE.BoxGeometry(0.38, 0.065, 0.055),
          material
        );

        bar.rotation.z = angle;
        group.add(bar);
      }
    } else {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.17, 0.04, 12, 36),
        material
      );

      group.add(ring);
    }

    return group;
  }

  // --------------------------------------------------
  // Integração com o tabuleiro HTML existente
  // --------------------------------------------------

  function getHTMLCells() {
    const board = document.getElementById(TABULEIRO_ID);
    if (!board) return [];

    // Preferência por elementos clicáveis do tabuleiro atual.
    const clickable = Array.from(
      board.querySelectorAll(
        "button, [role='button'], .celula, .cell, .casa"
      )
    );

    if (clickable.length >= 9) return clickable.slice(0, 9);

    // Alternativa: nove filhos diretos do tabuleiro.
    const children = Array.from(board.children);

    if (children.length >= 9) return children.slice(0, 9);

    return [];
  }

  function readMark(element) {
    if (!element) return "";

    const text = (element.innerText || element.textContent || "")
      .trim()
      .toUpperCase();

    if (text === "X" || text.includes("❌")) return "X";
    if (text === "O" || text.includes("⭕")) return "O";

    if (
      element.classList.contains("x") ||
      element.classList.contains("jogador-x")
    ) {
      return "X";
    }

    if (
      element.classList.contains("o") ||
      element.classList.contains("jogador-o")
    ) {
      return "O";
    }

    return "";
  }

  
function detectarResultadoVR() {
  const cells = getHTMLCells();

  if (cells.length !== 9) return null;

  const board = cells.map(readMark);

  const combinacoes = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  for (const [a, b, c] of combinacoes) {
    if (
      board[a] &&
      board[a] === board[b] &&
      board[a] === board[c]
    ) {
      return {
        tipo: "vitoria",
        simbolo: board[a],
        mensagem: `VITÓRIA DO JOGADOR ${board[a]}!`
      };
    }
  }

  if (board.every(Boolean)) {
    return {
      tipo: "empate",
      simbolo: "",
      mensagem: "EMPATE! NINGUÉM VENCEU."
    };
  }

  return null;
}


function criarPainelResultadoVR(mensagem) {
  if (!boardGroup) return;

  if (painelResultado) {
    boardGroup.remove(painelResultado);
    disposeObject(painelResultado);
  }

  painelResultado = new THREE.Group();
  painelResultado.position.set(0, 0, 0.35);

  const fundo = new THREE.Mesh(
    new THREE.BoxGeometry(1.85, 0.85, 0.08),
    new THREE.MeshStandardMaterial({
      color: 0x10182e,
      emissive: 0x163c75,
      emissiveIntensity: 1,
      metalness: 0.2,
      roughness: 0.3
    })
  );

  painelResultado.add(fundo);

  textoResultado = makeText(mensagem, 0.11, "#ffffff");
  textoResultado.position.set(0, 0.16, 0.06);
  painelResultado.add(textoResultado);

  const materialBotao = new THREE.MeshStandardMaterial({
    color: 0x176bdb,
    emissive: 0x124cff,
    emissiveIntensity: 1
  });

  botaoJogarNovamente = new THREE.Mesh(
    new THREE.BoxGeometry(1.15, 0.23, 0.06),
    materialBotao
  );

  botaoJogarNovamente.position.set(0, -0.19, 0.08);
  botaoJogarNovamente.userData.acaoVR = "reiniciar";
  painelResultado.add(botaoJogarNovamente);

  textoBotaoNovamente = makeText(
    "JOGAR NOVAMENTE",
    0.07,
    "#ffffff"
  );

  textoBotaoNovamente.position.set(0, -0.19, 0.12);
  painelResultado.add(textoBotaoNovamente);

  boardGroup.add(painelResultado);
}

function removerPainelResultadoVR() {
  if (!painelResultado || !boardGroup) return;

  boardGroup.remove(painelResultado);
  disposeObject(painelResultado);

  painelResultado = null;
  textoResultado = null;
  botaoJogarNovamente = null;
  textoBotaoNovamente = null;

  partidaFinalizadaVR = false;
}

function atualizarResultadoVR() {
  const resultado = detectarResultadoVR();

  if (resultado && !partidaFinalizadaVR) {
    partidaFinalizadaVR = true;
    criarPainelResultadoVR(resultado.mensagem);
  }

  if (!resultado && partidaFinalizadaVR) {
    removerPainelResultadoVR();
  }
}


  function synchronizeBoard() {
    if (!boardGroup) return;

    const htmlCells = getHTMLCells();

    if (htmlCells.length !== 9) {
      setStatus(
        "Não foi possível localizar as nove casas do tabuleiro HTML. Confira o ID e a estrutura do tabuleiro."
      );
      return;
    }

    const state = htmlCells.map(readMark).join("");

    if (state === lastBoardState && markObjects.some(Boolean)) {
      return;
    }

    lastBoardState = state;

    for (let index = 0; index < 9; index++) {
      if (markObjects[index]) {
        boardGroup.remove(markObjects[index]);
        disposeObject(markObjects[index]);
        markObjects[index] = null;
      }

      const symbol = readMark(htmlCells[index]);

      if (!symbol) continue;

      const row = Math.floor(index / 3);
      const col = index % 3;

      const mark = createMark(
        symbol,
        symbol === "X" ? 0x38d9ff : 0xff658b
      );

      mark.position.set(
        (col - 1) * 0.76,
        (1 - row) * 0.76,
        0.12
      );

      boardGroup.add(mark);
      markObjects[index] = mark;
    }
  }

  function disposeObject(object) {
    object.traverse((child) => {
      if (child.geometry) child.geometry.dispose();

      if (child.material) {
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];

        materials.forEach((material) => {
          if (material.map) material.map.dispose();
          material.dispose();
        });
      }
    });
  }

  function observeHTMLBoard() {
    const board = document.getElementById(TABULEIRO_ID);
    if (!board || observer) return;

    observer = new MutationObserver(() => {
      synchronizeBoard();
    });

    observer.observe(board, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["class", "aria-label", "data-mark"]
    });
  }

  // --------------------------------------------------
  // Controles do Meta Quest e laser
  // --------------------------------------------------

  function createControllers() {
    controller1 = renderer.xr.getController(0);
    controller2 = renderer.xr.getController(1);

    [controller1, controller2].forEach((controller) => {
      const points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -1)
      ];

      const geometry = new THREE.BufferGeometry().setFromPoints(points);

      const line = new THREE.Line(
        geometry,
        new THREE.LineBasicMaterial({
          color: 0x42eaff,
          transparent: true,
          opacity: 0.95
        })
      );

      line.scale.z = 5;

      controller.add(line);
      scene.add(controller);

      controller.addEventListener("select", () => {
        selectCell(controller);
      });
    });
  }

  
function selectCell(controller) {
  tempMatrix.identity().extractRotation(controller.matrixWorld);

  raycaster.ray.origin.setFromMatrixPosition(
    controller.matrixWorld
  );

  raycaster.ray.direction
    .set(0, 0, -1)
    .applyMatrix4(tempMatrix);

  // Se a partida terminou, só aceita o botão de reiniciar.
  if (partidaFinalizadaVR && botaoJogarNovamente) {
    const hitsBotao = raycaster.intersectObject(
      botaoJogarNovamente,
      false
    );

    if (hitsBotao.length) {
      const botaoHTML = document.getElementById("botaoReiniciar");

      if (botaoHTML) {
        botaoHTML.click();
        removerPainelResultadoVR();

        lastBoardState = "";
        requestAnimationFrame(synchronizeBoard);

        setStatus("Nova partida iniciada.");
      } else {
        setStatus(
          "Não encontrei o botão botaoReiniciar no HTML."
        );
      }

      return;
    }

    return;
  }

  const hits = raycaster.intersectObjects(cellObjects, false);

  if (!hits.length) return;

  const index = hits[0].object.userData.cellIndex;
  const cells = getHTMLCells();

  if (index == null || !cells[index]) return;
  if (readMark(cells[index])) return;

  cells[index].click();

  requestAnimationFrame(() => {
    synchronizeBoard();
    atualizarResultadoVR();
  });
}

  // --------------------------------------------------
  // Sessão WebXR
  // --------------------------------------------------

  async function enterVR() {
    if (!navigator.xr) {
      setStatus(
        "WebXR não está disponível. Abra a página no navegador do Meta Quest usando HTTPS."
      );
      return;
    }

    try {
      const supported = await navigator.xr.isSessionSupported(
        "immersive-vr"
      );

      if (!supported) {
        setStatus(
          "Este navegador não disponibilizou uma sessão VR imersiva."
        );
        return;
      }

      initializeScene();

      const session = await navigator.xr.requestSession(
        "immersive-vr",
        {
          optionalFeatures: [
            "local-floor",
            "bounded-floor",
            "hand-tracking"
          ]
        }
      );

      xrSession = session;

      await renderer.xr.setSession(session);

      renderer.domElement.style.display = "block";
      vrButton.textContent = "🥽 VR ativado";
      vrButton.disabled = true;

      setStatus(
        "VR ativo. Aponte um controle para uma casa e aperte o gatilho."
      );

      observeHTMLBoard();
      synchronizeBoard();

      renderer.setAnimationLoop(() => {
        synchronizeBoard();
        atualizarResultadoVR();

        updateHover(controller1);
        updateHover(controller2);

  renderer.render(scene, camera);
});

      session.addEventListener("end", () => {
        renderer.setAnimationLoop(null);
        renderer.domElement.style.display = "none";

        xrSession = null;

        if (vrButton) {
          vrButton.disabled = false;
          vrButton.textContent = "🥽 Entrar no modo VR";
        }

        setStatus("Sessão VR encerrada. O jogo tradicional continua disponível.");
      });
    } catch (error) {
      console.error("Erro ao iniciar WebXR:", error);

      setStatus(
        "Não foi possível iniciar o VR. Confira a conexão HTTPS e a compatibilidade do navegador."
      );
    }
  }

  function updateHover(controller) {
    if (!controller || !boardGroup) return;

    tempMatrix.identity().extractRotation(controller.matrixWorld);

    raycaster.ray.origin.setFromMatrixPosition(
      controller.matrixWorld
    );

    raycaster.ray.direction
      .set(0, 0, -1)
      .applyMatrix4(tempMatrix);

    const hits = raycaster.intersectObjects(cellObjects, false);
    const selected = hits.length ? hits[0].object : null;

    cellObjects.forEach((cell, index) => {
      const occupied = Boolean(readMark(getHTMLCells()[index]));

      cellMaterials[index].emissive.setHex(
        cell === selected ? 0x1478ff : occupied ? 0x101020 : 0x10234a
      );

      cellMaterials[index].emissiveIntensity =
        cell === selected ? 1.7 : 0.35;
    });
  }

  function resizeRenderer() {
    if (!renderer || !camera) return;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // Inicializa a integração sem substituir o jogo atual.
  function start() {
    createInterface();

    // Observa o tabuleiro caso o jogo já esteja disponível.
    observeHTMLBoard();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
