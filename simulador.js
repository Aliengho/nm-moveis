// ============================================================
// SIMULADOR 3D — protótipo de casa com várias divisões
// Usa Three.js (CDN) — sem build, sem servidor.
// ============================================================

(function () {
  "use strict";

  const contentor = document.getElementById("simCanvas");
  if (!contentor || typeof THREE === "undefined") return;

  // --------------------------------------------------------------
  // Catálogo de módulos genéricos (medidas aproximadas, em metros)
  // --------------------------------------------------------------

  const CATALOGO = {
    sofa: { nome: "Sofá", divisoes: ["sala"], largura: 1.9, profundidade: 0.85, altura: 0.8, cor: 0x7a5a3a, icone: "sofa" },
    cadeira: { nome: "Cadeira", divisoes: ["sala", "cozinha"], largura: 0.5, profundidade: 0.5, altura: 0.85, cor: 0x9c7748, icone: "cadeira" },
    mesaCentro: { nome: "Mesa de centro", divisoes: ["sala"], largura: 0.9, profundidade: 0.5, altura: 0.4, cor: 0x8a6a42, icone: "mesa" },
    estante: { nome: "Estante", divisoes: ["sala", "quarto"], largura: 0.9, profundidade: 0.3, altura: 1.8, cor: 0x8a6a42, icone: "estante" },
    painel: { nome: "Painel decorativo", divisoes: ["sala", "quarto"], largura: 1.5, profundidade: 0.05, altura: 2.4, cor: 0xc79a5a, icone: "painel" },
    garrafeira: { nome: "Garrafeira", divisoes: ["sala", "cozinha"], largura: 0.8, profundidade: 0.35, altura: 1.4, cor: 0x5c3d24, icone: "garrafeira" },

    roupeiro: { nome: "Roupeiro", divisoes: ["quarto"], largura: 1.2, profundidade: 0.6, altura: 2.0, cor: 0xa9713f, icone: "roupeiro" },
    cama: { nome: "Cama", divisoes: ["quarto"], largura: 1.6, profundidade: 2.0, altura: 0.55, cor: 0x9c7748, icone: "cama" },
    criadoMudo: { nome: "Mesa de cabeceira", divisoes: ["quarto"], largura: 0.45, profundidade: 0.4, altura: 0.55, cor: 0x8a6a42, icone: "criado" },

    cozinha: { nome: "Bancada de cozinha", divisoes: ["cozinha"], largura: 2.4, profundidade: 0.6, altura: 0.9, cor: 0x6b4423, icone: "cozinha" },
    armarioSuperior: { nome: "Armário superior", divisoes: ["cozinha"], largura: 2.0, profundidade: 0.35, altura: 0.7, cor: 0x6b4423, icone: "armario" },
    mesa: { nome: "Mesa", divisoes: ["cozinha", "sala"], largura: 1.4, profundidade: 0.8, altura: 0.75, cor: 0x9c7748, icone: "mesa" },

    lavatorio: { nome: "Lavatório", divisoes: ["banho"], largura: 0.8, profundidade: 0.45, altura: 0.85, cor: 0xdcd3c0, icone: "lavatorio" },
    armarioBanho: { nome: "Armário de espelho", divisoes: ["banho"], largura: 0.7, profundidade: 0.15, altura: 0.6, cor: 0x8a6a42, icone: "armario" },
  };

  const COR_SELECIONADO = 0xffffff;

  // --------------------------------------------------------------
  // Planta da casa — divisões fixas (x, z = canto inferior esquerdo)
  // --------------------------------------------------------------

  const CORREDOR = 0.25;

  const DIVISOES = [
    { id: "sala", nome: "Sala", largura: 4.6, profundidade: 3.6, x: 0, z: 0 },
    { id: "quarto", nome: "Quarto", largura: 3.6, profundidade: 3.6, x: 4.6 + CORREDOR, z: 0 },
    { id: "cozinha", nome: "Cozinha", largura: 3.2, profundidade: 3, x: 0, z: 3.6 + CORREDOR },
    { id: "banho", nome: "Casa de banho", largura: 2.2, profundidade: 2.2, x: 3.2 + CORREDOR, z: 3.6 + CORREDOR },
  ];

  function divisaoPorId(id) {
    return DIVISOES.find((d) => d.id === id) || DIVISOES[0];
  }

  function divisaoNoPonto(x, z) {
    return (
      DIVISOES.find((d) => x >= d.x && x <= d.x + d.largura && z >= d.z && z <= d.z + d.profundidade) || DIVISOES[0]
    );
  }

  const CASA = {
    minX: Math.min(...DIVISOES.map((d) => d.x)),
    maxX: Math.max(...DIVISOES.map((d) => d.x + d.largura)),
    minZ: Math.min(...DIVISOES.map((d) => d.z)),
    maxZ: Math.max(...DIVISOES.map((d) => d.z + d.profundidade)),
  };
  CASA.largura = CASA.maxX - CASA.minX;
  CASA.profundidade = CASA.maxZ - CASA.minZ;
  CASA.centroX = (CASA.minX + CASA.maxX) / 2;
  CASA.centroZ = (CASA.minZ + CASA.maxZ) / 2;

  // --------------------------------------------------------------
  // Estado
  // --------------------------------------------------------------

  let modulos = []; // { id, tipo, grupo, largura, profundidade, altura, divisaoId }
  let selecionadoId = null;
  let proximoId = 1;

  // --------------------------------------------------------------
  // Cena, câmara, luz
  // --------------------------------------------------------------

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe9e2d4);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);

  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  contentor.appendChild(renderer.domElement);

  const luzAmbiente = new THREE.HemisphereLight(0xfff4e0, 0x3a2f22, 0.9);
  scene.add(luzAmbiente);

  const luzDirecional = new THREE.DirectionalLight(0xfff0da, 1.0);
  luzDirecional.position.set(CASA.centroX + 6, 9, CASA.centroZ + 4);
  luzDirecional.castShadow = true;
  luzDirecional.shadow.mapSize.set(2048, 2048);
  luzDirecional.shadow.bias = -0.0015;
  luzDirecional.target.position.set(CASA.centroX, 0, CASA.centroZ);
  scene.add(luzDirecional.target);
  scene.add(luzDirecional);

  const alcanceSombra = Math.max(CASA.largura, CASA.profundidade) / 2 + 2;
  luzDirecional.shadow.camera.left = -alcanceSombra;
  luzDirecional.shadow.camera.right = alcanceSombra;
  luzDirecional.shadow.camera.top = alcanceSombra;
  luzDirecional.shadow.camera.bottom = -alcanceSombra;
  luzDirecional.shadow.camera.near = 0.5;
  luzDirecional.shadow.camera.far = 30;
  luzDirecional.shadow.camera.updateProjectionMatrix();

  const luzPreenchimento = new THREE.DirectionalLight(0xdce8ff, 0.22);
  luzPreenchimento.position.set(CASA.centroX - 4, 4, CASA.centroZ - 3);
  scene.add(luzPreenchimento);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI / 2 - 0.03;
  controls.minDistance = 2;
  controls.maxDistance = Math.max(CASA.largura, CASA.profundidade) * 1.8;

  function posicionarCamara() {
    camera.position.set(
      CASA.centroX + CASA.largura * 0.75,
      Math.max(CASA.largura, CASA.profundidade) * 0.85,
      CASA.centroZ + CASA.profundidade * 0.95
    );
    controls.target.set(CASA.centroX, 0.6, CASA.centroZ);
    controls.update();
  }

  let modoPlanta = false;
  const btnVista = document.getElementById("simViewToggle");

  function alternarVista() {
    modoPlanta = !modoPlanta;

    if (modoPlanta) {
      controls.minPolarAngle = 0;
      controls.maxPolarAngle = 0.001;
      const altura = Math.max(CASA.largura, CASA.profundidade) * 1.15;
      camera.position.set(CASA.centroX, altura, CASA.centroZ + 0.0001);
      controls.target.set(CASA.centroX, 0, CASA.centroZ);
      btnVista.textContent = "Vista 3D";
      btnVista.classList.add("ativo");
    } else {
      controls.minPolarAngle = 0;
      controls.maxPolarAngle = Math.PI / 2 - 0.03;
      posicionarCamara();
      btnVista.textContent = "Vista de cima (2D)";
      btnVista.classList.remove("ativo");
    }
    controls.update();
  }

  btnVista.addEventListener("click", alternarVista);

  document.getElementById("simExportImg").addEventListener("click", () => {
    renderer.render(scene, camera);
    const url = renderer.domElement.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "simulador-nm-moveis.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
  });

  // --------------------------------------------------------------
  // Rótulos de texto (canvas → sprite)
  // --------------------------------------------------------------

  function criarRotulo(texto) {
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 72;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "rgba(23,20,15,0.82)";
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(0, 0, canvas.width, canvas.height, 12);
      ctx.fill();
    } else {
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.font = "600 32px Inter, -apple-system, sans-serif";
    ctx.fillStyle = "#F2EEE6";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(texto, canvas.width / 2, canvas.height / 2 + 2);

    const textura = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: textura, depthTest: false, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(1.5, 0.36, 1);
    sprite.renderOrder = 999;
    return sprite;
  }

  // --------------------------------------------------------------
  // Construção da casa (piso + paredes + rótulo, por divisão)
  // --------------------------------------------------------------

  const grupoCasa = new THREE.Group();
  scene.add(grupoCasa);
  const paredesPorDivisao = {};

  function construirCasa() {
    grupoCasa.clear();

    const matPiso = new THREE.MeshStandardMaterial({ color: 0xd7cbb4, roughness: 0.95 });
    const matParede = new THREE.MeshStandardMaterial({ color: 0xf2eee6, roughness: 0.98, side: THREE.DoubleSide });
    const alturaParede = 2.6;

    DIVISOES.forEach((div) => {
      const cx = div.x + div.largura / 2;
      const cz = div.z + div.profundidade / 2;

      const piso = new THREE.Mesh(new THREE.PlaneGeometry(div.largura, div.profundidade), matPiso);
      piso.rotation.x = -Math.PI / 2;
      piso.position.set(cx, 0, cz);
      piso.receiveShadow = true;
      grupoCasa.add(piso);

      const grade = new THREE.GridHelper(Math.max(div.largura, div.profundidade) * 1.4, Math.round(Math.max(div.largura, div.profundidade) * 2), 0xb9ac8e, 0xcfc3a8);
      grade.position.set(cx, 0.002, cz);
      grupoCasa.add(grade);

      const paredeFundo = new THREE.Mesh(new THREE.PlaneGeometry(div.largura, alturaParede), matParede);
      paredeFundo.position.set(cx, alturaParede / 2, div.z);
      paredeFundo.receiveShadow = true;
      grupoCasa.add(paredeFundo);

      const paredeFrente = new THREE.Mesh(new THREE.PlaneGeometry(div.largura, alturaParede), matParede);
      paredeFrente.position.set(cx, alturaParede / 2, div.z + div.profundidade);
      paredeFrente.rotation.y = Math.PI;
      paredeFrente.receiveShadow = true;
      grupoCasa.add(paredeFrente);

      const paredeEsquerda = new THREE.Mesh(new THREE.PlaneGeometry(div.profundidade, alturaParede), matParede);
      paredeEsquerda.rotation.y = Math.PI / 2;
      paredeEsquerda.position.set(div.x, alturaParede / 2, cz);
      paredeEsquerda.receiveShadow = true;
      grupoCasa.add(paredeEsquerda);

      const paredeDireita = new THREE.Mesh(new THREE.PlaneGeometry(div.profundidade, alturaParede), matParede);
      paredeDireita.rotation.y = -Math.PI / 2;
      paredeDireita.position.set(div.x + div.largura, alturaParede / 2, cz);
      paredeDireita.receiveShadow = true;
      grupoCasa.add(paredeDireita);

      paredesPorDivisao[div.id] = { fundo: paredeFundo, frente: paredeFrente, esquerda: paredeEsquerda, direita: paredeDireita, div };

      const rotulo = criarRotulo(div.nome);
      rotulo.position.set(cx, alturaParede + 0.25, cz);
      grupoCasa.add(rotulo);
    });
  }

  function atualizarVisibilidadeParedes() {
    const folga = 0.15;
    Object.values(paredesPorDivisao).forEach(({ fundo, frente, esquerda, direita, div }) => {
      fundo.visible = camera.position.z > div.z + folga;
      frente.visible = camera.position.z < div.z + div.profundidade - folga;
      esquerda.visible = camera.position.x > div.x + folga;
      direita.visible = camera.position.x < div.x + div.largura - folga;
    });
  }

  // --------------------------------------------------------------
  // Texturas de madeira (geradas por canvas — sem imagens externas)
  // --------------------------------------------------------------

  function corCSS(numero) {
    return "#" + new THREE.Color(numero).getHexString();
  }

  function ajustarCorNumero(numero, delta) {
    const cor = new THREE.Color(numero);
    cor.r = Math.min(1, Math.max(0, cor.r + delta));
    cor.g = Math.min(1, Math.max(0, cor.g + delta));
    cor.b = Math.min(1, Math.max(0, cor.b + delta));
    return cor.getHex();
  }

  function criarTexturaMadeira(corNumero) {
    const tam = 128;
    const canvas = document.createElement("canvas");
    canvas.width = tam;
    canvas.height = tam;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = corCSS(corNumero);
    ctx.fillRect(0, 0, tam, tam);

    const escuro = corCSS(ajustarCorNumero(corNumero, -0.14));
    const claro = corCSS(ajustarCorNumero(corNumero, 0.12));

    for (let i = 0; i < 14; i++) {
      const y = (i / 14) * tam + (Math.random() - 0.5) * 5;
      ctx.strokeStyle = i % 2 === 0 ? escuro : claro;
      ctx.globalAlpha = 0.14 + Math.random() * 0.1;
      ctx.lineWidth = 1 + Math.random() * 1.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= tam; x += 10) {
        ctx.lineTo(x, y + Math.sin(x * 0.09 + i) * 3);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    const textura = new THREE.CanvasTexture(canvas);
    textura.wrapS = THREE.RepeatWrapping;
    textura.wrapT = THREE.RepeatWrapping;
    return textura;
  }

  function materialMadeira(corNumero, repeatX, repeatY) {
    const textura = criarTexturaMadeira(corNumero);
    textura.repeat.set(repeatX || 1, repeatY || 1);
    return new THREE.MeshStandardMaterial({ map: textura, roughness: 0.8, metalness: 0.04 });
  }

  // --------------------------------------------------------------
  // Construtores de mobiliário (formas compostas, não caixas simples)
  // Cada função devolve um Group cuja origem local é o centro da
  // base (x=0, z=0, y=0 ao nível do chão).
  // --------------------------------------------------------------

  function construirRoupeiro(info) {
    const grupo = new THREE.Group();

    const matCorpo = materialMadeira(info.cor, 1, 1);
    const matPorta = materialMadeira(ajustarCorNumero(info.cor, 0.05), 1, 1);
    const matBase = new THREE.MeshStandardMaterial({ color: 0x2b241a, roughness: 0.9 });
    const matMetal = new THREE.MeshStandardMaterial({ color: 0xcfcfcf, roughness: 0.3, metalness: 0.7 });

    const alturaPlinto = 0.09;
    const alturaCornija = 0.05;
    const alturaCorpo = Math.max(info.altura - alturaPlinto - alturaCornija, 0.3);

    const plinto = new THREE.Mesh(new THREE.BoxGeometry(info.largura * 0.95, alturaPlinto, info.profundidade * 0.9), matBase);
    plinto.position.set(0, alturaPlinto / 2, 0);
    grupo.add(plinto);

    const corpo = new THREE.Mesh(new THREE.BoxGeometry(info.largura, alturaCorpo, info.profundidade), matCorpo);
    corpo.position.set(0, alturaPlinto + alturaCorpo / 2, 0);
    grupo.add(corpo);

    const cornija = new THREE.Mesh(new THREE.BoxGeometry(info.largura * 1.02, alturaCornija, info.profundidade * 1.05), matCorpo);
    cornija.position.set(0, alturaPlinto + alturaCorpo + alturaCornija / 2, 0);
    grupo.add(cornija);

    const zFrente = info.profundidade / 2 + 0.008;
    const larguraPorta = info.largura / 2 - 0.015;
    const alturaPorta = alturaCorpo - 0.05;

    [-1, 1].forEach((lado) => {
      const porta = new THREE.Mesh(new THREE.BoxGeometry(larguraPorta, alturaPorta, 0.016), matPorta);
      porta.position.set(lado * (larguraPorta / 2 + 0.008), alturaPlinto + alturaCorpo / 2, zFrente);
      grupo.add(porta);

      const puxador = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, alturaPorta * 0.28, 8), matMetal);
      puxador.position.set(lado * 0.03, alturaPlinto + alturaCorpo / 2, zFrente + 0.016);
      grupo.add(puxador);
    });

    return grupo;
  }

  function construirCozinha(info) {
    const grupo = new THREE.Group();

    const matCorpo = materialMadeira(info.cor, 1.4, 1);
    const matPorta = materialMadeira(ajustarCorNumero(info.cor, 0.05), 1, 1);
    const matBancada = new THREE.MeshStandardMaterial({ color: 0xeae3d6, roughness: 0.3, metalness: 0.05 });
    const matMetal = new THREE.MeshStandardMaterial({ color: 0xcfcfcf, roughness: 0.3, metalness: 0.7 });

    const alturaPlinto = 0.08;
    const alturaBancada = 0.04;
    const alturaCorpo = Math.max(info.altura - alturaPlinto - alturaBancada, 0.3);

    const plinto = new THREE.Mesh(
      new THREE.BoxGeometry(info.largura * 0.97, alturaPlinto, info.profundidade * 0.85),
      new THREE.MeshStandardMaterial({ color: 0x2b241a, roughness: 0.9 })
    );
    plinto.position.set(0, alturaPlinto / 2, -info.profundidade * 0.02);
    grupo.add(plinto);

    const corpo = new THREE.Mesh(new THREE.BoxGeometry(info.largura, alturaCorpo, info.profundidade), matCorpo);
    corpo.position.set(0, alturaPlinto + alturaCorpo / 2, 0);
    grupo.add(corpo);

    const bancada = new THREE.Mesh(new THREE.BoxGeometry(info.largura * 1.03, alturaBancada, info.profundidade * 1.08), matBancada);
    bancada.position.set(0, alturaPlinto + alturaCorpo + alturaBancada / 2, 0);
    grupo.add(bancada);

    const nModulos = Math.max(2, Math.round(info.largura / 0.6));
    const larguraModulo = info.largura / nModulos;
    const zFrente = info.profundidade / 2 + 0.008;
    const indiceGaveta = Math.floor(nModulos / 2);

    for (let i = 0; i < nModulos; i++) {
      const x = -info.largura / 2 + larguraModulo * (i + 0.5);

      if (i === indiceGaveta) {
        const gaveta = new THREE.Mesh(new THREE.BoxGeometry(larguraModulo - 0.02, alturaCorpo * 0.28, 0.016), matPorta);
        gaveta.position.set(x, alturaPlinto + alturaCorpo - alturaCorpo * 0.14, zFrente);
        grupo.add(gaveta);

        const puxador = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, larguraModulo * 0.5, 6), matMetal);
        puxador.rotation.z = Math.PI / 2;
        puxador.position.set(x, alturaPlinto + alturaCorpo - alturaCorpo * 0.14, zFrente + 0.014);
        grupo.add(puxador);
      } else {
        const porta = new THREE.Mesh(new THREE.BoxGeometry(larguraModulo - 0.02, alturaCorpo - 0.04, 0.016), matPorta);
        porta.position.set(x, alturaPlinto + alturaCorpo / 2, zFrente);
        grupo.add(porta);

        const lado = x < 0 ? 1 : -1;
        const puxador = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.16, 6), matMetal);
        puxador.rotation.z = Math.PI / 2;
        puxador.position.set(x + lado * (larguraModulo / 2 - 0.04), alturaPlinto + alturaCorpo / 2, zFrente + 0.014);
        grupo.add(puxador);
      }
    }

    return grupo;
  }

  function construirPainel(info) {
    const grupo = new THREE.Group();

    const matFundo = materialMadeira(ajustarCorNumero(info.cor, -0.05), 1, 1);
    const matRipa = materialMadeira(info.cor, 1, 3);

    const fundo = new THREE.Mesh(new THREE.BoxGeometry(info.largura, info.altura, info.profundidade), matFundo);
    fundo.position.set(0, info.altura / 2, 0);
    grupo.add(fundo);

    const nRipas = Math.max(6, Math.round(info.largura / 0.09));
    const larguraRipa = info.largura / nRipas;
    const zFrente = info.profundidade / 2 + 0.012;

    for (let i = 0; i < nRipas; i++) {
      const x = -info.largura / 2 + larguraRipa * (i + 0.5);
      const ripa = new THREE.Mesh(new THREE.BoxGeometry(larguraRipa * 0.62, info.altura * 0.97, 0.024), matRipa);
      ripa.position.set(x, info.altura / 2, zFrente);
      grupo.add(ripa);
    }

    return grupo;
  }

  function construirEstante(info) {
    const grupo = new THREE.Group();
    const matCorpo = materialMadeira(info.cor, 1, 1);
    const espessura = 0.02;

    [-1, 1].forEach((lado) => {
      const lateral = new THREE.Mesh(new THREE.BoxGeometry(espessura, info.altura, info.profundidade), matCorpo);
      lateral.position.set(lado * (info.largura / 2 - espessura / 2), info.altura / 2, 0);
      grupo.add(lateral);
    });

    const fundo = new THREE.Mesh(new THREE.BoxGeometry(info.largura, info.altura, espessura), matCorpo);
    fundo.position.set(0, info.altura / 2, -info.profundidade / 2 + espessura / 2);
    grupo.add(fundo);

    const nPrateleiras = 4;
    for (let i = 0; i <= nPrateleiras; i++) {
      const y = Math.min((info.altura / nPrateleiras) * i, info.altura - espessura / 2);
      const prateleira = new THREE.Mesh(
        new THREE.BoxGeometry(info.largura - espessura * 2, espessura, info.profundidade - espessura),
        matCorpo
      );
      prateleira.position.set(0, Math.max(y, espessura / 2), 0);
      grupo.add(prateleira);
    }

    return grupo;
  }

  function construirGarrafeira(info) {
    const grupo = new THREE.Group();
    const matCorpo = materialMadeira(info.cor, 1, 1);
    const matDivisoria = new THREE.MeshStandardMaterial({ color: ajustarCorNumero(info.cor, -0.08), roughness: 0.8 });
    const matGarrafa = new THREE.MeshStandardMaterial({ color: 0x2f2b1a, roughness: 0.35, transparent: true, opacity: 0.6 });
    const espessura = 0.02;

    const corpo = new THREE.Mesh(new THREE.BoxGeometry(info.largura, info.altura, info.profundidade), matCorpo);
    corpo.position.set(0, info.altura / 2, 0);
    grupo.add(corpo);

    for (let c = 1; c < 3; c++) {
      const x = -info.largura / 2 + (info.largura / 3) * c;
      const div = new THREE.Mesh(new THREE.BoxGeometry(espessura, info.altura - espessura * 2, info.profundidade - espessura), matDivisoria);
      div.position.set(x, info.altura / 2, 0);
      grupo.add(div);
    }
    for (let l = 1; l < 3; l++) {
      const y = (info.altura / 3) * l;
      const div = new THREE.Mesh(new THREE.BoxGeometry(info.largura - espessura * 2, espessura, info.profundidade - espessura), matDivisoria);
      div.position.set(0, y, 0);
      grupo.add(div);
    }

    for (let i = 0; i < 4; i++) {
      const garrafa = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, info.profundidade * 0.7, 10), matGarrafa);
      garrafa.rotation.z = Math.PI / 2;
      const cx = -info.largura / 2 + info.largura * (0.18 + 0.64 * Math.random());
      const cy = info.altura * (0.18 + 0.64 * Math.random());
      garrafa.position.set(cx, cy, 0);
      grupo.add(garrafa);
    }

    return grupo;
  }

  function construirMesa(info) {
    const grupo = new THREE.Group();
    const matMadeira = materialMadeira(info.cor, 1, 1);
    const espessuraTampo = 0.05;
    const alturaPerna = info.altura - espessuraTampo;
    const margemPerna = 0.08;

    const tampo = new THREE.Mesh(new THREE.BoxGeometry(info.largura, espessuraTampo, info.profundidade), matMadeira);
    tampo.position.set(0, info.altura - espessuraTampo / 2, 0);
    grupo.add(tampo);

    [
      [-info.largura / 2 + margemPerna, -info.profundidade / 2 + margemPerna],
      [info.largura / 2 - margemPerna, -info.profundidade / 2 + margemPerna],
      [-info.largura / 2 + margemPerna, info.profundidade / 2 - margemPerna],
      [info.largura / 2 - margemPerna, info.profundidade / 2 - margemPerna],
    ].forEach(([x, z]) => {
      const perna = new THREE.Mesh(new THREE.BoxGeometry(0.06, alturaPerna, 0.06), matMadeira);
      perna.position.set(x, alturaPerna / 2, z);
      grupo.add(perna);
    });

    return grupo;
  }

  function construirSofa(info) {
    const grupo = new THREE.Group();
    const matEstofo = new THREE.MeshStandardMaterial({ color: info.cor, roughness: 0.92 });
    const matPerna = new THREE.MeshStandardMaterial({ color: 0x2b241a, roughness: 0.55 });

    const alturaAssento = 0.42;
    const alturaEncosto = info.altura - alturaAssento;

    const assento = new THREE.Mesh(new THREE.BoxGeometry(info.largura - 0.16, alturaAssento * 0.55, info.profundidade - 0.08), matEstofo);
    assento.position.set(0, alturaAssento * 0.72, 0.02);
    grupo.add(assento);

    const encosto = new THREE.Mesh(new THREE.BoxGeometry(info.largura - 0.16, alturaEncosto, 0.18), matEstofo);
    encosto.position.set(0, alturaAssento + alturaEncosto / 2 - 0.05, -info.profundidade / 2 + 0.09);
    grupo.add(encosto);

    [-1, 1].forEach((lado) => {
      const braco = new THREE.Mesh(new THREE.BoxGeometry(0.14, info.altura * 0.62, info.profundidade - 0.06), matEstofo);
      braco.position.set(lado * (info.largura / 2 - 0.07), (info.altura * 0.62) / 2, 0);
      grupo.add(braco);
    });

    [
      [-1, -1], [1, -1], [-1, 1], [1, 1],
    ].forEach(([lx, lz]) => {
      const perna = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.1, 8), matPerna);
      perna.position.set(lx * (info.largura / 2 - 0.14), 0.05, lz * (info.profundidade / 2 - 0.1));
      grupo.add(perna);
    });

    return grupo;
  }

  function construirCadeira(info) {
    const grupo = new THREE.Group();
    const matEstofo = new THREE.MeshStandardMaterial({ color: info.cor, roughness: 0.85 });
    const matPerna = new THREE.MeshStandardMaterial({ color: 0x2b241a, roughness: 0.5 });

    const alturaAssento = 0.44;

    const assento = new THREE.Mesh(new THREE.BoxGeometry(info.largura, 0.06, info.profundidade), matEstofo);
    assento.position.set(0, alturaAssento, 0);
    grupo.add(assento);

    const encosto = new THREE.Mesh(new THREE.BoxGeometry(info.largura, info.altura - alturaAssento, 0.05), matEstofo);
    encosto.position.set(0, alturaAssento + (info.altura - alturaAssento) / 2, -info.profundidade / 2 + 0.025);
    grupo.add(encosto);

    [
      [-1, -1], [1, -1], [-1, 1], [1, 1],
    ].forEach(([lx, lz]) => {
      const perna = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, alturaAssento, 8), matPerna);
      perna.position.set(lx * (info.largura / 2 - 0.03), alturaAssento / 2, lz * (info.profundidade / 2 - 0.03));
      grupo.add(perna);
    });

    return grupo;
  }

  function construirCama(info) {
    const grupo = new THREE.Group();
    const matMadeira = materialMadeira(info.cor, 1, 1);
    const matColchao = new THREE.MeshStandardMaterial({ color: 0xf2eee6, roughness: 0.95 });

    const alturaBase = 0.3;
    const base = new THREE.Mesh(new THREE.BoxGeometry(info.largura, alturaBase, info.profundidade), matMadeira);
    base.position.set(0, alturaBase / 2, 0);
    grupo.add(base);

    const colchao = new THREE.Mesh(new THREE.BoxGeometry(info.largura - 0.06, 0.2, info.profundidade - 0.06), matColchao);
    colchao.position.set(0, alturaBase + 0.1, 0);
    grupo.add(colchao);

    const cabeceira = new THREE.Mesh(new THREE.BoxGeometry(info.largura, 0.9, 0.08), matMadeira);
    cabeceira.position.set(0, 0.45, -info.profundidade / 2 + 0.04);
    grupo.add(cabeceira);

    return grupo;
  }

  function construirCriadoMudo(info) {
    const grupo = new THREE.Group();
    const matCorpo = materialMadeira(info.cor, 1, 1);
    const matGaveta = materialMadeira(ajustarCorNumero(info.cor, 0.05), 1, 1);
    const matPuxador = new THREE.MeshStandardMaterial({ color: 0xcfcfcf, roughness: 0.3, metalness: 0.6 });

    const corpo = new THREE.Mesh(new THREE.BoxGeometry(info.largura, info.altura, info.profundidade), matCorpo);
    corpo.position.set(0, info.altura / 2, 0);
    grupo.add(corpo);

    const gaveta = new THREE.Mesh(new THREE.BoxGeometry(info.largura - 0.04, info.altura * 0.35, 0.015), matGaveta);
    gaveta.position.set(0, info.altura * 0.65, info.profundidade / 2 + 0.008);
    grupo.add(gaveta);

    const puxador = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.08, 6), matPuxador);
    puxador.rotation.z = Math.PI / 2;
    puxador.position.set(0, info.altura * 0.65, info.profundidade / 2 + 0.02);
    grupo.add(puxador);

    return grupo;
  }

  function construirArmarioSuperior(info) {
    const grupo = new THREE.Group();
    const matCorpo = materialMadeira(info.cor, 1.2, 1);
    const matPorta = materialMadeira(ajustarCorNumero(info.cor, 0.05), 1, 1);
    const alturaMontagem = 1.5;

    const corpo = new THREE.Mesh(new THREE.BoxGeometry(info.largura, info.altura, info.profundidade), matCorpo);
    corpo.position.set(0, alturaMontagem + info.altura / 2, 0);
    grupo.add(corpo);

    const nPortas = Math.max(2, Math.round(info.largura / 0.6));
    const larguraPorta = info.largura / nPortas;
    for (let i = 0; i < nPortas; i++) {
      const x = -info.largura / 2 + larguraPorta * (i + 0.5);
      const porta = new THREE.Mesh(new THREE.BoxGeometry(larguraPorta - 0.02, info.altura - 0.04, 0.016), matPorta);
      porta.position.set(x, alturaMontagem + info.altura / 2, info.profundidade / 2 + 0.008);
      grupo.add(porta);
    }

    return grupo;
  }

  function construirLavatorio(info) {
    const grupo = new THREE.Group();
    const matCorpo = materialMadeira(ajustarCorNumero(info.cor, -0.1), 1, 1);
    const matTampo = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 });
    const matCuba = new THREE.MeshStandardMaterial({ color: 0xe4e4e4, roughness: 0.15, metalness: 0.05 });

    const alturaCorpo = info.altura - 0.06;
    const corpo = new THREE.Mesh(new THREE.BoxGeometry(info.largura, alturaCorpo, info.profundidade), matCorpo);
    corpo.position.set(0, alturaCorpo / 2, 0);
    grupo.add(corpo);

    const tampo = new THREE.Mesh(new THREE.BoxGeometry(info.largura * 1.04, 0.05, info.profundidade * 1.08), matTampo);
    tampo.position.set(0, alturaCorpo + 0.025, 0);
    grupo.add(tampo);

    const cuba = new THREE.Mesh(new THREE.CylinderGeometry(info.largura * 0.22, info.largura * 0.18, 0.06, 16), matCuba);
    cuba.position.set(0, alturaCorpo + 0.02, 0);
    grupo.add(cuba);

    return grupo;
  }

  function construirArmarioBanho(info) {
    const grupo = new THREE.Group();
    const matCorpo = materialMadeira(info.cor, 1, 1);
    const matEspelho = new THREE.MeshStandardMaterial({ color: 0xbfd8e8, roughness: 0.05, metalness: 0.4 });
    const alturaMontagem = 1.4;

    const corpo = new THREE.Mesh(new THREE.BoxGeometry(info.largura, info.altura, info.profundidade), matCorpo);
    corpo.position.set(0, alturaMontagem + info.altura / 2, 0);
    grupo.add(corpo);

    const espelho = new THREE.Mesh(new THREE.BoxGeometry(info.largura - 0.04, info.altura - 0.04, 0.01), matEspelho);
    espelho.position.set(0, alturaMontagem + info.altura / 2, info.profundidade / 2 + 0.006);
    grupo.add(espelho);

    return grupo;
  }

  const CONSTRUTORES = {
    roupeiro: construirRoupeiro,
    cozinha: construirCozinha,
    painel: construirPainel,
    estante: construirEstante,
    garrafeira: construirGarrafeira,
    mesa: construirMesa,
    sofa: construirSofa,
    cadeira: construirCadeira,
    mesaCentro: construirMesa,
    cama: construirCama,
    criadoMudo: construirCriadoMudo,
    armarioSuperior: construirArmarioSuperior,
    lavatorio: construirLavatorio,
    armarioBanho: construirArmarioBanho,
  };

  // --------------------------------------------------------------
  // Limites por divisão (mantém os módulos dentro das paredes da
  // divisão a que pertencem)
  // --------------------------------------------------------------

  function clampNaDivisao(valor, largura, profundidade, eixo, divisao) {
    const margem = 0.05;
    const meia = Math.max(largura, profundidade) / 2;
    if (eixo === "x") {
      return Math.min(Math.max(valor, divisao.x + meia + margem), divisao.x + divisao.largura - meia - margem);
    }
    return Math.min(Math.max(valor, divisao.z + meia + margem), divisao.z + divisao.profundidade - meia - margem);
  }

  function clampModuloNaDivisao(modulo) {
    const divisao = divisaoPorId(modulo.divisaoId);
    modulo.grupo.position.x = clampNaDivisao(modulo.grupo.position.x, modulo.largura, modulo.profundidade, "x", divisao);
    modulo.grupo.position.z = clampNaDivisao(modulo.grupo.position.z, modulo.largura, modulo.profundidade, "z", divisao);
  }

  // --------------------------------------------------------------
  // Módulos — criar, remover, rodar, selecionar
  // --------------------------------------------------------------

  function criarModulo(tipo, divisaoId) {
    const info = CATALOGO[tipo];
    const construtor = CONSTRUTORES[tipo];
    if (!info || !construtor) return;

    const divisao = divisaoPorId(divisaoId || "sala");
    const grupo = construtor(info);

    const id = proximoId++;
    grupo.traverse((obj) => {
      if (obj.isMesh) {
        obj.userData.raizId = id;
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });

    const naDivisao = modulos.filter((m) => m.divisaoId === divisao.id).length;
    const offset = (naDivisao % 4) * 0.15;
    grupo.position.set(
      clampNaDivisao(divisao.x + divisao.largura / 2 - 0.5 + offset, info.largura, info.profundidade, "x", divisao),
      0,
      clampNaDivisao(divisao.z + divisao.profundidade / 2 - 0.5 + offset, info.largura, info.profundidade, "z", divisao)
    );

    scene.add(grupo);

    const registo = {
      id,
      tipo,
      grupo,
      largura: info.largura,
      profundidade: info.profundidade,
      altura: info.altura,
      divisaoId: divisao.id,
    };
    modulos.push(registo);

    return registo;
  }

  function pegarModulo(id) {
    return modulos.find((m) => m.id === id) || null;
  }

  function removerModulo(id) {
    const modulo = pegarModulo(id);
    if (!modulo) return;
    scene.remove(modulo.grupo);
    modulos = modulos.filter((m) => m.id !== id);
    if (selecionadoId === id) selecionadoId = null;
    atualizarLista();
  }

  function rodarModulo(id) {
    const modulo = pegarModulo(id);
    if (!modulo) return;
    modulo.grupo.rotation.y += Math.PI / 4;
    clampModuloNaDivisao(modulo);
  }

  function selecionar(id) {
    selecionadoId = id;
    modulos.forEach((m) => {
      const emissivo = m.id === id;
      m.grupo.traverse((obj) => {
        if (!obj.isMesh) return;
        obj.material.emissive = new THREE.Color(emissivo ? COR_SELECIONADO : 0x000000);
        obj.material.emissiveIntensity = emissivo ? 0.3 : 0;
      });
    });
    atualizarLista();
  }

  // --------------------------------------------------------------
  // Lista lateral
  // --------------------------------------------------------------

  const listaEl = document.getElementById("simPlacedList");
  const vazioEl = document.getElementById("simEmpty");

  function atualizarLista() {
    listaEl.querySelectorAll(".sim-placed-item").forEach((el) => el.remove());
    vazioEl.hidden = modulos.length > 0;

    modulos.forEach((m) => {
      const info = CATALOGO[m.tipo];
      const divisao = divisaoPorId(m.divisaoId);
      const li = document.createElement("li");
      li.className = "sim-placed-item" + (m.id === selecionadoId ? " ativo" : "");

      li.innerHTML = `
        <span class="sim-placed-dot" style="background:#${info.cor.toString(16).padStart(6, "0")}"></span>
        <span class="sim-placed-info">
          <strong>${info.nome}</strong>
          <span>${divisao.nome} · ${info.largura} × ${info.profundidade} × ${info.altura} m</span>
        </span>
        <span class="sim-placed-actions">
          <button type="button" class="sim-mini-btn" data-acao="rodar" title="Rodar 45°">⟳</button>
          <button type="button" class="sim-mini-btn remover" data-acao="remover" title="Remover">×</button>
        </span>
      `;

      li.addEventListener("click", (evento) => {
        if (evento.target.closest("[data-acao]")) return;
        selecionar(m.id);
      });
      li.querySelector('[data-acao="rodar"]').addEventListener("click", () => rodarModulo(m.id));
      li.querySelector('[data-acao="remover"]').addEventListener("click", () => removerModulo(m.id));

      listaEl.appendChild(li);
    });
  }

  // --------------------------------------------------------------
  // Catálogo — ícones por tipo e renderização filtrada por divisão
  // --------------------------------------------------------------

  const ICONES_CATALOGO = {
    sofa: '<svg viewBox="0 0 40 40"><rect x="5" y="16" width="30" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 22 v8 M35 22 v8" stroke="currentColor" stroke-width="2"/><path d="M8 16 v-4 h24 v4" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    cadeira: '<svg viewBox="0 0 40 40"><rect x="10" y="18" width="20" height="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 18 V6" stroke="currentColor" stroke-width="2.2"/><path d="M12 22 V33 M28 22 V33" stroke="currentColor" stroke-width="2"/></svg>',
    mesa: '<svg viewBox="0 0 40 40"><line x1="5" y1="13" x2="35" y2="13" stroke="currentColor" stroke-width="3"/><line x1="8" y1="13" x2="8" y2="34" stroke="currentColor" stroke-width="2.2"/><line x1="32" y1="13" x2="32" y2="34" stroke="currentColor" stroke-width="2.2"/></svg>',
    estante: '<svg viewBox="0 0 40 40"><rect x="6" y="5" width="28" height="30" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/><line x1="6" y1="14" x2="34" y2="14" stroke="currentColor" stroke-width="1.6"/><line x1="6" y1="21.5" x2="34" y2="21.5" stroke="currentColor" stroke-width="1.6"/><line x1="6" y1="29" x2="34" y2="29" stroke="currentColor" stroke-width="1.6"/></svg>',
    painel: '<svg viewBox="0 0 40 40"><rect x="6" y="4" width="28" height="32" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/><line x1="12" y1="6" x2="12" y2="34" stroke="currentColor" stroke-width="1.4"/><line x1="17" y1="6" x2="17" y2="34" stroke="currentColor" stroke-width="1.4"/><line x1="22" y1="6" x2="22" y2="34" stroke="currentColor" stroke-width="1.4"/><line x1="27" y1="6" x2="27" y2="34" stroke="currentColor" stroke-width="1.4"/></svg>',
    garrafeira: '<svg viewBox="0 0 40 40"><rect x="6" y="6" width="28" height="28" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/><line x1="19" y1="6" x2="19" y2="34" stroke="currentColor" stroke-width="1.4"/><line x1="27" y1="6" x2="27" y2="34" stroke="currentColor" stroke-width="1.4"/><line x1="6" y1="15.5" x2="34" y2="15.5" stroke="currentColor" stroke-width="1.4"/><line x1="6" y1="25" x2="34" y2="25" stroke="currentColor" stroke-width="1.4"/></svg>',
    roupeiro: '<svg viewBox="0 0 40 40"><rect x="7" y="4" width="26" height="32" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/><line x1="20" y1="4" x2="20" y2="36" stroke="currentColor" stroke-width="2"/><circle cx="17.5" cy="20" r="1.4" fill="currentColor"/><circle cx="22.5" cy="20" r="1.4" fill="currentColor"/></svg>',
    cama: '<svg viewBox="0 0 40 40"><rect x="5" y="16" width="30" height="14" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/><rect x="5" y="9" width="4" height="21" fill="none" stroke="currentColor" stroke-width="2"/><line x1="5" y1="21" x2="35" y2="21" stroke="currentColor" stroke-width="1.4"/></svg>',
    criado: '<svg viewBox="0 0 40 40"><rect x="11" y="9" width="18" height="22" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/><line x1="11" y1="18" x2="29" y2="18" stroke="currentColor" stroke-width="1.4"/></svg>',
    cozinha: '<svg viewBox="0 0 40 40"><rect x="4" y="16" width="32" height="18" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/><line x1="4" y1="16" x2="36" y2="16" stroke="currentColor" stroke-width="2.5"/><line x1="14" y1="16" x2="14" y2="34" stroke="currentColor" stroke-width="1.5"/><line x1="26" y1="16" x2="26" y2="34" stroke="currentColor" stroke-width="1.5"/></svg>',
    armario: '<svg viewBox="0 0 40 40"><rect x="6" y="10" width="28" height="20" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/><line x1="20" y1="10" x2="20" y2="30" stroke="currentColor" stroke-width="1.6"/></svg>',
    lavatorio: '<svg viewBox="0 0 40 40"><rect x="5" y="8" width="30" height="8" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/><ellipse cx="20" cy="12" rx="8" ry="2.6" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 16 V30 M32 16 V30" stroke="currentColor" stroke-width="2"/></svg>',
  };

  function iconeCatalogo(chave) {
    return ICONES_CATALOGO[chave] || ICONES_CATALOGO.mesa;
  }

  let divisaoAtivaCatalogo = "sala";
  const simCatalogEl = document.getElementById("simCatalog");
  const simDivisaoAbasEl = document.getElementById("simDivisaoAbas");

  function renderizarCatalogo() {
    simCatalogEl.innerHTML = "";

    Object.entries(CATALOGO)
      .filter(([, info]) => info.divisoes.includes(divisaoAtivaCatalogo))
      .forEach(([tipo, info]) => {
        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "sim-catalog-card";
        botao.draggable = true;
        botao.dataset.tipo = tipo;
        botao.innerHTML = `
          <span class="sim-card-icone" style="background:#${info.cor.toString(16).padStart(6, "0")}">${iconeCatalogo(info.icone)}</span>
          <span class="sim-card-texto">
            <strong>${info.nome}</strong>
            <em>${info.largura} × ${info.profundidade} × ${info.altura} m</em>
          </span>
        `;
        simCatalogEl.appendChild(botao);
      });
  }

  simDivisaoAbasEl.addEventListener("click", (evento) => {
    const aba = evento.target.closest(".sim-divisao-aba");
    if (!aba) return;
    divisaoAtivaCatalogo = aba.dataset.divisao;
    simDivisaoAbasEl.querySelectorAll(".sim-divisao-aba").forEach((el) => {
      el.classList.toggle("ativa", el === aba);
    });
    renderizarCatalogo();
  });

  // --------------------------------------------------------------
  // Interação: adicionar módulos (clique ou arrastar do catálogo)
  // --------------------------------------------------------------

  simCatalogEl.addEventListener("click", (evento) => {
    const botao = evento.target.closest(".sim-catalog-card");
    if (!botao) return;
    const novo = criarModulo(botao.dataset.tipo, divisaoAtivaCatalogo);
    if (novo) selecionar(novo.id);
  });

  simCatalogEl.addEventListener("dragstart", (evento) => {
    const botao = evento.target.closest(".sim-catalog-card");
    if (!botao) return;
    evento.dataTransfer.setData("text/plain", botao.dataset.tipo);
    evento.dataTransfer.effectAllowed = "copy";
  });

  const canvasWrapEl = document.querySelector(".sim-canvas-wrap");

  canvasWrapEl.addEventListener("dragover", (evento) => {
    evento.preventDefault();
    evento.dataTransfer.dropEffect = "copy";
    canvasWrapEl.classList.add("sim-drag-ativo");
  });

  canvasWrapEl.addEventListener("dragleave", () => {
    canvasWrapEl.classList.remove("sim-drag-ativo");
  });

  canvasWrapEl.addEventListener("drop", (evento) => {
    evento.preventDefault();
    canvasWrapEl.classList.remove("sim-drag-ativo");

    const tipo = evento.dataTransfer.getData("text/plain");
    if (!CATALOGO[tipo]) return;

    atualizarMouse(evento);
    raycaster.setFromCamera(mouse, camera);

    let divisaoId = "sala";
    let ponto = null;
    if (raycaster.ray.intersectPlane(planoChao, pontoArrasto)) {
      divisaoId = divisaoNoPonto(pontoArrasto.x, pontoArrasto.z).id;
      ponto = pontoArrasto.clone();
    }

    const novo = criarModulo(tipo, divisaoId);
    if (!novo) return;

    if (ponto) {
      const divisao = divisaoPorId(divisaoId);
      novo.grupo.position.x = clampNaDivisao(ponto.x, novo.largura, novo.profundidade, "x", divisao);
      novo.grupo.position.z = clampNaDivisao(ponto.z, novo.largura, novo.profundidade, "z", divisao);
    }

    selecionar(novo.id);
  });

  // --------------------------------------------------------------
  // Interação: arrastar módulos no piso / rodar câmara
  // --------------------------------------------------------------

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const planoChao = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const pontoArrasto = new THREE.Vector3();
  let arrastando = null;

  function atualizarMouse(evento) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((evento.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((evento.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function malhasClicaveis() {
    const lista = [];
    modulos.forEach((m) => {
      m.grupo.traverse((obj) => {
        if (obj.isMesh) lista.push(obj);
      });
    });
    return lista;
  }

  renderer.domElement.addEventListener("pointerdown", (evento) => {
    atualizarMouse(evento);
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(malhasClicaveis(), false);

    if (hits.length > 0) {
      const id = hits[0].object.userData.raizId;
      arrastando = pegarModulo(id);
      selecionar(id);
      controls.enabled = false;
    }
  });

  window.addEventListener("pointermove", (evento) => {
    if (!arrastando) return;
    atualizarMouse(evento);
    raycaster.setFromCamera(mouse, camera);
    if (raycaster.ray.intersectPlane(planoChao, pontoArrasto)) {
      const divisao = divisaoPorId(arrastando.divisaoId);
      arrastando.grupo.position.x = clampNaDivisao(pontoArrasto.x, arrastando.largura, arrastando.profundidade, "x", divisao);
      arrastando.grupo.position.z = clampNaDivisao(pontoArrasto.z, arrastando.largura, arrastando.profundidade, "z", divisao);
    }
  });

  window.addEventListener("pointerup", () => {
    arrastando = null;
    controls.enabled = true;
  });

  // --------------------------------------------------------------
  // Redimensionamento responsivo
  // --------------------------------------------------------------

  function ajustarTamanho() {
    const largura = contentor.clientWidth;
    const altura = contentor.clientHeight;
    if (largura === 0 || altura === 0) return;
    camera.aspect = largura / altura;
    camera.updateProjectionMatrix();
    renderer.setSize(largura, altura);
  }

  window.addEventListener("resize", ajustarTamanho);
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(ajustarTamanho).observe(contentor);
  }

  // --------------------------------------------------------------
  // Guardar / carregar projetos (neste navegador)
  // --------------------------------------------------------------

  const CHAVE_PROJETOS = "nm_simulador_projetos_v2";

  function carregarProjetosGuardados() {
    try {
      const bruto = localStorage.getItem(CHAVE_PROJETOS);
      return bruto ? JSON.parse(bruto) : [];
    } catch (erro) {
      return [];
    }
  }

  function guardarProjetosNoStorage(lista) {
    try {
      localStorage.setItem(CHAVE_PROJETOS, JSON.stringify(lista));
    } catch (erro) {
      console.error("Não foi possível guardar o projeto", erro);
    }
  }

  function escaparHtmlSimples(texto) {
    const div = document.createElement("div");
    div.textContent = texto;
    return div.innerHTML;
  }

  const inputNomeProjeto = document.getElementById("simNomeProjeto");
  const selectProjetos = document.getElementById("simListaProjetos");
  const notaProjeto = document.getElementById("simProjetoNota");

  function mostrarNotaProjeto(texto) {
    notaProjeto.textContent = texto;
    notaProjeto.hidden = false;
    clearTimeout(mostrarNotaProjeto._t);
    mostrarNotaProjeto._t = setTimeout(() => {
      notaProjeto.hidden = true;
    }, 3500);
  }

  function atualizarListaProjetos() {
    const projetos = carregarProjetosGuardados();
    selectProjetos.innerHTML =
      '<option value="">— projetos guardados —</option>' +
      projetos.map((p, i) => `<option value="${i}">${escaparHtmlSimples(p.nome)}</option>`).join("");
  }

  document.getElementById("simGuardarProjeto").addEventListener("click", () => {
    const nome = inputNomeProjeto.value.trim() || `Projeto ${new Date().toLocaleDateString("pt-PT")}`;
    const projetos = carregarProjetosGuardados();

    const dados = {
      nome,
      modulos: modulos.map((m) => ({
        tipo: m.tipo,
        divisaoId: m.divisaoId,
        x: m.grupo.position.x,
        z: m.grupo.position.z,
        rotY: m.grupo.rotation.y,
      })),
    };

    const indiceExistente = projetos.findIndex((p) => p.nome === nome);
    if (indiceExistente !== -1) projetos[indiceExistente] = dados;
    else projetos.push(dados);

    guardarProjetosNoStorage(projetos);
    atualizarListaProjetos();
    mostrarNotaProjeto(`Projeto "${nome}" guardado neste navegador.`);
  });

  document.getElementById("simCarregarProjeto").addEventListener("click", () => {
    const indice = selectProjetos.value;
    if (indice === "") return;

    const projetos = carregarProjetosGuardados();
    const dados = projetos[Number(indice)];
    if (!dados) return;

    [...modulos].forEach((m) => removerModulo(m.id));

    dados.modulos.forEach((info) => {
      const novo = criarModulo(info.tipo, info.divisaoId);
      if (!novo) return;
      novo.grupo.position.x = info.x;
      novo.grupo.position.z = info.z;
      novo.grupo.rotation.y = info.rotY || 0;
      clampModuloNaDivisao(novo);
    });

    atualizarLista();
    inputNomeProjeto.value = dados.nome;
    mostrarNotaProjeto(`Projeto "${dados.nome}" carregado.`);
  });

  atualizarListaProjetos();

  // --------------------------------------------------------------
  // Abas da barra de ferramentas (Desenho / Projetos guardados)
  // --------------------------------------------------------------

  const abaDesenho = document.getElementById("simAbaDesenho");
  const abaProjetos = document.getElementById("simAbaProjetos");
  const painelDesenho = document.querySelector(".simulator-wrap");
  const painelProjetos = document.getElementById("simPainelProjetos");

  function mostrarAba(nome) {
    const emProjetos = nome === "projetos";
    painelDesenho.hidden = emProjetos;
    painelProjetos.hidden = !emProjetos;
    abaDesenho.classList.toggle("ativa", !emProjetos);
    abaDesenho.setAttribute("aria-selected", String(!emProjetos));
    abaProjetos.classList.toggle("ativa", emProjetos);
    abaProjetos.setAttribute("aria-selected", String(emProjetos));
    if (!emProjetos) ajustarTamanho();
  }

  abaDesenho.addEventListener("click", () => mostrarAba("desenho"));
  abaProjetos.addEventListener("click", () => mostrarAba("projetos"));

  document.getElementById("simCarregarProjeto").addEventListener("click", () => {
    mostrarAba("desenho");
  });

  // --------------------------------------------------------------
  // Arranque
  // --------------------------------------------------------------

  construirCasa();
  posicionarCamara();
  ajustarTamanho();
  renderizarCatalogo();

  // módulos de exemplo, para a casa não abrir vazia
  function posicionarExemplo(tipo, divisaoId, x, z) {
    const modulo = criarModulo(tipo, divisaoId);
    if (!modulo) return;
    const divisao = divisaoPorId(divisaoId);
    modulo.grupo.position.set(divisao.x + x, 0, divisao.z + z);
    clampModuloNaDivisao(modulo);
  }

  posicionarExemplo("roupeiro", "quarto", 1.0, 0.4);
  posicionarExemplo("cozinha", "cozinha", 1.6, 0.4);
  posicionarExemplo("mesa", "sala", 2.4, 2.5);
  posicionarExemplo("garrafeira", "sala", 0.5, 1.7);
  atualizarLista();

  function animar() {
    requestAnimationFrame(animar);
    controls.update();
    atualizarVisibilidadeParedes();
    renderer.render(scene, camera);
  }
  animar();
})();
