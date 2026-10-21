// ============================================================
// JOGO DA VELHA — VERSAO 5.0
// Se este número aparecer no console, o código novo está rodando.
// ============================================================
const VERSAO_CODIGO = "5.0";
console.log("%c=== JOGO DA VELHA " + VERSAO_CODIGO + " ===", "color:cyan;font-size:16px;font-weight:bold");

// ---------------- ESTADO ----------------
let tabuleiro = ["", "", "", "", "", "", "", "", ""];
const simboloJ1 = "X";
const simboloJ2 = "O";
let jogoAcabou = false;
let modoJogo = "pvc";
let nivelDificuldade = "dificil";

let nomeJ1 = "Jogador 1";
let nomeJ2 = "Computador";

let turnoAtual = simboloJ1;
let quemComeca = simboloJ1;

let placar = { j1: 0, empate: 0, j2: 0 };

// ---------------- ÁUDIO ----------------
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
function tocarTom(f, d, t = "sine") {
    const o = audioContext.createOscillator(), g = audioContext.createGain();
    o.type = t; o.frequency.value = f;
    g.gain.setValueAtTime(0.2, audioContext.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + d);
    o.connect(g); g.connect(audioContext.destination);
    o.start(); o.stop(audioContext.currentTime + d);
}
function tocarSomJogada() { tocarTom(440, 0.1); }
function tocarSomVitoria() { tocarTom(523, 0.15); setTimeout(() => tocarTom(659, 0.15), 150); setTimeout(() => tocarTom(784, 0.25), 300); }
function tocarSomEmpate() { tocarTom(220, 0.3, "triangle"); }

// ---------------- DOM ----------------
const telaMenu   = document.getElementById("telaMenu");
const telaNivel  = document.getElementById("telaNivel");
const telaConfig = document.getElementById("telaConfig");
const telaJogo   = document.getElementById("telaJogo");
const telaOnline = document.getElementById("telaOnline");

const btnEscolherPvc = document.getElementById("btnEscolherPvc");
const btnEscolherPvp = document.getElementById("btnEscolherPvp");
const btnJogarOnline = document.getElementById("btnJogarOnline");
const btnNivelMedio   = document.getElementById("btnNivelMedio");
const btnNivelDificil = document.getElementById("btnNivelDificil");
const tituloConfig = document.getElementById("tituloConfig");
const inputNome1   = document.getElementById("nomeJogador1");
const inputNome2   = document.getElementById("nomeJogador2");
const botaoComecar = document.getElementById("botaoComecar");

const tabuleiroWrapperEl = document.getElementById("tabuleiroWrapper");
const tabuleiroEl        = document.getElementById("tabuleiro");
const mensagemEl         = document.getElementById("mensagem");
const botaoReiniciar     = document.getElementById("botaoReiniciar");
const botaoVoltarMenu    = document.getElementById("botaoVoltarMenu");
const placarNome1El      = document.getElementById("placarNome1");
const placarNome2El      = document.getElementById("placarNome2");
const placarPontos1El    = document.getElementById("placarPontos1");
const placarEmpateEl     = document.getElementById("placarEmpate");
const placarPontos2El    = document.getElementById("placarPontos2");
const overlayVitoriaEl = document.getElementById("overlayVitoria");
const canvasConfeteEl  = document.getElementById("canvasConfete");
const textoVitoriaEl   = document.getElementById("textoVitoria");

const btnCriarSala        = document.getElementById("btnCriarSala");
const salaInfo            = document.getElementById("salaInfo");
const meuIdSalaEl         = document.getElementById("meuIdSala");
const statusConexaoEl     = document.getElementById("statusConexao");
const inputIdSala         = document.getElementById("inputIdSala");
const btnEntrarSala       = document.getElementById("btnEntrarSala");
const btnVoltarMenuOnline = document.getElementById("btnVoltarMenuOnline");

let confeteAnimando = false;

// ---------------- NAVEGAÇÃO ----------------
function mostrarTela(tela) {
    [telaMenu, telaNivel, telaConfig, telaJogo, telaOnline].forEach(t => t && t.classList.add("escondido"));
    if (tela) tela.classList.remove("escondido");
}

