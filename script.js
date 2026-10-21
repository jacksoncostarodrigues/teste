// ============================================================
// JOGO DA VELHA — script.js COMPLETO
// Modos: PVC (contra computador), PvP (local), Online (PeerJS/VR)
// ============================================================

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

function tocarTom(frequencia, duracao, tipoOnda = "sine") {
    const oscilador = audioContext.createOscillator();
    const ganho = audioContext.createGain();
    oscilador.type = tipoOnda;
    oscilador.frequency.value = frequencia;
    ganho.gain.setValueAtTime(0.2, audioContext.currentTime);
    ganho.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duracao);
    oscilador.connect(ganho);
    ganho.connect(audioContext.destination);
    oscilador.start();
    oscilador.stop(audioContext.currentTime + duracao);
}

function tocarSomJogada() { tocarTom(440, 0.1); }
function tocarSomVitoria() {
    tocarTom(523, 0.15);
    setTimeout(() => tocarTom(659, 0.15), 150);
    setTimeout(() => tocarTom(784, 0.25), 300);
}
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
    [telaMenu, telaNivel, telaConfig, telaJogo, telaOnline].forEach(t => {
        if (t) t.classList.add("escondido");
    });
    if (tela) tela.classList.remove("escondido");
}

if (btnEscolherPvc) btnEscolherPvc.addEventListener("click", () => {
    modoJogo = "pvc";
    mostrarTela(telaNivel);
});

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
    const valor1 = inputNome1 ? inputNome1.value.trim() : "";
    nomeJ1 = valor1 === "" ? "Jogador 1" : valor1;

    if (modoJogo === "pvp") {
        const valor2 = inputNome2 ? inputNome2.value.trim() : "";
        nomeJ2 = valor2 === "" ? "Jogador 2" : valor2;
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

if (botaoVoltarMenu) botaoVoltarMenu.addEventListener("click", () => {
    esconderVitoria();
    mostrarTela(telaMenu);
});

// ---------------- REDE / MULTIPLAYER ----------------
let peer = null;
let conn = null;
let isHost = false;
let salaId = null;
let multiplayerAtivo = false;
let conexaoEstabelecida = false;

// --- Código curto de sala ---
const CARACTERES_SALA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem 0/O/1/I/l
const TAMANHO_CODIGO  = 6;
const PREFIXO_PEER    = "jdv-vr-";

// --- Configuração de rede (STUN/TURN) ---
// Os STUN públicos ajudam o WebRTC a descobrir o endereço externo dos dois
// dispositivos. Em redes muito restritivas, seria necessário um servidor TURN.
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
    let codigo = "";
    for (let i = 0; i < TAMANHO_CODIGO; i++) {
        codigo += CARACTERES_SALA[Math.floor(Math.random() * CARACTERES_SALA.length)];
    }
    return codigo;
}

