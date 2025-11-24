import { apiPost, checkAuth } from "../api";

function showAlert(msg: string, type: "danger" | "success") {
  const area = document.getElementById("alert-area");
  area!.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
}

async function handleSubmit(e: Event) {
  e.preventDefault();
  const form = e.target as HTMLFormElement;

  const payload = {
    name: (form.querySelector("#name") as HTMLInputElement).value,
    description: (form.querySelector("#description") as HTMLInputElement).value || "",
  };

  try {
    const created = await apiPost("/groups/", payload);
    showAlert("Grupo criado com sucesso!", "success");

    setTimeout(() => {
      window.location.href = `/src/pages/group_detail.html?slug=${created.slug}`;
    }, 800);
  } catch (err) {
    console.error(err);
    showAlert("Erro ao criar grupo. Verifique os dados.", "danger");
  }
}

async function main() {
  const logged = await checkAuth();
  if (!logged) {
    window.location.href = "/src/pages/login.html";
    return;
  }

  const form = document.getElementById("group-form");
  form?.addEventListener("submit", handleSubmit);
}

main();
