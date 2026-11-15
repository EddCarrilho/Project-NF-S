document.querySelectorAll(".password-toggle").forEach((button) => {
  button.addEventListener("click", () => {
    const input = button.parentElement.querySelector("input");
    const showingPassword = input.type === "password";

    input.type = showingPassword ? "text" : "password";
    button.setAttribute("aria-pressed", String(showingPassword));
    button.setAttribute("aria-label", showingPassword ? "Ocultar senha" : "Mostrar senha");
  });
});

document.querySelectorAll("[data-auth-form]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const feedback = form.querySelector(".form-feedback");
    feedback.textContent = form.dataset.authForm === "register"
      ? "Cadastro pronto para ser conectado ao serviço de autenticação."
      : "A tela está pronta; conecte o login ao serviço de autenticação.";
  });
});
