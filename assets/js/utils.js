/* Utilitários: formatação, máscaras, validações, toasts, modais e downloads. */
(function () {
  const U = {};

  U.$ = (sel, root = document) => root.querySelector(sel);
  U.$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  U.digits = (v) => String(v || '').replace(/\D/g, '');
  U.esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  U.param = (name) => new URLSearchParams(location.search).get(name);

  /* ---------- Formatação ---------- */
  const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const num2 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  U.money = (n) => brl.format(Number(n) || 0).replace(/ /g, ' ');
  U.number2 = (n) => num2.format(Number(n) || 0);
  /* "4.800,00" -> 4800 */
  U.parseMoney = (s) => {
    if (typeof s === 'number') return s;
    const d = U.digits(s);
    return d ? Number(d) / 100 : 0;
  };
  U.pad = (n, l = 2) => String(n).padStart(l, '0');
  /* Datas trabalham no formato ISO local "AAAA-MM-DD" ou "AAAA-MM-DDTHH:MM" */
  U.toDate = (iso) => {
    if (!iso) return null;
    const [d, t = '00:00'] = iso.split('T');
    const [y, m, day] = d.split('-').map(Number);
    const [h, mi] = t.split(':').map(Number);
    return new Date(y, m - 1, day, h || 0, mi || 0);
  };
  U.isoDate = (dt = new Date()) => `${dt.getFullYear()}-${U.pad(dt.getMonth() + 1)}-${U.pad(dt.getDate())}`;
  U.isoDateTime = (dt = new Date()) => `${U.isoDate(dt)}T${U.pad(dt.getHours())}:${U.pad(dt.getMinutes())}`;
  U.dateBR = (iso) => { const d = U.toDate(iso); return d ? `${U.pad(d.getDate())}/${U.pad(d.getMonth() + 1)}/${d.getFullYear()}` : ''; };
  U.dateBRShort = (iso) => { const d = U.toDate(iso); return d ? `${U.pad(d.getDate())}/${U.pad(d.getMonth() + 1)}/${String(d.getFullYear()).slice(2)}` : ''; };
  U.timeBR = (iso) => { const d = U.toDate(iso); return d ? `${U.pad(d.getHours())}:${U.pad(d.getMinutes())}` : ''; };
  U.dateTimeBR = (iso) => `${U.dateBR(iso)} às ${U.timeBR(iso)}`;
  U.monthName = (m) => ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'][m];
  U.fileSize = (b) => (b < 1024 ? `${b} B` : b < 1048576 ? `${Math.round(b / 1024)} KB` : `${(b / 1048576).toFixed(1).replace('.', ',')} MB`);
  U.initials = (name) => String(name || '?').trim().split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

  /* ---------- Documentos ---------- */
  U.formatDoc = (v) => {
    const d = U.digits(v).slice(0, 14);
    if (d.length <= 11) {
      return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return d.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
  };
  U.formatCEP = (v) => U.digits(v).slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');

  U.isCPF = (v) => {
    const c = U.digits(v);
    if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
    for (let t = 9; t < 11; t++) {
      let s = 0;
      for (let i = 0; i < t; i++) s += Number(c[i]) * (t + 1 - i);
      const dv = ((s * 10) % 11) % 10;
      if (dv !== Number(c[t])) return false;
    }
    return true;
  };
  U.isCNPJ = (v) => {
    const c = U.digits(v);
    if (c.length !== 14 || /^(\d)\1+$/.test(c)) return false;
    const calc = (len) => {
      const w = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
      const s = w.reduce((acc, wi, i) => acc + Number(c[i]) * wi, 0);
      const r = s % 11;
      return r < 2 ? 0 : 11 - r;
    };
    return calc(12) === Number(c[12]) && calc(13) === Number(c[13]);
  };
  U.isDoc = (v) => (U.digits(v).length === 11 ? U.isCPF(v) : U.isCNPJ(v));
  U.isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());

  /* ---------- Máscaras de campo ---------- */
  U.mask = (input, type) => {
    const handlers = {
      doc: (v) => U.formatDoc(v),
      cep: (v) => U.formatCEP(v),
      money: (v) => { const d = U.digits(v).replace(/^0+(?=\d)/, ''); return d ? U.number2(Number(d) / 100) : ''; },
      percent: (v) => { const d = U.digits(v).slice(0, 4); return d ? U.number2(Number(d) / 100) : ''; },
      digits: (v) => U.digits(v),
    };
    input.addEventListener('input', () => {
      const end = input.selectionEnd === input.value.length;
      input.value = handlers[type](input.value);
      if (end) input.setSelectionRange(input.value.length, input.value.length);
    });
  };

  /* ---------- Validação de formulários ---------- */
  U.setFieldError = (field, msg) => {
    const wrap = field.closest('.field') || field.closest('.check');
    if (!wrap) return;
    wrap.classList.toggle('is-invalid', !!msg);
    field.setAttribute('aria-invalid', msg ? 'true' : 'false');
    let el = wrap.querySelector('.error-msg');
    if (msg) {
      if (!el) {
        el = document.createElement('div');
        el.className = 'error-msg';
        el.id = `${field.id || field.name}-erro`;
        if (wrap.classList.contains('check')) wrap.after(el); else wrap.appendChild(el);
        field.setAttribute('aria-describedby', el.id);
      }
      el.innerHTML = `${icon('alert', 14)}<span>${U.esc(msg)}</span>`;
      wrap.querySelectorAll('.hint').forEach((h) => (h.hidden = true));
    } else {
      if (el) el.remove();
      const sib = wrap.classList.contains('check') && wrap.nextElementSibling;
      if (sib && sib.classList && sib.classList.contains('error-msg')) sib.remove();
      wrap.querySelectorAll('.hint').forEach((h) => (h.hidden = false));
    }
  };
  U.clearErrors = (root) => U.$$('.is-invalid', root).forEach((w) => {
    w.classList.remove('is-invalid');
    w.querySelectorAll('.error-msg').forEach((e) => e.remove());
    w.querySelectorAll('.hint').forEach((h) => (h.hidden = false));
    const sib = w.nextElementSibling;
    if (sib && sib.classList.contains('error-msg')) sib.remove();
  });

  /* ---------- Toasts ---------- */
  U.toast = (msg, type = 'ok') => {
    let box = U.$('.toasts');
    if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
    const t = document.createElement('div');
    t.className = `toast ${type === 'error' ? 'toast--error' : ''}`;
    t.innerHTML = `${icon(type === 'error' ? 'alert' : 'checkCircle', 18)}<span>${U.esc(msg)}</span>`;
    box.appendChild(t);
    setTimeout(() => { t.classList.add('is-leaving'); setTimeout(() => t.remove(), 250); }, 3600);
  };

  /* ---------- Modal ----------
     U.modal({ title, text, html, confirm, cancel, danger, onConfirm(modalEl) => false para manter aberto }) */
  U.modal = (opts) => new Promise((resolve) => {
    const prevFocus = document.activeElement;
    const bd = document.createElement('div');
    bd.className = 'modal-backdrop';
    bd.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <h2 id="modal-title">${U.esc(opts.title)}</h2>
        ${opts.text ? `<p>${U.esc(opts.text)}</p>` : ''}
        ${opts.html || ''}
        <div class="modal__btns">
          ${opts.cancel === false ? '' : `<button type="button" class="btn btn-outline btn-sm" data-act="cancel">${U.esc(opts.cancel || 'Voltar')}</button>`}
          <button type="button" class="btn ${opts.danger ? 'btn-danger' : 'btn-primary'} btn-sm" data-act="ok">${U.esc(opts.confirm || 'Confirmar')}</button>
        </div>
      </div>`;
    document.body.appendChild(bd);
    const modal = bd.querySelector('.modal');
    const close = (val) => { bd.remove(); document.removeEventListener('keydown', onKey); if (prevFocus) prevFocus.focus(); resolve(val); };
    const onKey = (e) => {
      if (e.key === 'Escape') close(false);
      if (e.key === 'Tab') {
        const f = U.$$('button, input, select, textarea, a[href]', modal).filter((x) => !x.disabled);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    bd.addEventListener('mousedown', (e) => { if (e.target === bd) close(false); });
    bd.querySelector('[data-act="ok"]').addEventListener('click', () => {
      if (opts.onConfirm && opts.onConfirm(modal) === false) return;
      close(true);
    });
    const c = bd.querySelector('[data-act="cancel"]');
    if (c) c.addEventListener('click', () => close(false));
    const first = modal.querySelector('input, textarea, select') || modal.querySelector('[data-act="ok"]');
    setTimeout(() => first.focus(), 30);
  });

  /* ---------- Downloads ---------- */
  U.download = (filename, content, mime) => {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  U.readFileAsDataURL = (file) => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

  window.U = U;
})();