if (btnEscolherPvc) btnEscolherPvc.addEventListener("click", () => { modoJogo = "pvc"; mostrarTela(telaNivel); });
if (btnEscolherPvp) btnEscolherPvp.addEventListener("click", () => {
    modoJogo = "pvp";
    if (tituloConfig) tituloConfig.textContent = "Digite os nomes dos jogadores";
    if (inputNome2) inputNome2.classList.remove("escondido");
    mostrarTela(telaConfig);
});
if (btnNivelMedio) btnNivelMedio.addEventListener("click", () => {
    nivelDificuldade = "medio";
    if (tituloConfig) tituloConfig.textContent = "Digite seu nome";
    if (inputNome2) inputNome2.classList.add("escondido");
    mostrarTela(telaConfig);
});
if (btnNivelDificil) btnNivelDificil.addEventListener("click", () => {
    nivelDificuldade = "dificil";
    if (tituloConfig) tituloConfig.textContent = "Digite seu nome";
    if (inputNome2) inputNome2.classList.add("escondido");
    mostrarTela(telaConfig);
});
if (botaoComecar) botaoComecar.addEventListener("click", () => {
    const v1 = inputNome1 ? inputNome1.value.trim() : "";
    nomeJ1 = v1 === "" ? "Jogador 1" : v1;
    if (modoJogo === "pvp") {
        const v2 = inputNome2 ? inputNome2.value.trim() : "";
        nomeJ2 = v2 === "" ? "Jogador 2" : v2;
    } else {
        nomeJ2 = nivelDificuldade === "medio" ? "Computador (Médio)" : "Computador (Difícil)";
    }
    if (placarNome1El) placarNome1El.textContent = nomeJ1;
    if (placarNome2El) placarNome2El.textContent = nomeJ2;
    placar = { j1: 0, empate: 0, j2: 0 };
    if (placarPontos1El) placarPontos1El.textContent = 0;
    if (placarEmpateEl)  placarEmpateEl.textContent  = 0;
    if (placarPontos2El) placarPontos2El.textContent = 0;
    quemComeca = simboloJ1;
    mostrarTela(telaJogo);
    iniciarPartida();
});
if (botaoVoltarMenu) botaoVoltarMenu.addEventListener("click", () => { esconderVitoria(); mostrarTela(telaMenu); });

// ---------------- REDE / MULTIPLAYER ----------------
let peer = null;
let conn = null;
let isHost = false;
let salaId = null;
let multiplayerAtivo = false;
let conexaoEstabelecida = false;
let estadoInicialAplicado = false;

let versaoEstado = 0;
let ultimaVersaoRecebida = -1;

let pollingConexao = null;
let timeoutConexao = null;
let timeoutSolicitarEstado = null;
let intervalHeartbeat = null;

const CARACTERES_SALA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const TAMANHO_CODIGO  = 6;
const PREFIXO_PEER    = "jdv-vr-";

const CONFIG_ICE = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:19302" },
        { urls: "stun:stun.cloudflare.com:3478" },
        { urls: "stun:stun.services.mozilla.com" }
    ],
    iceCandidatePoolSize: 10
};

function gerarCodigoSala() {
    let c = "";
    for (let i = 0; i < TAMANHO_CODIGO; i++) c += CARACTERES_SALA[Math.floor(Math.random() * CARACTERES_SALA.length)];
    return c;
}
function normalizarCodigo(c) { return (c || "").toUpperCase().replace(/[^A-Z0-9]/g, ""); }

function setDebug(msg) {
    console.log("[Debug " + VERSAO_CODIGO + "]", msg);
    let el = document.getElementById("debugText");
    if (!el && telaOnline) {
        const box = document.createElement("div");
        box.id = "debugBox";
        box.style.cssText = "margin-top:16px;padding:10px;border-radius:8px;background:rgba(0,0,0,0.35);color:#f9e2af;font-size:12px;font-family:monospace;word-break:break-all;max-width:100%;text-align:left;";
        box.innerHTML = '<b>Debug v' + VERSAO_CODIGO + ':</b> <span id="debugText"></span>';
        const ref = document.getElementById("btnVoltarMenuOnline");
        if (ref && ref.parentNode) ref.parentNode.insertBefore(box, ref);
        else if (telaOnline) telaOnline.appendChild(box);
        el = document.getElementById("debugText");
    }
    if (el) el.textContent = msg;
}

