import { checkAuth } from "../api";

export async function loadLayout() {
  console.log("🔄 layout.ts carregando...");

  try {
    const res = await fetch("/src/components/header.html");
    if (!res.ok) {
      console.error("❌ Header não encontrado!");
      return;
    }
    const headerHTML = await res.text();
    document.body.insertAdjacentHTML("afterbegin", headerHTML);
    console.log("✔ Header inserido no DOM");
  } catch (err) {
    console.error("⚠ Erro ao carregar header:", err);
    return;
  }

  const isLogged = await checkAuth();
  console.log("🔍 Usuário logado?", isLogged);

  if (!isLogged) {
    window.location.href = "/src/pages/login.html";
    return;
  }

  const userPlaceholder = document.getElementById("username-placeholder");
  if (userPlaceholder) {
    try {
      const res = await fetch("http://localhost:8000/api/auth/me/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      if (res.ok) {
        const user = await res.json();
        userPlaceholder.textContent = `Olá, ${user.username}!`;
        console.log("✔ Saudação aplicada");
      }
    } catch {}
  }

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("access_token");
      window.location.href = "/src/pages/login.html";
    });
    console.log("✔ Logout funcionando");
  }
}
