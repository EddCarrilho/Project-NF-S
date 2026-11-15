/* ==========================================================================
   Configuração de integração com as páginas de Login e Cadastro
   (desenvolvidas por outra pessoa da equipe).
   ========================================================================== */
window.APP_CONFIG = {
  /* Endereço da página de login. Usado no botão "Sair" e quando não há sessão. */
  loginUrl: 'login.html',

  /* false: enquanto o login não estiver pronto, o sistema abre com um usuário de
     demonstração. true: sem sessão, o usuário é mandado para a página de login.

     A página de login só precisa gravar a sessão assim, após autenticar:
       localStorage.setItem('notafacil:sessao', JSON.stringify({
         nome: 'Camila Lima', email: 'camila@estudioaurora.com.br', perfil: 'Administrador'
       }));
       location.href = 'index.html';
  */
  exigirLogin: false,
};
