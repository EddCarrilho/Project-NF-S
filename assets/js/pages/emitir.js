/* Página: Emitir NFS-e (formulário, validação, envio simulado e resultado) */
(function () {
  const form = U.$('#form-nota');
  const f = (id) => U.$('#' + id);
  const idEdicao = U.param('editar');
  const original = idEdicao ? Store.nota(idEdicao) : null;
  const empresa = Store.empresa();
  const municipioEmpresa = (empresa.endereco.split('·')[1] || 'São Paulo / SP').trim();
  let sujo = false;

  /* ---------- Listas ---------- */
  U.$('#lista-municipios').innerHTML = Store.MUNICIPIOS.map((m) => `<option value="${m}">`).join('');
  f('codigo').insertAdjacentHTML('beforeend', Store.SERVICOS.map((s) => `<option value="${s.codigo}">${s.codigo} · ${s.nome}</option>`).join(''));
  const clientes = Store.clientes();
  f('cliente').insertAdjacentHTML('beforeend', clientes.map((c, i) => `<option value="${i}">${U.esc(c.nome)} · ${U.esc(c.doc)}</option>`).join(''));

  /* ---------- Máscaras ---------- */
  U.mask(f('doc'), 'doc');
  U.mask(f('cep'), 'cep');
  U.mask(f('valor'), 'money');
  U.mask(f('desconto'), 'money');
  U.mask(f('aliquota'), 'percent');
  U.mask(f('im'), 'digits');

  /* ---------- Preenchimento ---------- */
  function preencherTomador(t) {
    f('doc').value = t.doc || '';
    f('nome').value = t.nome || '';
    f('email').value = t.email || '';
    f('im').value = t.im || '';
    f('cep').value = t.cep || '';
    f('municipio').value = t.municipio || '';
    f('logradouro').value = t.logradouro || '';
    f('bairro').value = t.bairro || '';
  }

  if (original) {
    if (original.status === 'cancelada') {
      U.toast('Notas canceladas não podem ser editadas.', 'error');
      setTimeout(() => (location.href = `${rota('nota', { id: original.id })}`), 900);
    }
    document.title = `Editar NFS-e #${original.numero} · Nota Fácil`;
    U.$('[data-crumb]').textContent = `Editar nota #${original.numero}`;
    U.$('[data-titulo]').textContent = `Editar NFS-e #${original.numero}`;
    U.$('[data-emitir]').lastChild.textContent = 'Reenviar NFS-e';
    preencherTomador(original.tomador);
    f('competencia').value = original.competencia;
    f('codigo').value = original.servico.codigo;
    f('discriminacao').value = original.servico.discriminacao;
    f('valor').value = U.number2(original.valores.servico);
    f('desconto').value = U.number2(original.valores.desconto);
    f('aliquota').value = U.number2(original.valores.aliquota);
    f('retido').value = original.valores.issRetido ? 'sim' : 'nao';
    f('local').value = original.valores.local;
    if (original.status === 'rejeitada') {
      const r = U.$('[data-resumo-erros]');
      r.hidden = false;
      r.innerHTML = `${icon('alert', 20)}<div><strong>Esta nota foi rejeitada pela prefeitura</strong>${U.esc(original.motivoRejeicao || '')}. Corrija os dados e reenvie.</div>`;
    }
  } else {
    f('competencia').value = U.isoDate();
    f('aliquota').value = '2,00';
    f('desconto').value = '0,00';
    f('local').value = municipioEmpresa;
  }
  contar();

  f('cliente').addEventListener('change', (e) => {
    const c = clientes[e.target.value];
    if (!c) return;
    preencherTomador(c);
    if (!f('local').value) f('local').value = c.municipio;
    ['doc', 'nome', 'email', 'cep', 'municipio', 'logradouro'].forEach((id) => validarCampo(id));
    sujo = true;
    U.toast(`Dados de ${c.nome} preenchidos.`);
  });

  /* Ao digitar um documento já usado, reaproveita o cadastro */
  f('doc').addEventListener('blur', () => {
    const c = clientes.find((x) => U.digits(x.doc) === U.digits(f('doc').value));
    if (c && !f('nome').value) {
      preencherTomador(c);
      U.toast(`Cliente encontrado: ${c.nome}.`);
    }
  });

  /* ---------- Busca de CEP (ViaCEP) ---------- */
  const cepStatus = U.$('[data-cep-status]');
  let ultimoCep = U.digits(f('cep').value);
  f('cep').addEventListener('input', async () => {
    const cep = U.digits(f('cep').value);
    if (cep.length !== 8 || cep === ultimoCep) return;
    ultimoCep = cep;
    cepStatus.innerHTML = '<span class="spinner" style="width:16px;height:16px;border-width:2px;margin:0"></span>';
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 6000);
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: ctrl.signal });
      clearTimeout(t);
      const d = await r.json();
      if (d.erro) {
        cepStatus.innerHTML = '';
        U.setFieldError(f('cep'), 'CEP não encontrado. Confira os números ou preencha o endereço manualmente.');
        return;
      }
      f('municipio').value = `${d.localidade} / ${d.uf}`;
      if (d.logradouro) f('logradouro').value = d.logradouro + ', ';
      f('bairro').value = d.bairro || '';
      cepStatus.innerHTML = icon('checkCircle', 18);
      ['cep', 'municipio', 'logradouro'].forEach((id) => U.setFieldError(f(id), ''));
      if (d.logradouro) { f('logradouro').focus(); f('logradouro').setSelectionRange(999, 999); }
      recalcular();
    } catch (e) {
      cepStatus.innerHTML = '';
      U.toast('Não foi possível consultar o CEP agora. Preencha o endereço manualmente.', 'error');
    }
  });

  /* ---------- Cálculo ao vivo ---------- */
  function valores() {
    return {
      servico: U.parseMoney(f('valor').value),
      desconto: U.parseMoney(f('desconto').value),
      aliquota: U.parseMoney(f('aliquota').value),
      issRetido: f('retido').value === 'sim',
      local: f('local').value.trim(),
    };
  }
  function recalcular() {
    const c = Store.calc(valores());
    U.$('[data-r="servico"]').textContent = U.money(c.servico);
    U.$('[data-r="deducoes"]').textContent = U.money(c.deducoes);
    U.$('[data-r="liquido"]').textContent = U.money(c.liquido);
    U.$('[data-r="iss"]').textContent = `ISS ${U.money(c.iss)}${c.retencoes ? ' retido pelo tomador' : ' a recolher pelo prestador'}`;
  }
  function contar() { U.$('[data-contador]').textContent = f('discriminacao').value.length; }
  ['valor', 'desconto', 'aliquota', 'retido'].forEach((id) => f(id).addEventListener('input', recalcular));
  f('retido').addEventListener('change', recalcular);
  f('discriminacao').addEventListener('input', contar);
  recalcular();

  /* ---------- Validação ---------- */
  const reCidadeUF = /^.{2,}\s*\/\s*[A-Za-z]{2}$/;
  const regras = {
    doc: (v) => {
      const d = U.digits(v);
      if (!d) return 'Informe o CPF ou CNPJ do tomador.';
      if (d.length !== 11 && d.length !== 14) return 'O CPF tem 11 números e o CNPJ tem 14.';
      if (d.length === 11 && !U.isCPF(d)) return 'CPF inválido. Confira os números digitados.';
      if (d.length === 14 && !U.isCNPJ(d)) return 'CNPJ inválido. Confira os números digitados.';
      return '';
    },
    nome: (v) => (v.trim().length < 3 ? 'Informe a razão social ou o nome do tomador.' : ''),
    email: (v) => (v.trim() && !U.isEmail(v) ? 'E-mail inválido. Exemplo: financeiro@empresa.com.br' : ''),
    cep: (v) => (U.digits(v).length !== 8 ? 'Informe um CEP com 8 números.' : ''),
    municipio: (v) => (!v.trim() ? 'Informe o município do tomador.' : !reCidadeUF.test(v.trim()) ? 'Use o formato Cidade / UF. Exemplo: São Paulo / SP' : ''),
    logradouro: (v) => (v.trim().replace(/,\s*$/, '').length < 3 ? 'Informe o logradouro e o número.' : ''),
    competencia: (v) => (!v ? 'Informe a competência (mês em que o serviço foi prestado).' : v > U.isoDate() ? 'A competência não pode ser uma data futura.' : ''),
    codigo: (v) => (!v ? 'Selecione o código do serviço.' : ''),
    discriminacao: (v) => (v.trim().length < 10 ? 'Descreva o serviço prestado (mínimo de 10 caracteres).' : ''),
    valor: (v) => (U.parseMoney(v) <= 0 ? 'Informe o valor do serviço.' : ''),
    desconto: (v) => (U.parseMoney(v) > U.parseMoney(f('valor').value) ? 'O desconto não pode ser maior que o valor do serviço.' : ''),
    aliquota: (v) => { const a = U.parseMoney(v); return !a ? 'Informe a alíquota do ISS.' : a < 2 || a > 5 ? 'A alíquota do ISS deve ficar entre 2% e 5%.' : ''; },
    local: (v) => (!v.trim() ? 'Informe o local de incidência do ISS.' : !reCidadeUF.test(v.trim()) ? 'Use o formato Cidade / UF.' : ''),
    conferi: () => (!f('conferi').checked ? 'Marque a confirmação para emitir a nota.' : ''),
  };
  const nomes = {
    doc: 'CPF ou CNPJ', nome: 'Razão social / Nome', email: 'E-mail', cep: 'CEP', municipio: 'Município / UF', logradouro: 'Logradouro e número',
    competencia: 'Competência', codigo: 'Código do serviço', discriminacao: 'Discriminação do serviço', valor: 'Valor do serviço',
    desconto: 'Desconto', aliquota: 'Alíquota do ISS', local: 'Local de incidência', conferi: 'Confirmação',
  };
  function validarCampo(id) {
    const msg = regras[id](f(id).value);
    U.setFieldError(f(id), msg);
    return msg;
  }
  Object.keys(regras).forEach((id) => {
    const el = f(id);
    el.addEventListener('blur', () => { if (el.value || el.closest('.is-invalid')) validarCampo(id); });
    el.addEventListener(id === 'conferi' ? 'change' : 'input', () => {
      if (el.closest('.is-invalid') || (el.closest('.check') && el.closest('.check').classList.contains('is-invalid'))) validarCampo(id);
      if (id === 'valor' && f('desconto').closest('.is-invalid')) validarCampo('desconto');
    });
  });

  form.addEventListener('input', () => (sujo = true));
  window.addEventListener('beforeunload', (e) => { if (sujo) { e.preventDefault(); e.returnValue = ''; } });

  U.$('[data-cancelar]').addEventListener('click', async () => {
    if (sujo) {
      const ok = await U.modal({ title: 'Descartar esta nota?', text: 'Os dados preenchidos serão perdidos.', confirm: 'Descartar', cancel: 'Continuar editando', danger: true });
      if (!ok) return;
    }
    sujo = false;
    location.href = original ? rota('historico') : rota('dashboard');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const erros = Object.keys(regras).map((id) => ({ id, msg: validarCampo(id) })).filter((x) => x.msg);
    const box = U.$('[data-resumo-erros]');
    if (erros.length) {
      box.hidden = false;
      box.innerHTML = `${icon('alert', 20)}<div><strong>${erros.length === 1 ? 'Falta corrigir 1 campo' : `Faltam corrigir ${erros.length} campos`} antes de emitir</strong>
        <ul>${erros.map((x) => `<li><a href="#${x.id}" data-foco="${x.id}">${nomes[x.id]}</a>: ${U.esc(x.msg)}</li>`).join('')}</ul></div>`;
      U.$$('[data-foco]', box).forEach((a) => a.addEventListener('click', (ev) => { ev.preventDefault(); f(a.dataset.foco).focus(); f(a.dataset.foco).scrollIntoView({ block: 'center', behavior: 'smooth' }); }));
      box.scrollIntoView({ block: 'start', behavior: 'smooth' });
      box.focus({ preventScroll: true });
      return;
    }
    box.hidden = true;
    enviar();
  });

  /* ---------- Etapa 2: envio (simulado) e resultado ---------- */
  const etapa2 = U.$('[data-etapa2]');
  function irParaEtapa2() {
    form.hidden = true;
    etapa2.hidden = false;
    U.$('[data-step="1"]').classList.replace('is-active', 'is-done');
    U.$('[data-step="1"] b').innerHTML = icon('checkCircle', 14);
    U.$('[data-step="2"]').classList.add('is-active');
    U.$('[data-line]').classList.add('is-done');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function enviar() {
    sujo = false;
    const t = {
      doc: U.formatDoc(f('doc').value), nome: f('nome').value.trim(), email: f('email').value.trim(), im: f('im').value.trim(),
      cep: U.formatCEP(f('cep').value), municipio: f('municipio').value.trim(), logradouro: f('logradouro').value.trim().replace(/,\s*$/, ''), bairro: f('bairro').value.trim(),
    };
    const dados = {
      competencia: f('competencia').value,
      tomador: t,
      servico: { codigo: f('codigo').value, discriminacao: f('discriminacao').value.trim() },
      valores: valores(),
    };
    irParaEtapa2();
    etapa2.innerHTML = `<div class="result">
      <div class="spinner" role="progressbar" aria-label="Enviando"></div>
      <h2>Enviando para a prefeitura…</h2>
      <p data-msg>Assinando a nota com o certificado digital.</p>
    </div>`;
    const msg = etapa2.querySelector('[data-msg]');
    setTimeout(() => (msg.textContent = 'Aguardando a autorização da prefeitura.'), 900);
    setTimeout(() => mostrarResultado(Store.emitir(dados, original && original.id)), 1900);
  }

  function mostrarResultado(n) {
    const c = Store.calc(n.valores);
    etapa2.innerHTML = `<div class="result">
      <span class="demo-tag">${icon('alert', 12)}Ambiente de demonstração · autorização simulada</span>
      <div class="result__icon">${icon('checkCircle', 36)}</div>
      <h2>${original ? 'NFS-e corrigida e autorizada' : 'NFS-e autorizada com sucesso'}</h2>
      <p>A nota #${n.numero} para ${U.esc(n.tomador.nome)} foi autorizada. ${n.tomador.email ? 'Você já pode enviá-la por e-mail ao cliente.' : 'Baixe o PDF ou o XML para enviar ao cliente.'}</p>
      <div class="result__meta">
        <div><span>Número</span><strong>#${n.numero}</strong></div>
        <div><span>Valor líquido</span><strong>${U.money(c.liquido)}</strong></div>
        <div><span>Status</span>${statusBadge(n.status)}</div>
        <div style="grid-column:1/-1"><span>Protocolo de autorização</span><strong>${n.protocolo} · ${U.dateTimeBR(n.autorizadaEm)}</strong></div>
      </div>
      <div class="result__btns">
        <a class="btn btn-primary" href="${rota('nota', { id: n.id })}">${icon('fileText', 18)}Ver nota e PDF</a>
        <button class="btn btn-outline" type="button" data-xml>${icon('code', 18)}Baixar XML</button>
        ${n.tomador.email ? `<button class="btn btn-outline" type="button" data-email>${icon('mail', 18)}Enviar por e-mail</button>` : ''}
        <a class="btn btn-outline" href="${rota('emitir')}">${icon('plus', 18)}Emitir outra nota</a>
      </div>
    </div>`;
    etapa2.querySelector('[data-xml]').addEventListener('click', () => {
      U.download(`NFS-e_${n.numero}.xml`, Store.xml(n), 'application/xml');
      U.toast('XML baixado.');
    });
    const em = etapa2.querySelector('[data-email]');
    if (em) em.addEventListener('click', () => (location.href = NotaEmail.link(n)));
    U.toast(`Nota #${n.numero} autorizada.`);
    if (window.atualizarNotificacoes) atualizarNotificacoes();
  }

})();
