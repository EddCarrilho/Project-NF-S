/* Monta a barra lateral, o cabeçalho e o rodapé em todas as páginas internas. */
(function () {
  const sessao = Store.garantirSessao();
  if (!sessao) { location.replace(APP_CONFIG.loginUrl); return; }

  const app = document.querySelector('.app');
  const main = document.querySelector('.main');
  const pagina = app.dataset.page;
  const empresa = Store.empresa();

  const itens = [
    { id: 'visao', href: 'index.html', label: 'Visão geral', ic: 'grid' },
    { id: 'emitir', href: 'emitir.html', label: 'Emitir NFS-e', ic: 'plusCircle' },
    { id: 'historico', href: 'historico.html', label: 'Histórico de notas', ic: 'files' },
    { id: 'config', href: 'configuracoes.html', label: 'Configurações', ic: 'gear' },
  ];

  /* ---------- Barra lateral ---------- */
  const aside = document.createElement('aside');
  aside.className = 'sidebar';
  aside.id = 'sidebar';
  aside.setAttribute('aria-label', 'Menu principal');
  aside.innerHTML = `
    <a class="brand" href="index.html" aria-label="Nota Fácil · Visão geral">
      ${logoMark(24)}<span class="brand__text"><b>NOTA</b><span>FÁCIL</span></span>
    </a>
    <div class="company-card">
      <strong data-empresa-nome>${U.esc(empresa.nomeFantasia || empresa.razaoSocial)}</strong>
      <small data-empresa-cnpj>CNPJ ${U.esc(empresa.cnpj)}</small>
    </div>
    <nav class="nav">
      ${itens.map((i) => `<a href="${i.href}" class="${i.id === pagina ? 'is-active' : ''}" ${i.id === pagina ? 'aria-current="page"' : ''}>${icon(i.ic, 20)}<span>${i.label}</span></a>`).join('')}
    </nav>
    <div class="sidebar__safe">${icon('shield', 16)}<span>Ambiente seguro e protegido</span></div>`;
  app.insertBefore(aside, main);

  /* ---------- Cabeçalho ---------- */
  const header = document.createElement('header');
  header.className = 'topbar';
  header.innerHTML = `
    <button class="icon-btn topbar__menu" type="button" aria-label="Abrir menu" aria-controls="sidebar" aria-expanded="false" data-menu>${icon('menu', 22)}</button>
    <div class="dropdown" data-dd="notif">
      <button class="icon-btn" type="button" aria-label="Notificações" aria-haspopup="true" aria-expanded="false">${icon('bell', 20)}<span class="badge-dot" hidden></span></button>
      <div class="dropdown__panel notif-panel" hidden></div>
    </div>
    <span class="topbar__divider" aria-hidden="true"></span>
    <div class="dropdown" data-dd="user">
      <button class="user-btn" type="button" aria-haspopup="true" aria-expanded="false">
        <span class="avatar">${U.esc(U.initials(sessao.nome))}</span>
        <span class="user-name">${U.esc(sessao.nome)}</span>
        <span class="chev">${icon('chevronDown', 16)}</span>
      </button>
      <div class="dropdown__panel" hidden>
        <div class="dropdown__head"><strong>${U.esc(sessao.nome)}</strong><small>${U.esc(sessao.email || '')}${sessao.perfil ? ` · ${U.esc(sessao.perfil)}` : ''}</small></div>
        <a href="configuracoes.html">${icon('gear', 16)} Configurações</a>
        <a href="configuracoes.html#seguranca">${icon('lock', 16)} Segurança da conta</a>
        <button type="button" class="menu-item" data-logout>${icon('logout', 16)} Sair</button>
      </div>
    </div>`;
  main.insertBefore(header, main.firstChild);

  const footer = document.createElement('footer');
  footer.className = 'footer';
  footer.textContent = `© ${new Date().getFullYear()} Nota Fácil · Gestão fiscal de forma simples e prática`;
  main.appendChild(footer);

  /* ---------- Dropdowns ---------- */
  const dds = U.$$('.dropdown', header);
  const fecharTodos = (exceto) => dds.forEach((d) => {
    if (d === exceto) return;
    d.querySelector('.dropdown__panel').hidden = true;
    d.querySelector('button').setAttribute('aria-expanded', 'false');
  });
  dds.forEach((dd) => {
    const btn = dd.querySelector('button');
    const panel = dd.querySelector('.dropdown__panel');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const abrir = panel.hidden;
      fecharTodos(dd);
      if (dd.dataset.dd === 'notif' && abrir) renderNotificacoes();
      panel.hidden = !abrir;
      btn.setAttribute('aria-expanded', String(abrir));
    });
    panel.addEventListener('click', (e) => e.stopPropagation());
  });
  document.addEventListener('click', () => fecharTodos());
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { fecharTodos(); fecharMenu(); } });

  header.querySelector('[data-logout]').addEventListener('click', async () => {
    const ok = await U.modal({ title: 'Sair da conta?', text: 'Você precisará entrar novamente para acessar suas notas.', confirm: 'Sair' });
    if (!ok) return;
    Store.sair();
    location.href = APP_CONFIG.loginUrl;
  });

  /* ---------- Notificações ---------- */
  const badge = header.querySelector('.badge-dot');
  const panelNotif = header.querySelector('.notif-panel');
  function atualizarBadge() {
    const n = Store.notificacoes().filter((x) => !x.lida).length;
    badge.hidden = n === 0;
    badge.textContent = n;
  }
  function renderNotificacoes() {
    const lista = Store.notificacoes();
    panelNotif.innerHTML = `
      <h3>Notificações ${lista.some((x) => !x.lida) ? '<button type="button" data-ler>Marcar como lidas</button>' : ''}</h3>
      ${lista.length ? `<ul class="notif-list">${lista.map((n) => `
        <li class="${n.lida ? '' : 'is-unread'}"><a href="${n.link}" data-nid="${n.id}">
          <span class="notif-ico">${icon(n.icone, 16)}</span>
          <span><strong>${U.esc(n.titulo)}</strong><small>${U.esc(n.texto)}</small></span>
        </a></li>`).join('')}</ul>` : '<div class="notif-empty">Tudo em dia. Nenhuma notificação.</div>'}`;
    const ler = panelNotif.querySelector('[data-ler]');
    if (ler) ler.addEventListener('click', () => { Store.marcarNotificacoesLidas(lista.map((x) => x.id)); renderNotificacoes(); atualizarBadge(); });
    U.$$('[data-nid]', panelNotif).forEach((a) => a.addEventListener('click', () => Store.marcarNotificacoesLidas([a.dataset.nid])));
  }
  atualizarBadge();
  window.atualizarNotificacoes = atualizarBadge;

  /* ---------- Menu no celular ---------- */
  const btnMenu = header.querySelector('[data-menu]');
  function fecharMenu() { app.classList.remove('nav-open'); btnMenu.setAttribute('aria-expanded', 'false'); }
  btnMenu.addEventListener('click', (e) => {
    e.stopPropagation();
    const aberto = app.classList.toggle('nav-open');
    btnMenu.setAttribute('aria-expanded', String(aberto));
  });
  app.addEventListener('click', (e) => { if (app.classList.contains('nav-open') && !aside.contains(e.target) && e.target !== btnMenu) fecharMenu(); });

  /* Atualiza o cartão da empresa quando os dados mudam */
  window.atualizarEmpresaLateral = () => {
    const e = Store.empresa();
    aside.querySelector('[data-empresa-nome]').textContent = e.nomeFantasia || e.razaoSocial;
    aside.querySelector('[data-empresa-cnpj]').textContent = `CNPJ ${e.cnpj}`;
  };

  /* Ícones declarados no HTML: <button data-ic="plus">Texto</button> */
  U.$$('[data-ic]').forEach((el) => el.insertAdjacentHTML('afterbegin', icon(el.dataset.ic, Number(el.dataset.icSize) || 18)));

  /* Utilitário compartilhado: selo de status */
  window.statusBadge = (s) => {
    const map = {
      autorizada: ['checkCircle', 'Autorizada'],
      pendente: ['clock', 'Pendente'],
      cancelada: ['xCircle', 'Cancelada'],
      rejeitada: ['alert', 'Rejeitada'],
    };
    const [ic, txt] = map[s] || ['alert', s];
    return `<span class="status status--${s}">${icon(ic, 14)}${txt}</span>`;
  };
  /* Link de e-mail compartilhado com a página da nota */
  window.NotaEmail = {
    link(n) {
      const e = Store.empresa();
      const c = Store.calc(n.valores);
      const assunto = `NFS-e nº ${n.numero} · ${e.nomeFantasia || e.razaoSocial}`;
      const corpo = `Olá, ${n.tomador.nome}.\n\nSegue a Nota Fiscal de Serviço nº ${n.numero}, emitida em ${U.dateBR(n.emissao)}, no valor líquido de ${U.money(c.liquido)}.\n\nChave de acesso: ${n.chave}\nProtocolo: ${n.protocolo}\n\nO PDF e o XML seguem em anexo.\n\nAtenciosamente,\n${e.razaoSocial}\n${e.email}`;
      return `mailto:${encodeURIComponent(n.tomador.email)}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
    },
  };
})();