function normalizarCodigo(codigo) {
    return (codigo || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

// Configura o input do código de sala (UX)
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
    if (conn) { try { conn.close(); } catch (e) {} conn = null; }
    if (peer) { try { peer.destroy(); } catch (e) {} peer = null; }
    multiplayerAtivo = false;
    isHost = false;
    conexaoEstabelecida = false;
}

if (btnJogarOnline) btnJogarOnline.addEventListener("click", () => {
    destruirConexao();
    if (salaInfo) salaInfo.classList.add("escondido");
    if (statusConexaoEl) statusConexaoEl.textContent = "Aguardando conexão...";
    mostrarTela(telaOnline);
});

if (btnVoltarMenuOnline) btnVoltarMenuOnline.addEventListener("click", () => {
    destruirConexao();
    mostrarTela(telaMenu);
});

if (btnCriarSala) btnCriarSala.addEventListener("click", () => {
    if (salaInfo) salaInfo.classList.remove("escondido");
    iniciarHost();
});

if (btnEntrarSala) btnEntrarSala.addEventListener("click", () => {
    const id = inputIdSala ? inputIdSala.value : "";
    entrarNaSala(id);
});

function iniciarHost(tentativa = 0) {
    if (typeof Peer === "undefined") {
        if (statusConexaoEl) statusConexaoEl.textContent = "PeerJS não carregou. Verifique a conexão.";
        return;
    }

    const codigo = gerarCodigoSala();
    const peerId = PREFIXO_PEER + codigo;

    peer = new Peer(peerId, { config: CONFIG_ICE });

    peer.on("open", () => {
        salaId = codigo;
        isHost = true;
        if (meuIdSalaEl) meuIdSalaEl.textContent = codigo;
        if (statusConexaoEl) statusConexaoEl.textContent = "Aguardando conexão...";

        peer.on("connection", (connection) => {
            conn = connection;
            configurarConexao(conn);
            if (statusConexaoEl) statusConexaoEl.textContent = "Conectando...";

            // Inicia o jogo somente quando a conexão estiver realmente aberta
            conn.on("open", () => {
                conexaoEstabelecida = true;
                multiplayerAtivo = true;
                modoJogo = "pvp";
                nomeJ1 = "Host (X)";
                nomeJ2 = "Convidado (O)";
                quemComeca = simboloJ1;
                placar = { j1: 0, empate: 0, j2: 0 };
                mostrarTela(telaJogo);
                iniciarPartida();
                enviarEstadoInicial();
                if (statusConexaoEl) statusConexaoEl.textContent = "Conectado!";
            });
        });
    });

    peer.on("error", (err) => {
        console.error("Erro PeerJS (Host):", err);
        // Código já em uso por outra pessoa: tenta outro automaticamente
        if (err.type === "unavailable-id" && tentativa < 5) {
            try { peer.destroy(); } catch (e) {}
            peer = null;
            if (statusConexaoEl) statusConexaoEl.textContent = "Gerando novo código...";
            setTimeout(() => iniciarHost(tentativa + 1), 300);
            return;
        }
        if (statusConexaoEl) statusConexaoEl.textContent = "Erro: " + (err.type || err);
    });
}

function entrarNaSala(codigoDigitado) {
    if (typeof Peer === "undefined") {
        if (statusConexaoEl) statusConexaoEl.textContent = "PeerJS não carregou. Verifique a conexão.";
        return;
    }

    const codigo = normalizarCodigo(codigoDigitado);
    if (codigo.length !== TAMANHO_CODIGO) {
        alert(`O código deve ter ${TAMANHO_CODIGO} caracteres (letras e números).`);
        return;
    }

    const peerId = PREFIXO_PEER + codigo;
    peer = new Peer({ config: CONFIG_ICE });

    if (statusConexaoEl) statusConexaoEl.textContent = "Conectando ao host...";

    peer.on("open", () => {
        conn = peer.connect(peerId, { reliable: true });

        configurarConexao(conn);

        conn.on("open", () => {
            isHost = false;
            conexaoEstabelecida = true;
            if (statusConexaoEl) statusConexaoEl.textContent = "Conectado ao host!";
        });
    });

    peer.on("error", (err) => {
        console.error("Erro PeerJS (Cliente):", err);
        if (err.type === "peer-unavailable") {
            if (statusConexaoEl) statusConexaoEl.textContent = "Código não encontrado. Confira com o host.";
        } else {
            if (statusConexaoEl) statusConexaoEl.textContent = "Erro: " + (err.type || err);
        }
    });
}

function configurarConexao(connection) {
    connection.on("data", (data) => {
        if (!data || !data.tipo) return;

        if (data.tipo === "estado_inicial") {
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

        } else if (data.tipo === "jogada") {
            if (isHost) {
                if (tabuleiro[data.index] === "" && !jogoAcabou && data.simbolo === turnoAtual) {
                    aplicarJogada(data.index, data.simbolo);
                    if (conn && conn.open) {
                        conn.send({ tipo: "jogada_confirmada", index: data.index, simbolo: data.simbolo });
                    }
                }
            }

        } else if (data.tipo === "jogada_confirmada") {
            if (!isHost) {
                aplicarJogada(data.index, data.simbolo);
            }

        } else if (data.tipo === "reiniciar") {
            if (isHost) reiniciarPartidaLocal();
        }
    });

    connection.on("close", () => {
        if (statusConexaoEl) statusConexaoEl.textContent = "Conexão encerrada.";
        multiplayerAtivo = false;
        conexaoEstabelecida = false;
    });

    connection.on("error", (err) => {
        console.error("Erro na conexão:", err);
        if (statusConexaoEl) statusConexaoEl.textContent = "Erro na conexão.";
    });
}

function enviarEstadoInicial() {
    if (!conn || !conn.open) return;
    conn.send({
        tipo: "estado_inicial",
        tabuleiro: tabuleiro.slice(),
        turnoAtual: turnoAtual,
        quemComeca: quemComeca,
        jogoAcabou: jogoAcabou,
        nomes: { j1: nomeJ1, j2: nomeJ2 },
        placar: { ...placar }
    });
}

function atualizarInterfaceCompleta() {
    if (placarNome1El) placarNome1El.textContent = nomeJ1;
    if (placarNome2El) placarNome2El.textContent = nomeJ2;
    if (placarPontos1El) placarPontos1El.textContent = placar.j1;
    if (placarEmpateEl)  placarEmpateEl.textContent  = placar.empate;
    if (placarPontos2El) placarPontos2El.textContent = placar.j2;
    criarTabuleiro();
    atualizarMensagemTurno();
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
            // No online, cada um só pode jogar o próprio símbolo
            if (turnoAtual !== simboloJ1) return;
            aplicarJogada(index, turnoAtual);
            if (conn && conn.open) {
                conn.send({ tipo: "jogada_confirmada", index: index, simbolo: turnoAtual });
            }
        } else {
            // Convidado joga como O
            if (turnoAtual !== simboloJ2) return;
            if (conn && conn.open) {
                conn.send({ tipo: "jogada", index: index, simbolo: turnoAtual });
            }
        }
    } else {
        aplicarJogada(index, turnoAtual);
    }
}

