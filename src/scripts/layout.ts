import { checkAuth } from "../api";

export async function loadLayout() {

  try {
    const res = await fetch("/src/components/header.html");
    if (!res.ok) {
      console.error("❌ Header não encontrado!");
      return;
    }
    const headerHTML = await res.text();
    document.body.insertAdjacentHTML("afterbegin", headerHTML);
  } catch (err) {
    return;
  }

  const isLogged = await checkAuth();

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
      }
    } catch {}
  }

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("access_token");
      window.location.href = "/src/pages/login.html";
    });
  }

  setupHeaderSearch();
}

function setupGroupSearch() {
  const form = document.getElementById("search-form") as HTMLFormElement;
  const input = document.getElementById("search") as HTMLInputElement;

  if (!form || !input) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const query = input.value.trim();
    if (!query) return;

    location.href = `/src/pages/group_list.html?search=${encodeURIComponent(query)}`;
  });
}

setupGroupSearch();

function setupHeaderSearch() {
  const form = document.getElementById("search-form");
  const input = document.getElementById("search");

  if (!form || !input) {
    console.warn("[HEADER SEARCH] elementos não encontrados");
    return;
  }


  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const term = input.value.trim();
    const encoded = encodeURIComponent(term);

    window.location.href = `/src/pages/group_list.html?search=${encoded}`;
  });
}