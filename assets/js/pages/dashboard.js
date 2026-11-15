/* Página: Visão geral (dashboard). Preenche o layout do dashboard com os dados salvos. */
(function () {
  const sessao = Store.sessao();
  const empresa = Store.empresa();
  const notas = Store.notas();

  /* Cabeçalho da página */
  U.$('[data-empresa-crumb]').textContent = (empresa.nomeFantasia || empresa.razaoSocial || 'Minha empresa').toUpperCase();
  const primeiroNome = String(sessao.nome || '').split(' ')[0];
  const pendencias = notas.filter((n) => n.status === 'pendente' || n.status === 'rejeitada').length;
  U.$('[data-saudacao]').textContent = pendencias
    ? `Olá, ${primeiroNome}. ${pendencias === 1 ? 'Uma nota pede' : `${pendencias} notas pedem`} atenção.`
    : `Olá, ${primeiroNome}. Tudo sob controle.`;

  /* Últimas 5 notas, no estilo de tabela do dashboard */
  const classe = { autorizada: 'status-authorized', pendente: 'status-pending', cancelada: 'status-cancelled', rejeitada: 'status-rejected' };
  const texto = { autorizada: 'Autorizada', pendente: 'Pendente', cancelada: 'Cancelada', rejeitada: 'Rejeitada' };
  const tbody = U.$('[data-ultimas]');
  const ultimas = notas.slice(0, 5);

  tbody.innerHTML = ultimas.length
    ? ultimas.map((n) => `
      <tr class="row-link" data-href="${rota('nota', { id: n.id })}" tabindex="0" aria-label="Abrir nota ${n.numero}">
        <td class="invoice-number">#${n.numero}</td>
        <td><strong>${U.esc(n.tomador.nome)}</strong><small>${U.esc(n.tomador.doc)}</small></td>
        <td>${U.dateBR(n.emissao)}</td>
        <td class="amount">${U.money(n.valores.servico)}</td>
        <td><span class="status ${classe[n.status]}"><span></span>${texto[n.status]}</span></td>
      </tr>`).join('')
    : `<tr><td colspan="5" style="text-align:center;height:96px">Nenhuma nota emitida ainda. <a href="${rota('emitir')}" style="font-weight:700;color:#062d49">Emitir a primeira nota →</a></td></tr>`;

  U.$$('.row-link', tbody).forEach((tr) => {
    const abrir = () => (location.href = tr.dataset.href);
    tr.addEventListener('click', abrir);
    tr.addEventListener('keydown', (e) => { if (e.key === 'Enter') abrir(); });
  });
})();
