/* ==========================================================================
   Configuração geral: endereços das páginas e regras de acesso.
   Todas as páginas ficam em pastas de 1 nível (login/, dashboard/, ...),
   por isso os caminhos começam com "../".
   ========================================================================== */
window.APP_CONFIG = {
  rotas: {
    login: '../login/index.html',
    cadastro: '../cadastro/index.html',
    dashboard: '../dashboard/index.html',
    emitir: '../emitir/index.html',
    historico: '../historico/index.html',
    configuracoes: '../configuracoes/index.html',
    nota: '../nota/index.html',
  },

  /* true: quem não estiver logado é mandado para a página de login.
     A sessão é gravada pelo assets/js/auth.js depois do login. */
  exigirLogin: true,
};

/* Monta o endereço de uma página: rota('nota', { id: 1058 }) -> ../nota/index.html?id=1058 */
window.rota = function (nome, params) {
  const base = APP_CONFIG.rotas[nome];
  if (!params) return base;
  const q = new URLSearchParams(params).toString();
  return q ? `${base}?${q}` : base;
};

/* Compatibilidade com o código antigo */
APP_CONFIG.loginUrl = APP_CONFIG.rotas.login;
APP_CONFIG.inicioUrl = APP_CONFIG.rotas.dashboard;