// Painel visível no topo da tela de jogo
function atualizarPainelEstado() {
    let el = document.getElementById("painelEstado");
    if (!el && telaJogo) {
        el = document.createElement("div");
        el.id = "painelEstado";
        el.style.cssText = "position:fixed;top:0;left:0;right:0;padding:8px 12px;background:rgba(0,0,0,0.85);color:#f9e2af;font-size:12px;font-family:monospace;z-index:99998;text-align:center;pointer-events:none;";
        document.body.appendChild(el);
    }
    if (!el) return;
    if (!multiplayerAtivo) { el.textContent = ""; return; }
    const papel = isHost ? "🔴 HOST (X)" : "🔵 CONVIDADO (O)";
    const t = tabuleiro.map(v => v || ".").join("");
    const v = isHost ? versaoEstado : ultimaVersaoRecebida;
    el.textContent = `${papel} | v${VERSAO_CODIGO} | tab=${t} | turno=${turnoAtual} | estado=v${v}`;
}

if (inputIdSala) {
    inputIdSala.maxLength = TAMANHO_CODIGO;
    inputIdSala.placeholder = `Código de ${TAMANHO_CODIGO} caracteres`;
    inputIdSala.setAttribute("inputmode", "text");
    inputIdSala.setAttribute("autocomplete", "off");
    inputIdSala.setAttribute("autocapitalize", "characters");
    inputIdSala.style.textTransform = "uppercase";
    inputIdSala.style.letterSpacing = "3px";
    inputIdSala.style.fontFamily = "'Courier New', monospace";
    inputIdSala.addEventListener("input", () => {
        inputIdSala.value = normalizarCodigo(inputIdSala.value).slice(0, TAMANHO_CODIGO);
    });
}

function destruirConexao() {
    if (pollingConexao) { clearInterval(pollingConexao); pollingConexao = null; }
    if (timeoutConexao) { clearTimeout(timeoutConexao); timeoutConexao = null; }
    if (timeoutSolicitarEstado) { clearTimeout(timeoutSolicitarEstado); timeoutSolicitarEstado = null; }
    if (intervalHeartbeat) { clearInterval(intervalHeartbeat); intervalHeartbeat = null; }
    if (conn) { try { conn.close(); } catch (e) {} conn = null; }
    if (peer) { try { peer.destroy(); } catch (e) {} peer = null; }
    multiplayerAtivo = false;
    isHost = false;
    conexaoEstabelecida = false;
    estadoInicialAplicado = false;
    versaoEstado = 0;
    ultimaVersaoRecebida = -1;
    atualizarPainelEstado();
}

if (btnJogarOnline) btnJogarOnline.addEventListener("click", () => {
    destruirConexao();
    if (salaInfo) salaInfo.classList.add("escondido");
    if (statusConexaoEl) statusConexaoEl.textContent = "Aguardando conexão...";
    setDebug("v" + VERSAO_CODIGO + " pronto para criar ou entrar.");
    mostrarTela(telaOnline);
});
if (btnVoltarMenuOnline) btnVoltarMenuOnline.addEventListener("click", () => { destruirConexao(); mostrarTela(telaMenu); });
if (btnCriarSala) btnCriarSala.addEventListener("click", () => { if (salaInfo) salaInfo.classList.remove("escondido"); iniciarHost(); });
if (btnEntrarSala) btnEntrarSala.addEventListener("click", () => {
    const id = inputIdSala ? inputIdSala.value : "";
    entrarNaSala(id);
});

// --------------------------------------------------------------
// HOST
// --------------------------------------------------------------
function iniciarHost(tentativa = 0) {
    if (typeof Peer === "undefined") { setDebug("ERRO: PeerJS não carregou."); return; }
    const codigo = gerarCodigoSala();
    const peerId = PREFIXO_PEER + codigo;
    setDebug("Host v" + VERSAO_CODIGO + ": criando peer " + peerId);
    peer = new Peer(peerId, { config: CONFIG_ICE });

    peer.on("open", () => {
        salaId = codigo;
        isHost = true;
        if (meuIdSalaEl) meuIdSalaEl.textContent = codigo;
        if (statusConexaoEl) statusConexaoEl.textContent = "Aguardando convidado...";
        setDebug("Host: aguardando convidado (código " + codigo + ")");

        peer.on("connection", (connection) => {
            setDebug("Host: convidado detectado, open=" + connection.open);
            conn = connection;
            configurarConexao(conn);

            if (pollingConexao) clearInterval(pollingConexao);
            pollingConexao = setInterval(() => {
                if (connection.open) {
                    clearInterval(pollingConexao); pollingConexao = null;
                    setDebug("Host: conexão aberta, iniciando jogo");
                    iniciarJogoHost();
                }
            }, 150);
        });
    });

    peer.on("error", (err) => {
        console.error("[Host] Erro PeerJS:", err);
        setDebug("Host erro: " + (err.type || err));
        if (err.type === "unavailable-id" && tentativa < 5) {
            try { peer.destroy(); } catch (e) {}
            peer = null;
            setTimeout(() => iniciarHost(tentativa + 1), 300);
        }
    });
}

