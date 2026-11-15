/* ==========================================================================
   Store: dados da aplicação salvos no localStorage do navegador.
   Para trocar por uma API real, substitua as funções deste arquivo
   mantendo os mesmos nomes e retornos.
   ========================================================================== */
(function () {
  /* Conta de demonstração: usa os dados de exemplo.
     Contas criadas no cadastro têm dados próprios, começando sem notas. */
  const EMAIL_DEMO = 'camila@estudioaurora.com.br';
  const SESSAO_KEY = 'notafacil:sessao';          // gravada pelo login (auth.js)
  const USUARIOS_KEY = 'notafacil:usuarios';      // contas criadas no cadastro (auth.js)

  const read = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } };
  const sessaoAtual = read(SESSAO_KEY, null);
  const contaDemo = !sessaoAtual || String(sessaoAtual.email).toLowerCase() === EMAIL_DEMO;
  const PREFIX = contaDemo ? 'notafacil:' : `notafacil:conta:${String(sessaoAtual.email).toLowerCase()}:`;
  const K = {
    notas: PREFIX + 'notas',
    empresa: PREFIX + 'empresa',
    config: PREFIX + 'config',
    sessao: SESSAO_KEY,
    versao: PREFIX + 'versao',
  };
  const VERSAO_DADOS = '1';

  const write = (k, v) => {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; }
    catch (e) { if (window.U) U.toast('Não foi possível salvar: o armazenamento do navegador está cheio.', 'error'); return false; }
  };

  /* ---------- Tabelas auxiliares ---------- */
  const SERVICOS = [
    { codigo: '01.01', nome: 'Análise e desenvolvimento de sistemas' },
    { codigo: '01.02', nome: 'Programação' },
    { codigo: '01.03', nome: 'Processamento e hospedagem de dados' },
    { codigo: '01.05', nome: 'Licenciamento de programas' },
    { codigo: '01.06', nome: 'Assessoria em informática' },
    { codigo: '01.07', nome: 'Suporte técnico em informática' },
    { codigo: '01.08', nome: 'Criação e manutenção de sites' },
    { codigo: '17.01', nome: 'Assessoria ou consultoria' },
    { codigo: '17.06', nome: 'Propaganda e publicidade' },
    { codigo: '17.19', nome: 'Contabilidade' },
    { codigo: '23.01', nome: 'Programação e comunicação visual' },
    { codigo: '24.01', nome: 'Confecção de placas e sinalização' },
  ];
  const MUNICIPIOS = [
    'São Paulo / SP', 'Campinas / SP', 'Santos / SP', 'Guarulhos / SP', 'Osasco / SP', 'Santo André / SP', 'São Bernardo do Campo / SP',
    'Ribeirão Preto / SP', 'Sorocaba / SP', 'São José dos Campos / SP', 'Rio de Janeiro / RJ', 'Niterói / RJ', 'Belo Horizonte / MG',
    'Uberlândia / MG', 'Curitiba / PR', 'Londrina / PR', 'Florianópolis / SC', 'Joinville / SC', 'Porto Alegre / RS', 'Brasília / DF',
    'Goiânia / GO', 'Campo Grande / MS', 'Cuiabá / MT', 'Salvador / BA', 'Recife / PE', 'Fortaleza / CE', 'Natal / RN', 'João Pessoa / PB',
    'Maceió / AL', 'Aracaju / SE', 'Teresina / PI', 'São Luís / MA', 'Belém / PA', 'Manaus / AM', 'Vitória / ES', 'Palmas / TO',
    'Porto Velho / RO', 'Rio Branco / AC', 'Macapá / AP', 'Boa Vista / RR',
  ];
  const UF_COD = { RO: 11, AC: 12, AM: 13, RR: 14, PA: 15, AP: 16, TO: 17, MA: 21, PI: 22, CE: 23, RN: 24, PB: 25, PE: 26, AL: 27, SE: 28, BA: 29, MG: 31, ES: 32, RJ: 33, SP: 35, PR: 41, SC: 42, RS: 43, MS: 50, MT: 51, GO: 52, DF: 53 };

  /* ---------- Dados iniciais (demonstração) ---------- */
  const EMPRESA_PADRAO = {
    cnpj: '12.345.678/0001-95',
    razaoSocial: 'Estúdio Aurora Design Ltda.',
    nomeFantasia: 'Estúdio Aurora',
    inscricaoMunicipal: '98765432',
    regime: 'Simples Nacional',
    email: 'financeiro@estudioaurora.com.br',
    endereco: 'Rua dos Pinheiros, 870 · São Paulo / SP',
    cep: '05422-001',
  };
  const CONFIG_PADRAO = {
    senha: 'aurora2026',          // senha de demonstração (veja README)
    doisFatores: true,
    logo: null,                   // { dataUrl, nome, tamanho, data }
    certificado: {
      tipo: 'A1', titular: 'Estúdio Aurora Design Ltda.', cnpj: '12.345.678/0001-95',
      validade: '2027-08-15', atualizado: '2026-08-15T14:32', arquivo: 'estudio-aurora.pfx',
    },
    notificacoesLidas: [],
  };
  const SESSAO_DEMO = { nome: 'Camila Lima', email: 'camila@estudioaurora.com.br', perfil: 'Administrador' };

  function tomador(doc, nome, email, cep, municipio, logradouro, bairro, im = '') {
    return { doc, nome, email, im, cep, municipio, logradouro, bairro };
  }
  const T = {
    horizonte: tomador('23.456.789/0001-95', 'Horizonte Tecnologia Ltda.', 'financeiro@horizonte.com.br', '01310-100', 'São Paulo / SP', 'Av. Paulista, 1000', 'Bela Vista · Sala 504', '12345678'),
    clinica: tomador('34.567.890/0001-30', 'Clínica Bem Viver', 'adm@clinicabemviver.com.br', '04547-130', 'São Paulo / SP', 'Rua Funchal, 263', 'Vila Olímpia'),
    cafe: tomador('45.678.901/0001-75', 'Café Jardim', 'contato@cafejardim.com.br', '05415-010', 'São Paulo / SP', 'Rua Teodoro Sampaio, 1220', 'Pinheiros'),
    papelaria: tomador('56.789.012/0001-00', 'Papelaria Traço', 'compras@papelariatraco.com.br', '13015-904', 'Campinas / SP', 'Rua Barão de Jaguara, 950', 'Centro'),
    casa: tomador('67.890.123/0001-16', 'Casa Nativa', 'ola@casanativa.com.br', '22410-002', 'Rio de Janeiro / RJ', 'Rua Visconde de Pirajá, 330', 'Ipanema'),
    joao: tomador('529.982.247-25', 'João da Silva', 'joao.silva@email.com', '01001-000', 'São Paulo / SP', 'Praça da Sé, 100', 'Sé'),
  };

  function nota(numero, t, emissao, valor, status, servico, discriminacao, extra = {}) {
    const n = {
      id: numero, numero, serie: '1', status,
      emissao, competencia: emissao.slice(0, 10),
      tomador: { ...t },
      servico: { codigo: servico, discriminacao },
      valores: { servico: valor, desconto: 0, aliquota: 2, issRetido: false, local: t.municipio },
      historico: [{ data: emissao, evento: 'Nota enviada para autorização' }],
      ...extra,
    };
    n.chave = gerarChave(n);
    if (status === 'autorizada' || status === 'cancelada') {
      n.protocolo = gerarProtocolo(emissao);
      n.autorizadaEm = emissao;
      n.historico.push({ data: emissao, evento: 'Nota autorizada pela prefeitura' });
    }
    if (status === 'pendente') n.historico.push({ data: emissao, evento: 'Aguardando retorno da prefeitura' });
    if (status === 'cancelada') {
      n.canceladaEm = extra.canceladaEm || emissao;
      n.motivoCancelamento = extra.motivoCancelamento || 'Serviço não prestado';
      n.historico.push({ data: n.canceladaEm, evento: `Nota cancelada · ${n.motivoCancelamento}` });
    }
    if (status === 'rejeitada') n.historico.push({ data: emissao, evento: `Nota rejeitada · ${extra.motivoRejeicao}` });
    return n;
  }

  function seedNotas() {
    return [
      nota(1058, T.horizonte, '2026-10-28T14:23', 4800, 'autorizada', '01.06', 'Consultoria em tecnologia e planejamento de soluções digitais, referente a outubro de 2026, conforme contrato de prestação de serviços.'),
      nota(1057, T.clinica, '2026-10-27T10:05', 3200, 'autorizada', '23.01', 'Criação de identidade visual e material gráfico para a campanha de novembro.'),
      nota(1056, T.cafe, '2026-10-26T16:40', 1800, 'pendente', '23.01', 'Design de cardápio e peças para redes sociais, referente a outubro de 2026.'),
      nota(1055, T.papelaria, '2026-10-23T09:12', 2500, 'autorizada', '01.08', 'Manutenção mensal da loja virtual e atualização de catálogo.'),
      nota(1054, T.casa, '2026-10-21T11:30', 1200, 'cancelada', '23.01', 'Produção de fotos e diagramação de catálogo de produtos.', { canceladaEm: '2026-10-22T08:50', motivoCancelamento: 'Erro na emissão' }),
      nota(1053, T.horizonte, '2026-09-29T15:10', 4800, 'autorizada', '01.06', 'Consultoria em tecnologia e planejamento de soluções digitais, referente a setembro de 2026.'),
      nota(1052, T.joao, '2026-09-24T13:45', 950, 'autorizada', '23.01', 'Criação de logotipo e cartão de visita.'),
      nota(1051, T.clinica, '2026-09-18T10:00', 3200, 'autorizada', '23.01', 'Peças gráficas para campanha institucional de setembro.'),
      nota(1050, T.cafe, '2026-09-12T17:20', 1800, 'rejeitada', '17.06', 'Gestão de redes sociais referente a setembro de 2026.', { motivoRejeicao: 'Código de serviço incompatível com a atividade cadastrada' }),
      nota(1049, T.papelaria, '2026-09-05T09:30', 2500, 'autorizada', '01.08', 'Manutenção mensal da loja virtual, referente a setembro de 2026.'),
      nota(1048, T.horizonte, '2026-08-29T14:00', 4800, 'autorizada', '01.06', 'Consultoria em tecnologia e planejamento de soluções digitais, referente a agosto de 2026.'),
      nota(1047, T.casa, '2026-08-15T11:15', 2100, 'autorizada', '23.01', 'Projeto de embalagens para linha de produtos.'),
    ];
  }

  /* ---------- Cálculos ---------- */
  function calc(v) {
    const servico = Number(v.servico) || 0;
    const desconto = Math.min(Number(v.desconto) || 0, servico);
    const base = servico - desconto;
    const iss = Math.round(base * (Number(v.aliquota) || 0)) / 100;
    const retencoes = v.issRetido ? iss : 0;
    const deducoes = desconto + retencoes;
    return { servico, desconto, base, iss, retencoes, deducoes, liquido: servico - deducoes };
  }

  function gerarChave(n) {
    const e = read(K.empresa, EMPRESA_PADRAO);
    const uf = (e.endereco.match(/\/\s*([A-Z]{2})\s*$/) || [, 'SP'])[1];
    const d = n.emissao.slice(2, 4) + n.emissao.slice(5, 7);
    let base = String(UF_COD[uf] || 35) + d + U.digits(e.cnpj).padStart(14, '0') + '55' + '001' + String(n.numero).padStart(9, '0') + '1';
    let seed = Number(n.numero) * 7919;
    while (base.length < 43) { seed = (seed * 9301 + 49297) % 233280; base += String(seed % 10); }
    let s = 0, w = 2;
    for (let i = base.length - 1; i >= 0; i--) { s += Number(base[i]) * w; w = w === 9 ? 2 : w + 1; }
    const r = s % 11;
    return base + (r < 2 ? 0 : 11 - r);
  }
  function gerarProtocolo(iso) {
    return '1352' + iso.slice(2, 4) + String(Math.floor(1e8 + Math.random() * 9e8));
  }

  /* ---------- Inicialização ---------- */
  function init() {
    if (read(K.versao) === VERSAO_DADOS) return;
    if (contaDemo) {
      write(K.empresa, EMPRESA_PADRAO);
      write(K.config, { ...CONFIG_PADRAO, ...read(K.config, {}) });
      write(K.notas, seedNotas());
    } else {
      /* Conta nova: dados do cadastro, sem notas e sem certificado */
      const u = (read(USUARIOS_KEY, []) || []).find((x) => x.email === String(sessaoAtual.email).toLowerCase()) || {};
      write(K.empresa, {
        cnpj: u.cnpj || '', razaoSocial: u.razaoSocial || sessaoAtual.nome || '', nomeFantasia: '',
        inscricaoMunicipal: '', regime: 'Simples Nacional', email: u.email || sessaoAtual.email, endereco: '', cep: '',
      });
      write(K.config, { ...CONFIG_PADRAO, certificado: null, ...read(K.config, {}) });
      write(K.notas, []);
    }
    write(K.versao, VERSAO_DADOS);
  }

  const Store = {
    SERVICOS, MUNICIPIOS, calc,

    sessao() { return read(K.sessao, null); },
    garantirSessao() {
      let s = read(K.sessao, null);
      if (!s && !(window.APP_CONFIG && APP_CONFIG.exigirLogin)) { s = SESSAO_DEMO; write(K.sessao, s); }
      return s;
    },
    sair() { localStorage.removeItem(K.sessao); },

    empresa() { return read(K.empresa, EMPRESA_PADRAO); },
    salvarEmpresa(dados) { write(K.empresa, { ...this.empresa(), ...dados }); },

    config() { return { ...CONFIG_PADRAO, ...read(K.config, {}) }; },
    salvarConfig(parcial) { return write(K.config, { ...this.config(), ...parcial }); },

    notas() { return read(K.notas, []).sort((a, b) => b.numero - a.numero); },
    nota(id) { return this.notas().find((n) => String(n.id) === String(id)) || null; },
    salvarNota(n) {
      const lista = read(K.notas, []);
      const i = lista.findIndex((x) => x.id === n.id);
      if (i >= 0) lista[i] = n; else lista.push(n);
      write(K.notas, lista);
      return n;
    },
    proximoNumero() { return Math.max(1000, ...read(K.notas, []).map((n) => n.numero)) + 1; },

    servicoNome(codigo) { const s = SERVICOS.find((x) => x.codigo === codigo); return s ? s.nome : ''; },

    /* Clientes (tomadores) já usados em notas, sem repetição, do mais recente ao mais antigo */
    clientes() {
      const vistos = new Map();
      this.notas().forEach((n) => { const k = U.digits(n.tomador.doc); if (!vistos.has(k)) vistos.set(k, n.tomador); });
      return Array.from(vistos.values()).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    },

    /* Emissão simulada: valida, gera número/chave/protocolo e autoriza. */
    emitir(dados, idEdicao) {
      const agora = U.isoDateTime();
      const original = idEdicao ? this.nota(idEdicao) : null;
      const numero = original ? original.numero : this.proximoNumero();
      const n = {
        ...(original || {}),
        id: numero, numero, serie: '1',
        emissao: original ? original.emissao : agora,
        competencia: dados.competencia,
        tomador: dados.tomador,
        servico: dados.servico,
        valores: dados.valores,
        status: 'autorizada',
        autorizadaEm: agora,
        historico: (original ? original.historico : []).concat(
          original ? [{ data: agora, evento: 'Dados corrigidos e reenviados' }] : [{ data: agora, evento: 'Nota enviada para autorização' }],
          [{ data: agora, evento: 'Nota autorizada pela prefeitura' }]
        ),
      };
      delete n.motivoRejeicao;
      n.chave = gerarChave(n);
      n.protocolo = gerarProtocolo(agora);
      return this.salvarNota(n);
    },

    cancelar(id, motivo) {
      const n = this.nota(id);
      if (!n) return null;
      const agora = U.isoDateTime();
      n.status = 'cancelada';
      n.canceladaEm = agora;
      n.motivoCancelamento = motivo;
      n.historico.push({ data: agora, evento: `Nota cancelada · ${motivo}` });
      return this.salvarNota(n);
    },

    /* Consulta simulada à prefeitura: nota pendente passa a autorizada */
    consultar(id) {
      const n = this.nota(id);
      if (!n || n.status !== 'pendente') return n;
      const agora = U.isoDateTime();
      n.status = 'autorizada';
      n.autorizadaEm = agora;
      n.protocolo = gerarProtocolo(agora);
      n.historico.push({ data: agora, evento: 'Nota autorizada pela prefeitura' });
      return this.salvarNota(n);
    },

    notificacoes() {
      const lidas = this.config().notificacoesLidas || [];
      const lista = [];
      this.notas().filter((n) => n.status === 'pendente').forEach((n) => lista.push({
        id: `pend-${n.id}`, icone: 'clock', titulo: `Nota #${n.numero} aguardando autorização`,
        texto: `${n.tomador.nome} · ${U.money(n.valores.servico)}`, link: `${rota('nota', { id: n.id })}`,
      }));
      this.notas().filter((n) => n.status === 'rejeitada').forEach((n) => lista.push({
        id: `rej-${n.id}`, icone: 'alert', titulo: `Nota #${n.numero} rejeitada`,
        texto: 'Corrija os dados e reenvie', link: `${rota('emitir', { editar: n.id })}`,
      }));
      const cert = this.config().certificado;
      if (cert) {
        const dias = Math.ceil((U.toDate(cert.validade) - new Date()) / 86400000);
        if (dias <= 365) lista.push({
          id: `cert-${cert.validade}`, icone: 'shield',
          titulo: dias < 0 ? 'Certificado digital vencido' : `Certificado digital vence em ${dias} dias`,
          texto: `Validade: ${U.dateBR(cert.validade)}`, link: rota('configuracoes') + '#certificado',
        });
      }
      return lista.map((x) => ({ ...x, lida: lidas.includes(x.id) }));
    },
    marcarNotificacoesLidas(ids) {
      const atual = new Set(this.config().notificacoesLidas || []);
      ids.forEach((i) => atual.add(i));
      this.salvarConfig({ notificacoesLidas: Array.from(atual) });
    },

    /* XML no padrão ABRASF simplificado */
    xml(n) {
      const e = this.empresa();
      const c = calc(n.valores);
      const x = (s) => U.esc(s);
      const [mun, uf] = (n.tomador.municipio || '').split('/').map((s) => s.trim());
      const doc = U.digits(n.tomador.doc);
      return `<?xml version="1.0" encoding="UTF-8"?>
<CompNfse xmlns="http://www.abrasf.org.br/nfse.xsd">
  <Nfse versao="2.04">
    <InfNfse Id="NFS${n.chave}">
      <Numero>${n.numero}</Numero>
      <CodigoVerificacao>${n.chave.slice(-8)}</CodigoVerificacao>
      <DataEmissao>${n.emissao}:00</DataEmissao>
      <Situacao>${x(n.status)}</Situacao>
      <Protocolo>${x(n.protocolo || '')}</Protocolo>
      <ValoresNfse>
        <BaseCalculo>${c.base.toFixed(2)}</BaseCalculo>
        <Aliquota>${Number(n.valores.aliquota).toFixed(2)}</Aliquota>
        <ValorIss>${c.iss.toFixed(2)}</ValorIss>
        <ValorLiquidoNfse>${c.liquido.toFixed(2)}</ValorLiquidoNfse>
      </ValoresNfse>
      <PrestadorServico>
        <IdentificacaoPrestador><CpfCnpj><Cnpj>${U.digits(e.cnpj)}</Cnpj></CpfCnpj><InscricaoMunicipal>${x(e.inscricaoMunicipal)}</InscricaoMunicipal></IdentificacaoPrestador>
        <RazaoSocial>${x(e.razaoSocial)}</RazaoSocial>
        <NomeFantasia>${x(e.nomeFantasia)}</NomeFantasia>
        <Endereco><Endereco>${x(e.endereco)}</Endereco><Cep>${U.digits(e.cep)}</Cep></Endereco>
        <Contato><Email>${x(e.email)}</Email></Contato>
      </PrestadorServico>
      <DeclaracaoPrestacaoServico>
        <InfDeclaracaoPrestacaoServico>
          <Competencia>${n.competencia}</Competencia>
          <Servico>
            <Valores>
              <ValorServicos>${c.servico.toFixed(2)}</ValorServicos>
              <DescontoIncondicionado>${c.desconto.toFixed(2)}</DescontoIncondicionado>
              <ValorIss>${c.iss.toFixed(2)}</ValorIss>
              <Aliquota>${Number(n.valores.aliquota).toFixed(2)}</Aliquota>
            </Valores>
            <IssRetido>${n.valores.issRetido ? 1 : 2}</IssRetido>
            <ItemListaServico>${x(n.servico.codigo)}</ItemListaServico>
            <Discriminacao>${x(n.servico.discriminacao)}</Discriminacao>
            <MunicipioIncidencia>${x(n.valores.local)}</MunicipioIncidencia>
          </Servico>
          <TomadorServico>
            <IdentificacaoTomador><CpfCnpj>${doc.length === 11 ? `<Cpf>${doc}</Cpf>` : `<Cnpj>${doc}</Cnpj>`}</CpfCnpj>${n.tomador.im ? `<InscricaoMunicipal>${x(n.tomador.im)}</InscricaoMunicipal>` : ''}</IdentificacaoTomador>
            <RazaoSocial>${x(n.tomador.nome)}</RazaoSocial>
            <Endereco>
              <Endereco>${x(n.tomador.logradouro)}</Endereco>
              <Bairro>${x(n.tomador.bairro)}</Bairro>
              <Municipio>${x(mun)}</Municipio>
              <Uf>${x(uf)}</Uf>
              <Cep>${U.digits(n.tomador.cep)}</Cep>
            </Endereco>
            <Contato><Email>${x(n.tomador.email)}</Email></Contato>
          </TomadorServico>
        </InfDeclaracaoPrestacaoServico>
      </DeclaracaoPrestacaoServico>
    </InfNfse>
  </Nfse>
</CompNfse>
`;
    },

    /* Apaga tudo e volta aos dados de demonstração */
    contaDemo,
    restaurarDemo() {
      [K.notas, K.empresa, K.config, K.versao].forEach((k) => localStorage.removeItem(k));
      init();
    },
  };

  init();
  window.Store = Store;
})();