function aplicarJogada(index, simbolo) {
    if (tabuleiro[index] !== "") return;
    tabuleiro[index] = simbolo;
    tocarSomJogada();
    criarTabuleiro();

    if (verificarFimDeJogo(simbolo)) return;

    turnoAtual = turnoAtual === simboloJ1 ? simboloJ2 : simboloJ1;

    if (modoJogo === "pvc" && turnoAtual === simboloJ2) {
        if (mensagemEl) mensagemEl.textContent = "Computador pensando...";
        setTimeout(jogadaComputador, 600);
    } else {
        atualizarMensagemTurno();
    }
}

// ---------------- IA ----------------
function jogadaComputador() {
    if (jogoAcabou) return;
    const jogada = nivelDificuldade === "medio"
        ? escolherJogadaAleatoria()
        : encontrarMelhorJogada();

    if (jogada == null || jogada < 0) return;
    aplicarJogada(jogada, simboloJ2);
}

function escolherJogadaAleatoria() {
    const vazias = tabuleiro
        .map((v, i) => (v === "" ? i : null))
        .filter(i => i !== null);
    return vazias[Math.floor(Math.random() * vazias.length)];
}

function encontrarMelhorJogada() {
    let melhorPontuacao = -Infinity;
    let melhorIndex = -1;
    for (let i = 0; i < tabuleiro.length; i++) {
        if (tabuleiro[i] === "") {
            tabuleiro[i] = simboloJ2;
            const p = minimax(tabuleiro, 0, false);
            tabuleiro[i] = "";
            if (p > melhorPontuacao) {
                melhorPontuacao = p;
                melhorIndex = i;
            }
        }
    }
    return melhorIndex;
}

function minimax(tab, profundidade, estaMaximizando) {
    if (verificarVitoriaEm(tab, simboloJ2)) return 10 - profundidade;
    if (verificarVitoriaEm(tab, simboloJ1)) return profundidade - 10;
    if (!tab.includes("")) return 0;

    if (estaMaximizando) {
        let melhor = -Infinity;
        for (let i = 0; i < tab.length; i++) {
            if (tab[i] === "") {
                tab[i] = simboloJ2;
                melhor = Math.max(melhor, minimax(tab, profundidade + 1, false));
                tab[i] = "";
            }
        }
        return melhor;
    } else {
        let pior = Infinity;
        for (let i = 0; i < tab.length; i++) {
            if (tab[i] === "") {
                tab[i] = simboloJ1;
                pior = Math.min(pior, minimax(tab, profundidade + 1, true));
                tab[i] = "";
            }
        }
        return pior;
    }
}

function verificarVitoriaEm(tab, jogador) {
    const combos = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    return combos.some(c => c.every(i => tab[i] === jogador));
}

// ---------------- MENSAGENS / FIM ----------------
function atualizarMensagemTurno() {
    const nome = turnoAtual === simboloJ1 ? nomeJ1 : nomeJ2;
    if (mensagemEl) mensagemEl.textContent = `Vez de ${nome} (${turnoAtual})`;
}