function iniciarJogoHost() {
    conexaoEstabelecida = true;
    multiplayerAtivo = true;
    modoJogo = "pvp";
    nomeJ1 = "Host (X)";
    nomeJ2 = "Convidado (O)";
    quemComeca = simboloJ1;
    placar = { j1: 0, empate: 0, j2: 0 };
    versaoEstado = 0;
    mostrarTela(telaJogo);
    iniciarPartida();

    // Heartbeat: reenvia estado a cada 800ms (mantém o cliente sempre em sincronia)
    if (intervalHeartbeat) clearInterval(intervalHeartbeat);
    intervalHeartbeat = setInterval(() => {
        if (multiplayerAtivo && isHost && conn && conn.open) {
            enviarEstadoAtual();
        }
    }, 800);

    enviarEstadoAtual();
}

// --------------------------------------------------------------
// CLIENTE
// --------------------------------------------------------------
function entrarNaSala(codigoDigitado) {
    if (typeof Peer === "undefined") { setDebug("ERRO: PeerJS não carregou."); return; }
    const codigo = normalizarCodigo(codigoDigitado);
    if (codigo.length !== TAMANHO_CODIGO) {
        alert(`O código deve ter ${TAMANHO_CODIGO} caracteres.`);
        return;
    }
    const peerId = PREFIXO_PEER + codigo;
    peer = new Peer({ config: CONFIG_ICE });
    setDebug("Cliente v" + VERSAO_CODIGO + ": conectando a " + peerId);

    peer.on("open", () => {
        setDebug("Cliente: peer conectado, abrindo DataConnection...");
        conn = peer.connect(peerId, { reliable: true });
        configurarConexao(conn);

        if (pollingConexao) clearInterval(pollingConexao);
        let tentativas = 0;
        pollingConexao = setInterval(() => {
            tentativas++;
            if (conn && conn.open) {
                clearInterval(pollingConexao); pollingConexao = null;
                setDebug("Cliente: DataConnection aberta!");
                isHost = false;
                conexaoEstabelecida = true;
                if (statusConexaoEl) statusConexaoEl.textContent = "Conectado! Aguardando estado...";
                if (timeoutSolicitarEstado) clearTimeout(timeoutSolicitarEstado);
                timeoutSolicitarEstado = setTimeout(() => {
                    if (!estadoInicialAplicado && conn && conn.open) {
                        setDebug("Cliente: pedindo estado inicial");
                        conn.send({ tipo: "solicitar_estado" });
                    }
                }, 2000);
            } else if (tentativas > 100) {
                clearInterval(pollingConexao); pollingConexao = null;
                setDebug("Cliente: TIMEOUT aguardando conexão.");
            }
        }, 150);

        if (timeoutConexao) clearTimeout(timeoutConexao);
        timeoutConexao = setTimeout(() => {
            if (!estadoInicialAplicado) setDebug("Cliente: TIMEOUT sem estado inicial.");
        }, 20000);
    });

    peer.on("error", (err) => {
        console.error("[Cliente] Erro:", err);
        setDebug("Cliente erro: " + (err.type || err));
        if (err.type === "peer-unavailable" && statusConexaoEl)
            statusConexaoEl.textContent = "Código não encontrado.";
    });
}

