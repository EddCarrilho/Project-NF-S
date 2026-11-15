/* Página: Detalhes da nota, documento auxiliar (PDF), XML e ações */
(function () {
  const id = U.param('id');
  if (!Store.nota(id)) {
    U.$('.doc-layout').innerHTML = `<div class="card result" style="grid-column:1/-1"><div class="result__icon is-error">${icon('alert', 32)}</div>
      <h2>Nota não encontrada</h2><p>Ela pode ter sido removida ou o endereço está incorreto.</p>
      <div class="result__btns" style="margin-top:20px"><a class="btn btn-primary" href="${rota('historico')}">Ir para o histórico</a></div></div>`;
    U.$('[data-titulo]').textContent = 'Nota não encontrada';
    return;
  }

  const fmtNum = (n) => String(n).padStart(9, '0').replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3');
  const fmtChave = (c) => c.replace(/(\d{4})(?=\d)/g, '$1 ');

  function render() {
    const n = Store.nota(id);
    const e = Store.empresa();
    const cfg = Store.config();
    const c = Store.calc(n.valores);
    const [mun, uf] = n.tomador.municipio.split('/').map((s) => s.trim());
    const venc = U.toDate(n.emissao); venc.setDate(venc.getDate() + 30);
    const servNome = Store.servicoNome(n.servico.codigo);

    document.title = `NFS-e ${n.numero} · Nota Fácil`;
    U.$('[data-titulo]').textContent = `NFS-e #${n.numero}`;
    U.$('[data-sub]').innerHTML = `${U.esc(n.tomador.nome)} · ${U.money(c.liquido)} · ${statusBadge(n.status)}`;

    /* Avisos de situação */
    const avisos = {
      pendente: `<div class="alert alert--info">${icon('clock', 20)}<div><strong>Aguardando autorização da prefeitura</strong>Este documento ainda não tem valor fiscal. Use "Consultar status" para verificar o retorno.</div></div>`,
      cancelada: `<div class="alert alert--error">${icon('xCircle', 20)}<div><strong>Nota cancelada em ${U.dateTimeBR(n.canceladaEm)}</strong>Motivo: ${U.esc(n.motivoCancelamento)}.</div></div>`,
      rejeitada: `<div class="alert alert--error" role="alert">${icon('alert', 20)}<div><strong>Nota rejeitada pela prefeitura</strong>${U.esc(n.motivoRejeicao || '')}. <a href="${rota('emitir', { editar: n.id })}">Corrigir e reenviar</a></div></div>`,
    };
    U.$('[data-alerta]').innerHTML = avisos[n.status] || '';

    /* Documento auxiliar */
    const marca = n.status === 'cancelada' ? 'CANCELADA' : n.status === 'autorizada' ? '' : 'SEM VALOR FISCAL';
    const logo = cfg.logo
      ? `<img src="${cfg.logo.dataUrl}" alt="Logo ${U.esc(e.nomeFantasia)}">`
      : `<span class="danfe-logo">${logoMark(30, '#01172E')}<span style="font-size:20px;letter-spacing:.3px"><b style="font-weight:800">${U.esc((e.nomeFantasia || e.razaoSocial).toUpperCase())}</b></span></span>`;
    const L = (lbl, val, cls = '') => `<span class="lbl">${lbl}</span><span class="val ${cls}">${val}</span>`;

    U.$('[data-danfe]').innerHTML = `
      <div class="watermark" ${marca ? `data-mark="${marca}"` : ''}>
      <table>
        <tr>
          <td style="width:80%;height:58px">
            <span class="lbl" style="font-size:7.5px">RECEBEMOS DE ${U.esc(e.razaoSocial.toUpperCase())} OS SERVIÇOS CONSTANTES DA NOTA FISCAL DE SERVIÇO ELETRÔNICA INDICADA AO LADO.</span>
            <div style="display:flex;gap:16px;margin-top:14px;font-size:7.5px">
              <span>DATA DE RECEBIMENTO: ____/____/______</span><span>|</span><span>IDENTIFICAÇÃO E ASSINATURA DO RECEBEDOR: ________________________________</span>
            </div>
          </td>
          <td class="center"><div class="big">NFS-e</div><div class="b">Nº ${fmtNum(n.numero)}</div><div class="b">SÉRIE ${n.serie}</div></td>
        </tr>
      </table>
      <div class="gap" style="border-bottom:1px dashed #555;margin-bottom:10px"></div>

      <table>
        <tr>
          <td style="width:36%" rowspan="2">
            <div style="margin:6px 0 10px">${logo}</div>
            <div class="val" style="font-size:10px;line-height:1.45">
              <b>${U.esc(e.razaoSocial)}</b><br>
              ${U.esc(e.endereco)}<br>
              CEP: ${U.esc(e.cep)}<br>
              CNPJ: ${U.esc(e.cnpj)}<br>
              IM: ${U.esc(e.inscricaoMunicipal)} · ${U.esc(e.regime)}
            </div>
          </td>
          <td style="width:22%" class="center" rowspan="2">
            <div class="big" style="font-size:18px;margin-top:4px">DANFSe</div>
            <div class="b" style="font-size:10px;margin:2px 0 8px">Documento Auxiliar da Nota Fiscal de Serviço Eletrônica</div>
            <div class="b" style="font-size:12px">Nº ${fmtNum(n.numero)}</div>
            <div>SÉRIE ${n.serie}</div>
            <div>FOLHA 1 / 1</div>
          </td>
          <td class="barcode" style="height:58px;padding:6px 10px">${barcode128C(n.chave)}</td>
        </tr>
        <tr>
          <td>
            ${L('Chave de acesso', fmtChave(n.chave), 'b')}
            <div class="center" style="margin-top:8px">Consulta de autenticidade no portal nacional da NFS-e<br>www.nfse.gov.br/consultapublica</div>
          </td>
        </tr>
        <tr>
          <td colspan="2">${L('Natureza da operação', 'Prestação de Serviços')}</td>
          <td>${L('Protocolo de autorização', n.protocolo ? `${n.protocolo} - ${U.dateBR(n.autorizadaEm)} ${U.timeBR(n.autorizadaEm)}` : '—')}</td>
        </tr>
      </table>
      <table>
        <tr>
          <td>${L('Inscrição municipal', U.esc(e.inscricaoMunicipal))}</td>
          <td>${L('Competência', U.dateBR(n.competencia))}</td>
          <td>${L('CNPJ', U.esc(e.cnpj))}</td>
        </tr>
      </table>

      <div class="sect">Tomador do serviço</div>
      <table>
        <tr>
          <td colspan="3" style="width:60%">${L('Nome / Razão social', U.esc(n.tomador.nome), 'b')}</td>
          <td>${L(U.digits(n.tomador.doc).length === 11 ? 'CPF' : 'CNPJ', U.esc(n.tomador.doc))}</td>
          <td>${L('Data da emissão', U.dateBR(n.emissao))}</td>
        </tr>
        <tr>
          <td colspan="2">${L('Endereço', U.esc(n.tomador.logradouro))}</td>
          <td colspan="2">${L('Bairro / Complemento', U.esc(n.tomador.bairro || '—'))}</td>
          <td>${L('CEP', U.esc(n.tomador.cep))}</td>
        </tr>
        <tr>
          <td colspan="2">${L('Município', U.esc(mun || ''))}</td>
          <td style="width:8%">${L('UF', U.esc(uf || ''))}</td>
          <td>${L('Inscrição municipal', U.esc(n.tomador.im || '—'))}</td>
          <td>${L('Hora da emissão', U.timeBR(n.emissao))}</td>
        </tr>
        <tr><td colspan="5">${L('E-mail', U.esc(n.tomador.email || '—'))}</td></tr>
      </table>

      <div class="sect">Fatura / Duplicata</div>
      <table>
        <tr>
          <td>${L('Nº da fatura', '001', 'b')}</td>
          <td>${L('Valor', U.money(c.liquido), 'b')}</td>
          <td>${L('Vencimento', U.dateBR(U.isoDate(venc)))}</td>
          <td style="width:40%"></td>
        </tr>
      </table>

      <div class="sect-plain">Cálculo do imposto</div>
      <table>
        <tr>
          <td>${L('Base de cálculo do ISS', U.money(c.base), 'b')}</td>
          <td>${L('Alíquota do ISS', `${U.number2(n.valores.aliquota)}%`, 'b')}</td>
          <td>${L('Valor do ISS', U.money(c.iss), 'b')}</td>
          <td>${L('ISS retido', n.valores.issRetido ? 'Sim' : 'Não', 'b')}</td>
          <td style="width:28%">${L('Valor total dos serviços', U.money(c.servico), 'b')}</td>
        </tr>
        <tr>
          <td>${L('Desconto incond.', U.money(c.desconto), 'b')}</td>
          <td>${L('Retenções', U.money(c.retencoes), 'b')}</td>
          <td colspan="2">${L('Local de incidência', U.esc(n.valores.local), 'b')}</td>
          <td class="hl">${L('Valor líquido da nota', U.money(c.liquido), 'big')}</td>
        </tr>
      </table>

      <div class="sect-plain">Dados dos serviços</div>
      <table class="items">
        <thead><tr>
          <th style="width:8%">Código</th><th style="width:38%">Descrição do serviço</th><th>Unid.</th><th>Quant.</th>
          <th>Valor unitário</th><th>Valor total</th><th>Base ISS</th><th>Alíq.</th><th>Valor ISS</th>
        </tr></thead>
        <tbody><tr>
          <td class="center">${U.esc(n.servico.codigo)}</td>
          <td><b>${U.esc(servNome)}</b><br>${U.esc(n.servico.discriminacao)}</td>
          <td class="center">UN</td><td class="right">1,00</td>
          <td class="right">${U.number2(c.servico)}</td><td class="right">${U.number2(c.servico)}</td>
          <td class="right">${U.number2(c.base)}</td><td class="right">${U.number2(n.valores.aliquota)}</td><td class="right">${U.number2(c.iss)}</td>
        </tr></tbody>
      </table>

      <div class="sect">Dados adicionais</div>
      <table>
        <tr>
          <td style="width:58%;height:84px">${L('Informações complementares', `${U.esc(n.servico.discriminacao)}${e.regime === 'Simples Nacional' ? '<br>Documento emitido por ME ou EPP optante pelo Simples Nacional.' : ''}${n.status === 'cancelada' ? `<br><b>NOTA CANCELADA EM ${U.dateBR(n.canceladaEm)}.</b>` : ''}`)}</td>
          <td>${L('Reservado ao fisco', '')}</td>
        </tr>
      </table>
      </div>`;

    /* Ações */
    const acoes = [`<button type="button" class="btn btn-primary" data-pdf>${icon('printer', 18)}Salvar PDF / Imprimir</button>`,
      `<button type="button" class="btn btn-outline" data-xml>${icon('code', 18)}Baixar XML</button>`];
    if (n.tomador.email && n.status !== 'rejeitada') acoes.push(`<a class="btn btn-outline" href="${NotaEmail.link(n)}">${icon('mail', 18)}Enviar por e-mail</a>`);
    if (n.status === 'pendente') acoes.push(`<button type="button" class="btn btn-outline" data-consultar>${icon('refresh', 18)}Consultar status</button>`);
    if (n.status === 'rejeitada') acoes.push(`<a class="btn btn-outline" href="${rota('emitir', { editar: n.id })}">${icon('fileEdit', 18)}Corrigir e reenviar</a>`);
    if (n.status === 'autorizada' || n.status === 'pendente') {
      acoes.push(`<a class="btn btn-outline" href="${rota('emitir', { editar: n.id })}">${icon('fileEdit', 18)}Editar nota</a>`);
      acoes.push(`<button type="button" class="btn btn-outline" data-cancelar style="color:var(--danger)">${icon('xCircle', 18)}Cancelar nota</button>`);
    }
    const box = U.$('[data-acoes]');
    box.innerHTML = acoes.join('');

    box.querySelector('[data-pdf]').addEventListener('click', () => {
      const t = document.title;
      document.title = `NFS-e_${n.numero}_${n.tomador.nome.replace(/[^\w]+/g, '_')}`;
      window.print();
      setTimeout(() => (document.title = t), 500);
    });
    box.querySelector('[data-xml]').addEventListener('click', () => { U.download(`NFS-e_${n.numero}.xml`, Store.xml(n), 'application/xml'); U.toast('XML baixado.'); });
    const cons = box.querySelector('[data-consultar]');
    if (cons) cons.addEventListener('click', () => {
      cons.disabled = true; cons.lastChild.textContent = 'Consultando…';
      setTimeout(() => { Store.consultar(n.id); U.toast(`Nota #${n.numero} autorizada pela prefeitura.`); if (window.atualizarNotificacoes) atualizarNotificacoes(); render(); }, 1100);
    });
    const canc = box.querySelector('[data-cancelar]');
    if (canc) canc.addEventListener('click', async () => { if (await cancelarNota(n.id)) render(); });

    /* Histórico */
    U.$('[data-historico]').innerHTML = n.historico.slice().reverse()
      .map((h) => `<li><time datetime="${h.data}">${U.dateBR(h.data)} ${U.timeBR(h.data)}</time><span>${U.esc(h.evento)}</span></li>`).join('');
  }

  render();
  if (U.param('imprimir') === '1') setTimeout(() => U.$('[data-pdf]').click(), 400);
})();
