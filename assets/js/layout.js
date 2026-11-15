/* ==========================================================================
   Monta a barra lateral, o cabeçalho e o rodapé de todas as páginas internas,
   usando o visual do dashboard (assets/css/dashboard.css).

   Estrutura esperada no HTML de cada página:
     <div class="dashboard-layout" data-page="emitir">
       <main class="dashboard-content"> ...conteúdo... </main>
     </div>
   data-page: dashboard | emitir | historico | configuracoes
   ========================================================================== */
(function () {
  const sessao = Store.garantirSessao();
  if (!sessao) { location.replace(rota('login')); return; }

  const layout = document.querySelector('.dashboard-layout');
  const main = layout.querySelector('.dashboard-content');
  const pagina = layout.dataset.page;
  const empresa = Store.empresa();

  const itens = [
    { id: 'dashboard', label: 'Visão geral', ic: 'grid' },
    { id: 'emitir', label: 'Emitir NFS-e', ic: 'plusCircle' },
    { id: 'historico', label: 'Histórico de notas', ic: 'fileText' },
    { id: 'configuracoes', label: 'Configurações', ic: 'gear' },
  ];

  /* ---------- Barra lateral ---------- */
  const aside = document.createElement('aside');
  aside.className = 'sidebar';
  aside.innerHTML = `
    <a class="brand" href="${rota('dashboard')}" aria-label="Nota Fácil — visão geral">
      <img src="../assets/logo-nota-facil.png" alt="Nota Fácil">
    </a>
    <section class="company-card" aria-label="Empresa selecionada">
      <strong data-empresa-nome></strong>
      <span data-empresa-cnpj></span>
    </section>
    <nav class="main-nav" aria-label="Navegação principal">
      ${itens.map((i) => `<a class="nav-link ${i.id === pagina ? 'is-active' : ''}" href="${rota(i.id)}" ${i.id === pagina ? 'aria-current="page"' : ''}>${icon(i.ic, 15)}<span>${i.label}</span></a>`).join('')}
    </nav>
    <p class="security-note">${icon('shield', 14)} Ambiente seguro e protegido</p>`;
  layout.insertBefore(aside, layout.firstChild);

  /* ---------- Área principal: cabeçalho + conteúdo + rodapé ---------- */
  const area = document.createElement('div');
  area.className = 'main-area';
  layout.insertBefore(area, main);

  const header = document.createElement('header');
  header.className = 'topbar';
  header.innerHTML = `
    <span class="mobile-title">Nota Fácil</span>
    <div class="topbar-actions">
      <div class="dropdown" data-dd="notif">
        <button class="icon-button" type="button" aria-label="Notificações" aria-haspopup="true" aria-expanded="false">${icon('bell', 17)}<span class="badge-dot" hidden></span></button>
        <div class="dropdown__panel notif-panel" hidden></div>
      </div>
      <div class="dropdown" data-dd="user">
        <button class="user-menu" type="button" aria-label="Menu do usuário" aria-haspopup="true" aria-expanded="false">
          <span class="avatar">${U.esc(U.initials(sessao.nome))}</span>
          <span class="user-name">${U.esc(sessao.nome)}</span>
          <svg class="chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>
        </button>
        <div class="dropdown__panel" hidden>
          <div class="dropdown__head"><strong>${U.esc(sessao.nome)}</strong><small>${U.esc(sessao.email || '')}${sessao.perfil ? ` · ${U.esc(sessao.perfil)}` : ''}</small></div>
          <a href="${rota('configuracoes')}">${icon('gear', 16)} Configurações</a>
          <a href="${rota('configuracoes')}#seguranca">${icon('lock', 16)} Segurança da conta</a>
          <button type="button" class="menu-item" data-logout>${icon('logout', 16)} Sair</button>
        </div>
      </div>
    </div>`;
  area.appendChild(header);
  area.appendChild(main);

  const footer = document.createElement('footer');
  footer.className = 'dashboard-footer';
  footer.textContent = `© ${new Date().getFullYear()} Nota Fácil · Gestão fiscal de forma simples e prática`;
  area.appendChild(footer);

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
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharTodos(); });

  header.querySelector('[data-logout]').addEventListener('click', async () => {
    const ok = await U.modal({ title: 'Sair da conta?', text: 'Você precisará entrar novamente para acessar suas notas.', confirm: 'Sair' });
    if (!ok) return;
    Store.sair();
    location.href = `${rota('login')}?saiu=1`;
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

  /* ---------- Cartão da empresa ---------- */
  window.atualizarEmpresaLateral = () => {
    const e = Store.empresa();
    aside.querySelector('[data-empresa-nome]').textContent = e.nomeFantasia || e.razaoSocial || sessao.nome;
    aside.querySelector('[data-empresa-cnpj]').textContent = e.cnpj ? `CNPJ ${e.cnpj}` : 'Complete o cadastro da empresa';
  };
  atualizarEmpresaLateral();

  /* Ícones declarados no HTML: <button data-ic="plus">Texto</button> */
  U.$$('[data-ic]').forEach((el) => el.insertAdjacentHTML('afterbegin', icon(el.dataset.ic, Number(el.dataset.icSize) || 18)));

  /* Selo de status usado nas tabelas e na nota */
  window.statusBadge = (s) => {
    const map = {
      autorizada: ['checkCircle', 'Autorizada'],
      pendente: ['clock', 'Pendente'],
      cancelada: ['xCircle', 'Cancelada'],
      rejeitada: ['alert', 'Rejeitada'],
    };
    const [ic, txt] = map[s] || ['alert', s];
    return `<span class="nf-status nf-status--${s}">${icon(ic, 14)}${txt}</span>`;
  };

  /* Link de e-mail com os dados da nota (usado na emissão e na página da nota) */
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