// --------------------------------------------------------------
// MENSAGENS
// --------------------------------------------------------------
function configurarConexao(connection) {
    connection.on("data", (data) => {
        if (!data || !data.tipo) return;
        setDebug("Recebido: " + data.tipo + (data.versao != null ? " v" + data.versao : ""));

        if (data.tipo === "estado") {
            // Só o cliente aplica estado recebido
            if (isHost) return;

            // Aplica sempre se versão >= última (mesma versão reaplica, útil para corrigir)
            if (data.versao < ultimaVersaoRecebida) {
                setDebug("Cliente: estado v" + data.versao + " < v" + ultimaVersaoRecebida + ", ignorando");
                return;
            }
            ultimaVersaoRecebida = data.versao;

            estadoInicialAplicado = true;
            if (timeoutSolicitarEstado) { clearTimeout(timeoutSolicitarEstado); timeoutSolicitarEstado = null; }
            if (timeoutConexao) { clearTimeout(timeoutConexao); timeoutConexao = null; }

            // ATENÇÃO: substitui o tabuleiro inteiro, célula por célula
            tabuleiro = data.tabuleiro.slice();
            turnoAtual = data.turnoAtual;
            quemComeca = data.quemComeca;
            jogoAcabou = data.jogoAcabou;
            nomeJ1 = data.nomes.j1;
            nomeJ2 = data.nomes.j2;
            placar = { ...data.placar };
            multiplayerAtivo = true;
            modoJogo = "pvp";

            mostrarTela(telaJogo);
            atualizarInterfaceCompleta();
            if (statusConexaoEl) statusConexaoEl.textContent = "Conectado!";
            setDebug("Cliente: aplicado v" + data.versao + " tab=" + tabuleiro.join(""));

        } else if (data.tipo === "jogada") {
            // Só o host processa jogadas
            if (!isHost) return;

            const podeAplicar =
                tabuleiro[data.index] === "" &&
                !jogoAcabou &&
                turnoAtual === simboloJ2;

            if (podeAplicar) {
                aplicarJogadaLocal(data.index, simboloJ2);
                versaoEstado++;
                enviarEstadoAtual();
                setDebug("Host: aplicou O na célula " + data.index + " (v" + versaoEstado + ")");
            } else {
                setDebug("Host: jogada rejeitada, reenviando estado");
                enviarEstadoAtual();
            }

        } else if (data.tipo === "reiniciar") {
            if (isHost) reiniciarPartidaLocal();

        } else if (data.tipo === "solicitar_estado") {
            if (isHost) { setDebug("Host: cliente pediu estado"); enviarEstadoAtual(); }
        }
    });

    connection.on("close", () => {
        setDebug("Conexão encerrada.");
        if (statusConexaoEl) statusConexaoEl.textContent = "Conexão encerrada.";
        multiplayerAtivo = false;
        conexaoEstabelecida = false;
        estadoInicialAplicado = false;
        if (intervalHeartbeat) { clearInterval(intervalHeartbeat); intervalHeartbeat = null; }
        atualizarPainelEstado();
    });

    connection.on("error", (err) => {
        console.error("[Rede] erro:", err);
        setDebug("Erro na conexão: " + (err && err.message ? err.message : err));
    });
}

function enviarEstadoAtual() {
    if (!conn || !conn.open) return false;
    try {
        conn.send({
            tipo: "estado",
            versao: versaoEstado,
            tabuleiro: tabuleiro.slice(),
            turnoAtual: turnoAtual,
            quemComeca: quemComeca,
            jogoAcabou: jogoAcabou,
            nomes: { j1: nomeJ1, j2: nomeJ2 },
            placar: { ...placar }
        });
        return true;
    } catch (e) { return false; }
}

function atualizarInterfaceCompleta() {
    if (placarNome1El) placarNome1El.textContent = nomeJ1;
    if (placarNome2El) placarNome2El.textContent = nomeJ2;
    if (placarPontos1El) placarPontos1El.textContent = placar.j1;
    if (placarEmpateEl)  placarEmpateEl.textContent  = placar.empate;
    if (placarPontos2El) placarPontos2El.textContent = placar.j2;
    criarTabuleiro();
    atualizarMensagemTurno();
    atualizarPainelEstado();
}

// ---------------- TABULEIRO ----------------
function criarTabuleiro() {
    if (!tabuleiroEl) return;
    tabuleiroEl.innerHTML = "";
    tabuleiro.forEach((valor, index) => {
        const celula = document.createElement("div");
        celula.classList.add("celula");
        if (valor === "X") celula.classList.add("x");
        if (valor === "O") celula.classList.add("o");
        celula.textContent = valor;
        celula.addEventListener("click", () => jogarNaCelula(index));
        tabuleiroEl.appendChild(celula);
    });
}