function encontrarCombinacaoVencedora(jogador) {
    const combos = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    return combos.find(c => c.every(i => tabuleiro[i] === jogador));
}

function destacarVitoria(combinacao) {
    if (!tabuleiroEl) return;
    const celulas = tabuleiroEl.querySelectorAll(".celula");
    combinacao.forEach(i => {
        if (celulas[i]) celulas[i].classList.add("vencedora");
    });
}

function iniciarConfete() {
    if (!canvasConfeteEl || !tabuleiroWrapperEl) return;
    canvasConfeteEl.width = tabuleiroWrapperEl.offsetWidth;
    canvasConfeteEl.height = tabuleiroWrapperEl.offsetHeight;
    const ctx = canvasConfeteEl.getContext("2d");
    const cores = ["#f38ba8", "#a6e3a1", "#89b4fa", "#f9e2af", "#cba6f7"];
    const particulas = [];
    for (let i = 0; i < 120; i++) {
        particulas.push({
            x: Math.random() * canvasConfeteEl.width,
            y: -20 - Math.random() * canvasConfeteEl.height,
            tamanho: 6 + Math.random() * 6,
            cor: cores[Math.floor(Math.random() * cores.length)],
            velocidadeY: 2 + Math.random() * 3,
            velocidadeX: -1 + Math.random() * 2,
            rotacao: Math.random() * 360,
            velocidadeRotacao: -6 + Math.random() * 12
        });
    }
    confeteAnimando = true;
    const t0 = Date.now();
    function animar() {
        ctx.clearRect(0, 0, canvasConfeteEl.width, canvasConfeteEl.height);
        particulas.forEach(p => {
            p.y += p.velocidadeY;
            p.x += p.velocidadeX;
            p.rotacao += p.velocidadeRotacao;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotacao * Math.PI) / 180);
            ctx.fillStyle = p.cor;
            ctx.fillRect(-p.tamanho / 2, -p.tamanho / 2, p.tamanho, p.tamanho * 0.6);
            ctx.restore();
        });
        if (confeteAnimando && Date.now() - t0 < 3000) {
            requestAnimationFrame(animar);
        } else {
            ctx.clearRect(0, 0, canvasConfeteEl.width, canvasConfeteEl.height);
        }
    }
    animar();
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

function verificarFimDeJogo(jogador) {
    if (verificarVitoria(jogador)) {
        const comb = encontrarCombinacaoVencedora(jogador);
        destacarVitoria(comb);
        tocarSomVitoria();
        if (jogador === simboloJ1) {
            if (mensagemEl) mensagemEl.textContent = `${nomeJ1} venceu!`;
            placar.j1++;
            if (placarPontos1El) placarPontos1El.textContent = placar.j1;
            mostrarVitoria(nomeJ1);
        } else {
            if (mensagemEl) mensagemEl.textContent = `${nomeJ2} venceu!`;
            placar.j2++;
            if (placarPontos2El) placarPontos2El.textContent = placar.j2;
            mostrarVitoria(nomeJ2);
        }
        jogoAcabou = true;
        return true;
    }
    if (!tabuleiro.includes("")) {
        if (mensagemEl) mensagemEl.textContent = "Empate!";
        tocarSomEmpate();
        placar.empate++;
        if (placarEmpateEl) placarEmpateEl.textContent = placar.empate;
        jogoAcabou = true;
        return true;
    }
    return false;
}

function verificarVitoria(jogador) {
    return verificarVitoriaEm(tabuleiro, jogador);
}

// ---------------- PARTIDA ----------------
function iniciarPartida() {
    tabuleiro = ["", "", "", "", "", "", "", "", ""];
    jogoAcabou = false;
    turnoAtual = quemComeca;
    esconderVitoria();
    criarTabuleiro();

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
        setTimeout(() => enviarEstadoInicial(), 100);
    }
}

if (botaoReiniciar) botaoReiniciar.addEventListener("click", () => {
    if (multiplayerAtivo) {
        if (isHost) {
            reiniciarPartidaLocal();
        } else if (conn && conn.open) {
            conn.send({ tipo: "reiniciar" });
        }
    } else {
        quemComeca = quemComeca === simboloJ1 ? simboloJ2 : simboloJ1;
        iniciarPartida();
    }
});
