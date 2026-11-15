/* Página: Visão geral (dashboard) */
(function () {
  const sessao = Store.sessao();
  const empresa = Store.empresa();
  const notas = Store.notas();

  U.$('[data-fantasia]').textContent = empresa.nomeFantasia || empresa.razaoSocial;
  const primeiroNome = (sessao.nome || '').split(' ')[0];

  const pendentes = notas.filter((n) => n.status === 'pendente');
  const rejeitadas = notas.filter((n) => n.status === 'rejeitada');
  const pendencias = pendentes.length + rejeitadas.length;
  U.$('[data-saudacao]').textContent = pendencias
    ? `Olá, ${primeiroNome}. ${pendencias === 1 ? 'Uma nota pede' : `${pendencias} notas pedem`} atenção.`
    : `Olá, ${primeiroNome}. Tudo sob controle.`;

  /* ---------- Alertas ---------- */
  const alertas = [];
  if (rejeitadas.length) {
    alertas.push(`<div class="alert alert--error" role="alert">${icon('alert', 20)}<div>
      <strong>${rejeitadas.length === 1 ? 'Uma nota foi rejeitada' : `${rejeitadas.length} notas foram rejeitadas`} pela prefeitura</strong>
      ${rejeitadas.map((n) => `Nota #${n.numero} · ${U.esc(n.motivoRejeicao || '')}. <a href="emitir.html?editar=${n.id}">Corrigir e reenviar</a>`).join('<br>')}
    </div></div>`);
  }
  if (pendentes.length) {
    alertas.push(`<div class="alert alert--info">${icon('clock', 20)}<div>
      <strong>${pendentes.length === 1 ? 'Uma nota aguarda' : `${pendentes.length} notas aguardam`} autorização</strong>
      ${pendentes.map((n) => `Nota #${n.numero} · ${U.esc(n.tomador.nome)}. <a href="nota.html?id=${n.id}">Consultar status</a>`).join('<br>')}
    </div></div>`);
  }
  U.$('[data-alerta]').innerHTML = alertas.join('<div style="height:12px"></div>');

  /* ---------- Resumo dos últimos 30 dias ---------- */
  const limite = new Date(); limite.setHours(0, 0, 0, 0); limite.setDate(limite.getDate() - 30);
  const recentes = notas.filter((n) => U.toDate(n.emissao) >= limite);
  const soma = (lista) => lista.reduce((s, n) => s + Store.calc(n.valores).servico, 0);
  const autorizadas = recentes.filter((n) => n.status === 'autorizada');
  const stats = [
    { label: 'Notas emitidas', ic: 'files', valor: recentes.length, sub: 'Últimos 30 dias', link: 'historico.html?periodo=30' },
    { label: 'Valor autorizado', ic: 'checkCircle', valor: U.money(soma(autorizadas)), sub: `${autorizadas.length} ${autorizadas.length === 1 ? 'nota autorizada' : 'notas autorizadas'}`, link: 'historico.html?periodo=30&status=autorizada' },
    { label: 'Pendentes', ic: 'clock', valor: pendentes.length, sub: pendentes.length ? U.money(soma(pendentes)) : 'Nenhuma pendência', link: 'historico.html?status=pendente' },
    { label: 'Canceladas e rejeitadas', ic: 'xCircle', valor: recentes.filter((n) => n.status === 'cancelada').length + rejeitadas.length, sub: 'Últimos 30 dias', link: 'historico.html?status=cancelada' },
  ];
  U.$('[data-stats]').innerHTML = stats.map((s) => `
    <a class="stat" href="${s.link}">
      <span>${icon(s.ic, 16)}${s.label}</span>
      <strong>${s.valor}</strong>
      <small>${s.sub}</small>
    </a>`).join('');

  /* ---------- Últimas 5 notas ---------- */
  const tbody = U.$('[data-ultimas]');
  const ultimas = notas.slice(0, 5);
  tbody.innerHTML = ultimas.length ? ultimas.map((n) => `
    <tr class="row-link" data-href="nota.html?id=${n.id}" tabindex="0" aria-label="Abrir nota ${n.numero}">
      <td class="num cell-num" data-label="Nota">#${n.numero}</td>
      <td class="who"><strong>${U.esc(n.tomador.nome)}</strong><small>${U.esc(n.tomador.doc)}</small></td>
      <td data-label="Emissão">${U.dateBR(n.emissao)}</td>
      <td class="money" data-label="Valor">${U.money(n.valores.servico)}</td>
      <td data-label="Status">${statusBadge(n.status)}</td>
    </tr>`).join('')
    : `<tr><td colspan="5" class="empty">Nenhuma nota emitida ainda. <a href="emitir.html" class="link-btn">Emitir a primeira</a></td></tr>`;

  U.$$('.row-link', tbody).forEach((tr) => {
    const go = () => (location.href = tr.dataset.href);
    tr.addEventListener('click', go);
    tr.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
  });
})();
