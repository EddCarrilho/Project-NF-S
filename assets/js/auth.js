/* ==========================================================================
   Login e cadastro (assets/js/auth.js)
   - Cadastro: valida os dados e cria a conta no navegador (localStorage).
   - Login: confere e-mail e senha, grava a sessão e abre o dashboard.
   Para usar um servidor de autenticação real, troque as funções
   "buscarConta", "senhaDaConta" e "criarConta" por chamadas à API.
   ========================================================================== */
(function () {
  const ROTA_DASHBOARD = "../dashboard/index.html";
  const ROTA_LOGIN = "../login/index.html";
  const SESSAO_KEY = "notafacil:sessao";
  const USUARIOS_KEY = "notafacil:usuarios";
  const LEMBRAR_KEY = "notafacil:lembrar";

  /* Conta de demonstração (já vem com notas de exemplo) */
  const DEMO = { email: "camila@estudioaurora.com.br", nome: "Camila Lima", senhaPadrao: "aurora2026" };

  const ler = (k, padrao) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : padrao; } catch (e) { return padrao; } };
  const gravar = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const digitos = (v) => String(v || "").replace(/\D/g, "");
  const emailValido = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());

  function cnpjValido(v) {
    const c = digitos(v);
    if (c.length !== 14 || /^(\d)\1+$/.test(c)) return false;
    const dv = (n) => {
      const pesos = n === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
      const r = pesos.reduce((s, p, i) => s + Number(c[i]) * p, 0) % 11;
      return r < 2 ? 0 : 11 - r;
    };
    return dv(12) === Number(c[12]) && dv(13) === Number(c[13]);
  }
  const formatarCNPJ = (v) => digitos(v).slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2");

  /* ---------- Contas ---------- */
  const normalizar = (email) => String(email || "").trim().toLowerCase();
  function buscarConta(email) {
    const e = normalizar(email);
    if (e === DEMO.email) return { email: DEMO.email, nome: DEMO.nome, demo: true };
    return (ler(USUARIOS_KEY, []) || []).find((u) => u.email === e) || null;
  }
  function senhaDaConta(conta) {
    if (conta.demo) return (ler("notafacil:config", {}) || {}).senha || DEMO.senhaPadrao;
    return (ler(`notafacil:conta:${conta.email}:config`, {}) || {}).senha;
  }
  function criarConta(dados) {
    const usuarios = ler(USUARIOS_KEY, []) || [];
    usuarios.push({ email: dados.email, cnpj: dados.cnpj, razaoSocial: dados.razaoSocial, nome: dados.razaoSocial, criadoEm: new Date().toISOString() });
    gravar(USUARIOS_KEY, usuarios);
    gravar(`notafacil:conta:${dados.email}:config`, { senha: dados.senha });
  }

  /* ---------- Mensagens de erro nos campos ---------- */
  function erroCampo(input, msg) {
    const campo = input.closest(".field") || input.closest(".terms-option");
    if (!campo) return;
    let el = campo.parentElement.querySelector(`[data-erro-de="${input.name}"]`);
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    campo.classList.toggle("has-error", !!msg);
    if (!msg) { if (el) el.remove(); return; }
    if (!el) {
      el = document.createElement("p");
      el.className = "field-error";
      el.id = `erro-${input.name}`;
      el.dataset.erroDe = input.name;
      if (campo.classList.contains("terms-option")) campo.after(el); else campo.appendChild(el);
      input.setAttribute("aria-describedby", el.id);
    }
    el.textContent = msg;
  }
  function aviso(form, msg, tipo) {
    const fb = form.querySelector(".form-feedback");
    fb.textContent = msg;
    fb.classList.toggle("is-success", tipo === "ok");
    fb.classList.toggle("is-error", tipo === "erro");
  }

  /* ---------- Mostrar / ocultar senha ---------- */
  document.querySelectorAll(".password-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const input = button.parentElement.querySelector("input");
      const showingPassword = input.type === "password";
      input.type = showingPassword ? "text" : "password";
      button.setAttribute("aria-pressed", String(showingPassword));
      button.setAttribute("aria-label", showingPassword ? "Ocultar senha" : "Mostrar senha");
    });
  });

  /* ---------- Login ---------- */
  const formLogin = document.querySelector('[data-auth-form="login"]');
  if (formLogin) {
    formLogin.noValidate = true;
    const email = formLogin.querySelector('[name="email"]');
    const senha = formLogin.querySelector('[name="password"]');
    const lembrar = formLogin.querySelector('[name="remember"]');
    const botao = formLogin.querySelector('[type="submit"]');

    const params = new URLSearchParams(location.search);
    const lembrado = ler(LEMBRAR_KEY, "");
    if (params.get("email")) email.value = params.get("email");
    else if (lembrado) { email.value = lembrado; lembrar.checked = true; }
    if (params.get("cadastro") === "ok") aviso(formLogin, "Conta criada com sucesso! Entre com seu e-mail e senha.", "ok");
    if (params.get("saiu") === "1") aviso(formLogin, "Você saiu da sua conta.", "ok");

    [email, senha].forEach((i) => i.addEventListener("input", () => { erroCampo(i, ""); aviso(formLogin, ""); }));

    formLogin.addEventListener("submit", (event) => {
      event.preventDefault();
      const erroEmail = !email.value.trim() ? "Informe seu e-mail." : !emailValido(email.value) ? "E-mail inválido. Exemplo: voce@empresa.com.br" : "";
      const erroSenha = !senha.value ? "Digite sua senha." : "";
      erroCampo(email, erroEmail);
      erroCampo(senha, erroSenha);
      if (erroEmail || erroSenha) { (erroEmail ? email : senha).focus(); return; }

      const conta = buscarConta(email.value);
      if (!conta || senhaDaConta(conta) !== senha.value) {
        aviso(formLogin, "E-mail ou senha incorretos. Confira e tente novamente.", "erro");
        senha.select();
        return;
      }

      gravar(SESSAO_KEY, { nome: conta.nome, email: conta.email, perfil: "Administrador", entrouEm: new Date().toISOString() });
      if (lembrar.checked) gravar(LEMBRAR_KEY, conta.email); else localStorage.removeItem(LEMBRAR_KEY);
      botao.disabled = true;
      botao.textContent = "Entrando…";
      location.href = ROTA_DASHBOARD;
    });

    /* Esqueci minha senha (simulado) */
    const esqueci = formLogin.querySelector(".form-options a");
    if (esqueci) esqueci.addEventListener("click", (e) => {
      e.preventDefault();
      if (!emailValido(email.value)) { erroCampo(email, "Digite seu e-mail para recuperar a senha."); email.focus(); return; }
      aviso(formLogin, `Se ${normalizar(email.value)} estiver cadastrado, você receberá um link para criar uma nova senha.`, "ok");
    });
  }

  /* ---------- Cadastro ---------- */
  const formCadastro = document.querySelector('[data-auth-form="register"]');
  if (formCadastro) {
    formCadastro.noValidate = true;
    const f = (n) => formCadastro.querySelector(`[name="${n}"]`);
    const cnpj = f("cnpj"), razao = f("companyName"), email = f("email"), senha = f("password"), termos = f("terms");

    cnpj.addEventListener("input", () => { cnpj.value = formatarCNPJ(cnpj.value); });

    const regras = {
      cnpj: () => (!digitos(cnpj.value) ? "Informe o CNPJ da empresa." : !cnpjValido(cnpj.value) ? "CNPJ inválido. Confira os números digitados." : ""),
      companyName: () => (razao.value.trim().length < 3 ? "Informe a razão social da empresa." : ""),
      email: () => {
        if (!emailValido(email.value)) return "Informe um e-mail válido. Exemplo: voce@empresa.com.br";
        if (buscarConta(email.value)) return "Já existe uma conta com este e-mail. Entre pela tela de login.";
        return "";
      },
      password: () => (senha.value.length < 8 ? "A senha precisa ter 8 ou mais caracteres." : !/[a-zA-Z]/.test(senha.value) || !/\d/.test(senha.value) ? "Use letras e números na senha." : ""),
      terms: () => (!termos.checked ? "Aceite os termos para criar a conta." : ""),
    };
    Object.keys(regras).forEach((nome) => {
      const input = f(nome);
      input.addEventListener(nome === "terms" ? "change" : "input", () => { if (input.getAttribute("aria-invalid") === "true") erroCampo(input, regras[nome]()); });
    });

    formCadastro.addEventListener("submit", (event) => {
      event.preventDefault();
      let primeiro = null;
      Object.entries(regras).forEach(([nome, regra]) => {
        const msg = regra();
        erroCampo(f(nome), msg);
        if (msg && !primeiro) primeiro = f(nome);
      });
      if (primeiro) { primeiro.focus(); aviso(formCadastro, "Confira os campos destacados.", "erro"); return; }

      const dados = { cnpj: formatarCNPJ(cnpj.value), razaoSocial: razao.value.trim(), email: normalizar(email.value), senha: senha.value };
      criarConta(dados);
      location.href = `${ROTA_LOGIN}?cadastro=ok&email=${encodeURIComponent(dados.email)}`;
    });
  }

  /* Link "Ajuda": mostra a conta de demonstração */
  document.querySelectorAll(".help-link").forEach((a) => a.addEventListener("click", (e) => {
    e.preventDefault();
    const form = document.querySelector("[data-auth-form]");
    aviso(form, `Para testar, entre com ${DEMO.email} e a senha ${DEMO.senhaPadrao}, ou crie uma conta nova.`, "ok");
  }));
})();