function jogarNaCelula(index) {
    if (tabuleiro[index] !== "" || jogoAcabou) return;
    if (modoJogo === "pvc" && turnoAtual !== simboloJ1) return;

    if (multiplayerAtivo) {
        if (!conexaoEstabelecida) return;

        if (isHost) {
            if (turnoAtual !== simboloJ1) return;
            const simboloJogado = turnoAtual;  // captura ANTES (sempre "X")
            aplicarJogadaLocal(index, simboloJogado);
            versaoEstado++;
            enviarEstadoAtual();
            setDebug("Host: jogou X na célula " + index + " (v" + versaoEstado + ")");
        } else {
            // CLIENTE NUNCA APLICA LOCALMENTE
            if (turnoAtual !== simboloJ2) return;
            if (conn && conn.open) {
                setDebug("Cliente: enviando jogada (célula " + index + ")");
                conn.send({ tipo: "jogada", index: index });
            }
        }
    } else {
        aplicarJogadaLocal(index, turnoAtual);
    }
}

function aplicarJogadaLocal(index, simbolo) {
    if (tabuleiro[index] !== "") return;
    tabuleiro[index] = simbolo;
    tocarSomJogada();
    criarTabuleiro();

    if (verificarFimDeJogo(simbolo)) { atualizarPainelEstado(); return; }

    turnoAtual = turnoAtual === simboloJ1 ? simboloJ2 : simboloJ1;

    if (modoJogo === "pvc" && turnoAtual === simboloJ2) {
        if (mensagemEl) mensagemEl.textContent = "Computador pensando...";
        setTimeout(jogadaComputador, 600);
    } else {
        atualizarMensagemTurno();
    }
    atualizarPainelEstado();
}

// ---------------- IA ----------------
function jogadaComputador() {
    if (jogoAcabou) return;
    const jogada = nivelDificuldade === "medio" ? escolherJogadaAleatoria() : encontrarMelhorJogada();
    if (jogada == null || jogada < 0) return;
    aplicarJogadaLocal(jogada, simboloJ2);
}
function escolherJogadaAleatoria() {
    const vazias = tabuleiro.map((v, i) => (v === "" ? i : null)).filter(i => i !== null);
    return vazias[Math.floor(Math.random() * vazias.length)];
}
function encontrarMelhorJogada() {
    let melhor = -Infinity, index = -1;
    for (let i = 0; i < tabuleiro.length; i++) {
        if (tabuleiro[i] === "") {
            tabuleiro[i] = simboloJ2;
            const p = minimax(tabuleiro, 0, false);
            tabuleiro[i] = "";
            if (p > melhor) { melhor = p; index = i; }
        }
    }
    return index;
}
function minimax(tab, prof, max) {
    if (verificarVitoriaEm(tab, simboloJ2)) return 10 - prof;
    if (verificarVitoriaEm(tab, simboloJ1)) return prof - 10;
    if (!tab.includes("")) return 0;
    if (max) {
        let m = -Infinity;
        for (let i = 0; i < tab.length; i++) if (tab[i] === "") {
            tab[i] = simboloJ2; m = Math.max(m, minimax(tab, prof + 1, false)); tab[i] = "";
        }
        return m;
    } else {
        let p = Infinity;
        for (let i = 0; i < tab.length; i++) if (tab[i] === "") {
            tab[i] = simboloJ1; p = Math.min(p, minimax(tab, prof + 1, true)); tab[i] = "";
        }
        return p;
    }
}
function verificarVitoriaEm(tab, jog) {
    const c = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    return c.some(x => x.every(i => tab[i] === jog));
}

