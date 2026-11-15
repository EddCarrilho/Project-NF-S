/* Ações compartilhadas entre o histórico e a página da nota */
/* Modal de cancelamento, usado no histórico e na página da nota */
window.cancelarNota = async function (id) {
  const n = Store.nota(id);
  let motivo = '';
  const ok = await U.modal({
    title: `Cancelar a nota #${n.numero}?`,
    text: `${n.tomador.nome} · ${U.money(n.valores.servico)}. O cancelamento é enviado à prefeitura e não pode ser desfeito.`,
    html: `<div class="field" style="margin-bottom:12px">
        <label for="motivo">Motivo do cancelamento *</label>
        <select id="motivo" class="select">
          <option value="">Selecione o motivo</option>
          <option>Erro na emissão</option><option>Serviço não prestado</option><option>Nota duplicada</option><option>Outro motivo</option>
        </select>
      </div>
      <div class="field" data-outro hidden><label for="motivo-outro">Descreva o motivo *</label><textarea id="motivo-outro" class="textarea" style="min-height:80px" maxlength="255"></textarea></div>`,
    confirm: 'Cancelar nota', cancel: 'Manter nota', danger: true,
    onConfirm(m) {
      const sel = m.querySelector('#motivo');
      const outro = m.querySelector('#motivo-outro');
      U.setFieldError(sel, sel.value ? '' : 'Selecione o motivo.');
      if (!sel.value) return false;
      if (sel.value === 'Outro motivo') {
        const txt = outro.value.trim();
        U.setFieldError(outro, txt.length >= 15 ? '' : 'Descreva com pelo menos 15 caracteres.');
        if (txt.length < 15) return false;
        motivo = txt;
      } else motivo = sel.value;
    },
  }).then((r) => r);
  if (!ok) return false;
  Store.cancelar(id, motivo);
  U.toast(`Nota #${n.numero} cancelada.`);
  if (window.atualizarNotificacoes) atualizarNotificacoes();
  return true;
};
document.addEventListener('change', (e) => {
  if (e.target.id === 'motivo') {
    const box = document.querySelector('[data-outro]');
    if (box) box.hidden = e.target.value !== 'Outro motivo';
  }
});
