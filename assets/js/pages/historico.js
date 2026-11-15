/* Página: Histórico de notas (busca, filtros, paginação, ações e exportação) */
(function () {
  const POR_PAGINA = 10;
  const estado = { busca: '', de: '', ate: '', status: '', pagina: 1 };

  const busca = U.$('#busca');
  const status = U.$('#status');
  const trigger = U.$('#periodo');
  const pop = U.$('.range-pop');
  const inDe = U.$('[data-de]');
  const inAte = U.$('[data-ate]');

  /* ---------- Períodos ---------- */
  function preset(tipo) {
    const hoje = new Date();
    const y = hoje.getFullYear(), m = hoje.getMonth();
    if (tipo === 'mes') return [U.isoDate(new Date(y, m, 1)), U.isoDate(new Date(y, m + 1, 0))];
    if (tipo === 'mes-ant') return [U.isoDate(new Date(y, m - 1, 1)), U.isoDate(new Date(y, m, 0))];
    if (tipo === '30' || tipo === '90') { const d = new Date(); d.setDate(d.getDate() - Number(tipo)); return [U.isoDate(d), U.isoDate(hoje)]; }
    return ['', ''];
  }
  function textoPeriodo() {
    if (!estado.de && !estado.ate) return 'Todo o período';
    if (estado.de && estado.ate) return `${U.dateBRShort(estado.de)} a ${U.dateBRShort(estado.ate)}`;
    return estado.de ? `A partir de ${U.dateBRShort(estado.de)}` : `Até ${U.dateBRShort(estado.ate)}`;
  }

  /* ---------- Estado inicial pela URL ---------- */
  const qp = new URLSearchParams(location.search);
  estado.busca = qp.get('busca') || '';
  estado.status = qp.get('status') || '';
  if (qp.get('periodo')) [estado.de, estado.ate] = preset(qp.get('periodo'));
  if (qp.get('de')) estado.de = qp.get('de');
  if (qp.get('ate')) estado.ate = qp.get('ate');
  busca.value = estado.busca;
  status.value = estado.status;

  function sincronizarURL() {
    const p = new URLSearchParams();
    if (estado.busca) p.set('busca', estado.busca);
    if (estado.status) p.set('status', estado.status);
    if (estado.de) p.set('de', estado.de);
    if (estado.ate) p.set('ate', estado.ate);
    history.replaceState(null, '', `${location.pathname}${p.toString() ? '?' + p : ''}`);
  }

  /* ---------- Filtragem ---------- */
  function filtrar() {
    const termo = estado.busca.trim().toLowerCase();
    const termoDig = U.digits(termo);
    return Store.notas().filter((n) => {
      if (estado.status && n.status !== estado.status) return false;
      const dia = n.emissao.slice(0, 10);
      if (estado.de && dia < estado.de) return false;
      if (estado.ate && dia > estado.ate) return false;
      if (termo) {
        const nomeOk = n.tomador.nome.toLowerCase().includes(termo);
        const numOk = String(n.numero).includes(termo.replace('#', ''));
        const docOk = termoDig.length >= 3 && U.digits(n.tomador.doc).includes(termoDig);
        if (!nomeOk && !numOk && !docOk) return false;
      }
      return true;
    });
  }

  /* ---------- Renderização ---------- */
  const tbody = U.$('[data-lista]');
  function acoes(n) {
    const a = [`<a class="action" href="${rota('nota', { id: n.id })}" title="Ver nota e baixar PDF">${icon('filePdf', 16)}PDF</a>`];
    if (n.status === 'pendente') a.push(`<button type="button" class="action" data-consultar="${n.id}">${icon('refresh', 16)}Consultar</button>`);
    if (n.status === 'rejeitada') a.push(`<a class="action" href="${rota('emitir', { editar: n.id })}">${icon('fileEdit', 16)}Corrigir</a>`);
    if (n.status === 'autorizada' || n.status === 'pendente') {
      a.push(`<a class="action" href="${rota('emitir', { editar: n.id })}">${icon('fileEdit', 16)}Editar</a>`);
      a.push(`<button type="button" class="action action--danger" data-cancelar="${n.id}">${icon('xCircle', 16)}Cancelar</button>`);
    }
    return a.join('');
  }

  function render() {
    trigger.querySelector('[data-periodo-txt]').textContent = textoPeriodo();
    const lista = filtrar();
    const total = lista.length;
    const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
    estado.pagina = Math.min(estado.pagina, paginas);
    const ini = (estado.pagina - 1) * POR_PAGINA;
    const pagina = lista.slice(ini, ini + POR_PAGINA);

    tbody.innerHTML = pagina.length ? pagina.map((n) => `
      <tr>
        <td class="num cell-num" data-label="Nota">#${n.numero}</td>
        <td class="who"><strong>${U.esc(n.tomador.nome)}</strong><small>${U.esc(n.tomador.doc)}</small></td>
        <td data-label="Emissão">${U.dateBR(n.emissao)}</td>
        <td class="money" data-label="Valor">${U.money(n.valores.servico)}</td>
        <td data-label="Status">${statusBadge(n.status)}</td>
        <td class="cell-actions"><div class="actions">${acoes(n)}</div></td>
      </tr>`).join('')
      : `<tr><td colspan="6" class="empty">Nenhuma nota encontrada com esses filtros.<br><button type="button" class="link-btn" data-limpar-vazio style="margin-top:8px">Limpar filtros</button></td></tr>`;

    /* Título e resumo */
    let quando = '';
    if (estado.de && estado.ate) {
      const a = U.toDate(estado.de), b = U.toDate(estado.ate);
      const mesInteiro = a.getDate() === 1 && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear() && b.getDate() >= 28;
      quando = mesInteiro ? ` em ${U.monthName(a.getMonth())}` : ` entre ${U.dateBR(estado.de)} e ${U.dateBR(estado.ate)}`;
    }
    U.$('[data-resultado-titulo]').textContent = `${total} ${total === 1 ? 'nota encontrada' : 'notas encontradas'}${quando}`;
    const cont = (s) => lista.filter((n) => n.status === s).length;
    const partes = [['autorizada', 'autorizadas', 'autorizada'], ['pendente', 'pendentes', 'pendente'], ['cancelada', 'canceladas', 'cancelada'], ['rejeitada', 'rejeitadas', 'rejeitada']]
      .map(([s, pl, sg]) => { const c = cont(s); return c || s !== 'rejeitada' ? `${c} ${c === 1 ? sg : pl}` : ''; }).filter(Boolean);
    U.$('[data-resultado-resumo]').textContent = partes.join(' · ');

    /* Paginação */
    U.$('[data-pager-info]').textContent = total ? `Mostrando ${ini + 1}–${ini + pagina.length} de ${total} ${total === 1 ? 'nota' : 'notas'} · ${POR_PAGINA} por página` : 'Nenhuma nota para mostrar';
    const nums = Array.from({ length: paginas }, (_, i) => i + 1);
    U.$('[data-pager]').innerHTML = `
      <button type="button" data-pg="${estado.pagina - 1}" ${estado.pagina === 1 ? 'disabled' : ''}>Anterior</button>
      ${nums.map((p) => `<button type="button" data-pg="${p}" class="${p === estado.pagina ? 'is-current' : ''}" ${p === estado.pagina ? 'aria-current="page"' : ''}>${p}</button>`).join('')}
      <button type="button" data-pg="${estado.pagina + 1}" ${estado.pagina === paginas ? 'disabled' : ''}>Próxima</button>`;

    /* Totais por situação */
    const soma = (s) => lista.filter((n) => n.status === s).reduce((t, n) => t + n.valores.servico, 0);
    U.$('[data-totais]').innerHTML = [['Autorizadas', 'autorizada'], ['Pendentes', 'pendente'], ['Canceladas', 'cancelada']]
      .map(([l, s]) => `<div><span>${l}</span><strong>${U.money(soma(s))}</strong></div>`).join('');

    sincronizarURL();
  }

  /* ---------- Eventos ---------- */
  U.$('[data-filtros]').addEventListener('submit', (e) => {
    e.preventDefault();
    estado.busca = busca.value;
    estado.status = status.value;
    estado.pagina = 1;
    render();
  });
  let t;
  busca.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { estado.busca = busca.value; estado.pagina = 1; render(); }, 250); });
  status.addEventListener('change', () => { estado.status = status.value; estado.pagina = 1; render(); });

  function limpar() {
    Object.assign(estado, { busca: '', de: '', ate: '', status: '', pagina: 1 });
    busca.value = ''; status.value = '';
    render();
  }
  U.$('[data-limpar]').addEventListener('click', limpar);

  U.$('[data-pager]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-pg]');
    if (!b || b.disabled) return;
    estado.pagina = Number(b.dataset.pg);
    render();
    U.$('.results-bar').scrollIntoView({ behavior: 'smooth' });
  });

  tbody.addEventListener('click', async (e) => {
    if (e.target.closest('[data-limpar-vazio]')) return limpar();
    const cons = e.target.closest('[data-consultar]');
    if (cons) {
      cons.disabled = true;
      cons.innerHTML = `${icon('refresh', 16)}Consultando…`;
      setTimeout(() => {
        const n = Store.consultar(cons.dataset.consultar);
        U.toast(`Nota #${n.numero} autorizada pela prefeitura.`);
        if (window.atualizarNotificacoes) atualizarNotificacoes();
        render();
      }, 1100);
      return;
    }
    const canc = e.target.closest('[data-cancelar]');
    if (canc) cancelarNota(canc.dataset.cancelar).then((ok) => ok && render());
  });

  /* Popover de período */
  function abrirPop(abrir) {
    pop.hidden = !abrir;
    trigger.setAttribute('aria-expanded', String(abrir));
    if (abrir) { inDe.value = estado.de; inAte.value = estado.ate; inDe.focus(); }
  }
  trigger.addEventListener('click', (e) => { e.stopPropagation(); abrirPop(pop.hidden); });
  pop.addEventListener('click', (e) => e.stopPropagation());
  document.addEventListener('click', () => abrirPop(false));
  pop.addEventListener('keydown', (e) => { if (e.key === 'Escape') { abrirPop(false); trigger.focus(); } });
  U.$$('[data-preset]', pop).forEach((b) => b.addEventListener('click', () => {
    [estado.de, estado.ate] = preset(b.dataset.preset);
    estado.pagina = 1;
    abrirPop(false);
    render();
  }));
  U.$('[data-pop-fechar]').addEventListener('click', () => abrirPop(false));
  U.$('[data-pop-aplicar]').addEventListener('click', () => {
    if (inDe.value && inAte.value && inDe.value > inAte.value) { U.toast('A data inicial precisa ser anterior à final.', 'error'); return; }
    estado.de = inDe.value; estado.ate = inAte.value; estado.pagina = 1;
    abrirPop(false);
    render();
  });

  /* Exportar relatório (CSV para Excel) */
  U.$('[data-exportar]').addEventListener('click', () => {
    const lista = filtrar();
    if (!lista.length) { U.toast('Não há notas para exportar com esses filtros.', 'error'); return; }
    const col = ['Número', 'Emissão', 'Competência', 'Tomador', 'CPF/CNPJ', 'Serviço', 'Valor do serviço', 'Desconto', 'ISS', 'ISS retido', 'Valor líquido', 'Status', 'Protocolo'];
    const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const linhas = lista.map((n) => {
      const c = Store.calc(n.valores);
      return [n.numero, U.dateBR(n.emissao), U.dateBR(n.competencia), n.tomador.nome, n.tomador.doc, `${n.servico.codigo} ${Store.servicoNome(n.servico.codigo)}`,
        U.number2(c.servico), U.number2(c.desconto), U.number2(c.iss), n.valores.issRetido ? 'Sim' : 'Não', U.number2(c.liquido), n.status[0].toUpperCase() + n.status.slice(1), n.protocolo || ''].map(q).join(';');
    });
    U.download(`relatorio-nfse-${U.isoDate()}.csv`, '﻿' + [col.map(q).join(';')].concat(linhas).join('\r\n'), 'text/csv;charset=utf-8');
    U.toast(`Relatório com ${lista.length} ${lista.length === 1 ? 'nota exportado' : 'notas exportado'}.`);
  });

  render();
})();