// ---------------- MENSAGENS / FIM ----------------
function atualizarMensagemTurno() {
    const nome = turnoAtual === simboloJ1 ? nomeJ1 : nomeJ2;
    if (mensagemEl) mensagemEl.textContent = `Vez de ${nome} (${turnoAtual})`;
}
function encontrarCombinacaoVencedora(jog) {
    const c = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    return c.find(x => x.every(i => tabuleiro[i] === jog));
}
function destacarVitoria(comb) {
    if (!tabuleiroEl) return;
    const cels = tabuleiroEl.querySelectorAll(".celula");
    comb.forEach(i => cels[i] && cels[i].classList.add("vencedora"));
}
function iniciarConfete() {
    if (!canvasConfeteEl || !tabuleiroWrapperEl) return;
    canvasConfeteEl.width = tabuleiroWrapperEl.offsetWidth;
    canvasConfeteEl.height = tabuleiroWrapperEl.offsetHeight;
    const ctx = canvasConfeteEl.getContext("2d");
    const cores = ["#f38ba8","#a6e3a1","#89b4fa","#f9e2af","#cba6f7"];
    const ps = [];
    for (let i = 0; i < 120; i++) ps.push({
        x: Math.random()*canvasConfeteEl.width, y: -20-Math.random()*canvasConfeteEl.height,
        t: 6+Math.random()*6, c: cores[Math.floor(Math.random()*cores.length)],
        vy: 2+Math.random()*3, vx: -1+Math.random()*2, r: Math.random()*360, vr: -6+Math.random()*12
    });
    confeteAnimando = true;
    const t0 = Date.now();
    function anim() {
        ctx.clearRect(0,0,canvasConfeteEl.width,canvasConfeteEl.height);
        ps.forEach(p => {
            p.y += p.vy; p.x += p.vx; p.r += p.vr;
            ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.r*Math.PI/180);
            ctx.fillStyle = p.c; ctx.fillRect(-p.t/2,-p.t/2,p.t,p.t*0.6); ctx.restore();
        });
        if (confeteAnimando && Date.now()-t0 < 3000) requestAnimationFrame(anim);
        else ctx.clearRect(0,0,canvasConfeteEl.width,canvasConfeteEl.height);
    }
    anim();
}
function mostrarVitoria(nome) {
    if (textoVitoriaEl) textoVitoriaEl.textContent = `🎉 ${nome} VENCEU! 🎉`;
    if (overlayVitoriaEl) overlayVitoriaEl.classList.remove("escondido");
    iniciarConfete();
}
function esconderVitoria() {
    confeteAnimando = false;
    if (overlayVitoriaEl) overlayVitoriaEl.classList.add("escondido");
}
function verificarFimDeJogo(jog) {
    if (verificarVitoriaEm(tabuleiro, jog)) {
        const comb = encontrarCombinacaoVencedora(jog);
        destacarVitoria(comb);
        tocarSomVitoria();
        if (jog === simboloJ1) {
            if (mensagemEl) mensagemEl.textContent = `${nomeJ1} venceu!`;
            placar.j1++; if (placarPontos1El) placarPontos1El.textContent = placar.j1;
            mostrarVitoria(nomeJ1);
        } else {
            if (mensagemEl) mensagemEl.textContent = `${nomeJ2} venceu!`;
            placar.j2++; if (placarPontos2El) placarPontos2El.textContent = placar.j2;
            mostrarVitoria(nomeJ2);
        }
        jogoAcabou = true;
        return true;
    }
    if (!tabuleiro.includes("")) {
        if (mensagemEl) mensagemEl.textContent = "Empate!";
        tocarSomEmpate();
        placar.empate++; if (placarEmpateEl) placarEmpateEl.textContent = placar.empate;
        jogoAcabou = true;
        return true;
    }
    return false;
}

// ---------------- PARTIDA ----------------
function iniciarPartida() {
    tabuleiro = ["", "", "", "", "", "", "", "", ""];
    jogoAcabou = false;
    turnoAtual = quemComeca;
    esconderVitoria();
    criarTabuleiro();
    atualizarPainelEstado();
    if (modoJogo === "pvc" && turnoAtual === simboloJ2) {
        if (mensagemEl) mensagemEl.textContent = "Computador começa...";
        setTimeout(jogadaComputador, 600);
    } else {
        atualizarMensagemTurno();
    }
}
function reiniciarPartidaLocal() {
    quemComeca = quemComeca === simboloJ1 ? simboloJ2 : simboloJ1;
    iniciarPartida();
    if (multiplayerAtivo && isHost) {
        versaoEstado++;
        enviarEstadoAtual();
    }
}
if (botaoReiniciar) botaoReiniciar.addEventListener("click", () => {
    if (multiplayerAtivo) {
        if (isHost) reiniciarPartidaLocal();
        else if (conn && conn.open) conn.send({ tipo: "reiniciar" });
    } else {
        quemComeca = quemComeca === simboloJ1 ? simboloJ2 : simboloJ1;
        iniciarPartida();
    }
});
