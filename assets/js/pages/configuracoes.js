/* Página: Configurações (empresa, logo, segurança e certificado) */
(function () {
  const f = (id) => U.$('#' + id);
  const sessao = Store.sessao();

  /* ---------- Dados cadastrais ---------- */
  const campos = { razaoSocial: 'razaoSocial', nomeFantasia: 'nomeFantasia', inscricaoMunicipal: 'inscricaoMunicipal', regime: 'regime', email: 'emailEmpresa', endereco: 'endereco', cep: 'cepEmpresa' };
  function carregarEmpresa() {
    const e = Store.empresa();
    f('cnpj').value = e.cnpj;
    Object.entries(campos).forEach(([k, id]) => (f(id).value = e[k] || ''));
  }
  carregarEmpresa();
  U.mask(f('cepEmpresa'), 'cep');
  U.mask(f('inscricaoMunicipal'), 'digits');

  const regrasEmpresa = {
    razaoSocial: (v) => (v.trim().length < 3 ? 'Informe a razão social.' : ''),
    inscricaoMunicipal: (v) => (U.digits(v).length < 4 ? 'Informe a inscrição municipal.' : ''),
    emailEmpresa: (v) => (!U.isEmail(v) ? 'Informe um e-mail válido.' : ''),
    endereco: (v) => (!/\/\s*[A-Za-z]{2}\s*$/.test(v.trim()) ? 'Inclua a cidade e a UF no final. Exemplo: Rua A, 10 · São Paulo / SP' : ''),
    cepEmpresa: (v) => (U.digits(v).length !== 8 ? 'Informe um CEP com 8 números.' : ''),
  };
  Object.keys(regrasEmpresa).forEach((id) => f(id).addEventListener('input', () => {
    if (f(id).closest('.is-invalid')) U.setFieldError(f(id), regrasEmpresa[id](f(id).value));
  }));

  f('form-empresa').addEventListener('submit', (e) => {
    e.preventDefault();
    let primeiro = null;
    Object.entries(regrasEmpresa).forEach(([id, r]) => { const m = r(f(id).value); U.setFieldError(f(id), m); if (m && !primeiro) primeiro = f(id); });
    if (primeiro) { primeiro.focus(); U.toast('Confira os campos destacados.', 'error'); return; }
    const dados = {};
    Object.entries(campos).forEach(([k, id]) => (dados[k] = f(id).value.trim()));
    dados.cep = U.formatCEP(dados.cep);
    Store.salvarEmpresa(dados);
    if (window.atualizarEmpresaLateral) atualizarEmpresaLateral();
    U.toast('Dados cadastrais salvos.');
  });

  /* ---------- Logo ---------- */
  const thumb = U.$('[data-logo-thumb]');
  const inputLogo = U.$('[data-logo-input]');
  const dz = U.$('[data-dropzone]');
  function renderLogo() {
    const l = Store.config().logo;
    thumb.innerHTML = l ? `<img src="${l.dataUrl}" alt="Logo atual da empresa">` : icon('image', 34, 'style="color:#A2A2A2"');
    U.$('[data-logo-nome]').textContent = l ? l.nome : 'Nenhuma logo enviada';
    U.$('[data-logo-info]').textContent = l ? `${U.fileSize(l.tamanho)} · Enviada em ${U.dateBR(l.data)}` : 'Os documentos usarão o nome da empresa.';
    U.$('[data-dz-txt]').textContent = l ? 'Clique para substituir o arquivo' : 'Clique para enviar o arquivo';
    U.$('[data-logo-remover]').hidden = !l;
  }
  async function receberLogo(file) {
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) return U.toast('Envie uma imagem PNG ou JPG.', 'error');
    if (file.size > 2 * 1024 * 1024) return U.toast('A imagem precisa ter até 2 MB.', 'error');
    const dataUrl = await U.readFileAsDataURL(file);
    if (Store.salvarConfig({ logo: { dataUrl, nome: file.name, tamanho: file.size, data: U.isoDate() } })) {
      renderLogo();
      U.toast('Logo atualizada. Ela já aparece nos PDFs das notas.');
    }
  }
  inputLogo.addEventListener('change', () => { receberLogo(inputLogo.files[0]); inputLogo.value = ''; });
  ['dragenter', 'dragover'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('is-over'); }));
  ['dragleave', 'drop'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove('is-over'); }));
  dz.addEventListener('drop', (e) => receberLogo(e.dataTransfer.files[0]));
  U.$('[data-logo-remover]').addEventListener('click', async () => {
    if (!(await U.modal({ title: 'Remover a logo?', text: 'Os próximos PDFs usarão o nome da empresa no lugar da logo.', confirm: 'Remover', danger: true }))) return;
    Store.salvarConfig({ logo: null });
    renderLogo();
    U.toast('Logo removida.');
  });
  renderLogo();

  /* ---------- Senha ---------- */
  f('emailAcesso').value = sessao.email || '';
  U.$$('[data-olho]').forEach((b) => {
    const inp = b.previousElementSibling;
    const set = () => { const vis = inp.type === 'text'; b.innerHTML = icon(vis ? 'eye' : 'eyeOff', 18); b.setAttribute('aria-label', vis ? 'Ocultar senha' : 'Mostrar senha'); };
    b.addEventListener('click', () => { inp.type = inp.type === 'password' ? 'text' : 'password'; set(); });
    set();
  });
  f('form-senha').addEventListener('submit', (e) => {
    e.preventDefault();
    const atual = f('senhaAtual'), nova = f('novaSenha'), conf = f('confirmarSenha');
    const cfg = Store.config();
    const erros = [
      [atual, !atual.value ? 'Digite sua senha atual.' : atual.value !== cfg.senha ? 'Senha atual incorreta.' : ''],
      [nova, nova.value.length < 8 ? 'A nova senha precisa ter no mínimo 8 caracteres.' : !/\d/.test(nova.value) || !/[a-zA-Z]/.test(nova.value) ? 'Use letras e números na nova senha.' : nova.value === atual.value ? 'A nova senha precisa ser diferente da atual.' : ''],
      [conf, conf.value !== nova.value || !conf.value ? 'As senhas não conferem.' : ''],
    ];
    erros.forEach(([el, m]) => U.setFieldError(el, m));
    const primeiro = erros.find(([, m]) => m);
    if (primeiro) { primeiro[0].focus(); return; }
    Store.salvarConfig({ senha: nova.value });
    [atual, nova, conf].forEach((el) => (el.value = ''));
    U.toast('Senha atualizada com sucesso.');
  });
  ['senhaAtual', 'novaSenha', 'confirmarSenha'].forEach((id) => f(id).addEventListener('input', () => U.setFieldError(f(id), '')));

  /* ---------- Verificação em duas etapas ---------- */
  const sw = U.$('[data-2fa]');
  const est = U.$('[data-2fa-estado]');
  const render2fa = () => { const on = Store.config().doisFatores; sw.checked = on; est.textContent = on ? '✓ Ativada para este acesso' : 'Desativada. Recomendamos manter ativada.'; };
  sw.addEventListener('change', async () => {
    if (!sw.checked) {
      const ok = await U.modal({ title: 'Desativar a verificação em duas etapas?', text: 'Sua conta ficará protegida apenas pela senha.', confirm: 'Desativar', danger: true });
      if (!ok) { sw.checked = true; return; }
    }
    Store.salvarConfig({ doisFatores: sw.checked });
    render2fa();
    U.toast(sw.checked ? 'Verificação em duas etapas ativada.' : 'Verificação em duas etapas desativada.');
  });
  render2fa();

  /* ---------- Certificado digital ---------- */
  function renderCert() {
    const c = Store.config().certificado;
    const box = U.$('[data-cert-box]');
    if (!c) {
      box.classList.add('is-warning');
      U.$('[data-cert-titulo]').textContent = 'Nenhum certificado instalado';
      U.$('[data-cert-sub]').textContent = 'Envie um certificado A1 para emitir notas.';
      U.$('[data-cert-kv]').innerHTML = '';
      return;
    }
    const dias = Math.ceil((U.toDate(c.validade) - new Date()) / 86400000);
    box.classList.toggle('is-warning', dias < 30);
    U.$('[data-cert-titulo]').textContent = dias < 0 ? `Certificado ${c.tipo} vencido` : `Certificado ${c.tipo} ativo`;
    U.$('[data-cert-sub]').textContent = dias < 0 ? 'Substitua o certificado para voltar a emitir.' : dias < 30 ? `Vence em ${dias} dias. Providencie a renovação.` : 'Seu certificado está válido e pronto para emitir.';
    U.$('[data-cert-kv]').innerHTML = [
      ['Titular', c.titular], ['CNPJ', c.cnpj], ['Validade', U.dateBR(c.validade)], ['Última atualização', U.dateTimeBR(c.atualizado)], ['Arquivo', c.arquivo],
    ].map(([k, v]) => `<div><span>${k}</span><strong>${U.esc(v)}</strong></div>`).join('');
  }
  const inputCert = U.$('[data-cert-input]');
  inputCert.addEventListener('change', async () => {
    const file = inputCert.files[0];
    inputCert.value = '';
    if (!file) return;
    if (!/\.(pfx|p12)$/i.test(file.name)) return U.toast('Envie um arquivo .pfx ou .p12.', 'error');
    let senha = '';
    const ok = await U.modal({
      title: 'Senha do certificado',
      text: `Digite a senha do arquivo ${file.name}. Ela é usada só para validar o certificado e não fica salva.`,
      html: '<div class="field"><label for="senha-cert">Senha *</label><input id="senha-cert" type="password" class="input" autocomplete="off"></div>',
      confirm: 'Instalar certificado',
      onConfirm(m) {
        const inp = m.querySelector('#senha-cert');
        senha = inp.value;
        U.setFieldError(inp, senha.length < 4 ? 'Digite a senha do certificado.' : '');
        return senha.length >= 4;
      },
    });
    if (!ok) return;
    const e = Store.empresa();
    const validade = new Date(); validade.setFullYear(validade.getFullYear() + 1);
    Store.salvarConfig({ certificado: { tipo: 'A1', titular: e.razaoSocial, cnpj: e.cnpj, validade: U.isoDate(validade), atualizado: U.isoDateTime(), arquivo: file.name } });
    renderCert();
    if (window.atualizarNotificacoes) atualizarNotificacoes();
    U.toast('Certificado instalado com sucesso.');
  });
  renderCert();

  /* ---------- Restaurar demonstração (só na conta de demonstração) ---------- */
  if (!Store.contaDemo) U.$('[data-restaurar]').closest('.card').hidden = true;
  U.$('[data-restaurar]').addEventListener('click', async () => {
    const ok = await U.modal({ title: 'Restaurar dados de exemplo?', text: 'Todas as notas e configurações salvas neste navegador serão substituídas pelos dados de demonstração.', confirm: 'Restaurar', danger: true });
    if (!ok) return;
    Store.restaurarDemo();
    location.reload();
  });

  /* Rolagem para a seção indicada no endereço (ex.: #certificado) */
  if (location.hash) { const alvo = U.$(location.hash); if (alvo) setTimeout(() => alvo.scrollIntoView({ behavior: 'smooth' }), 100); }
})();
