// src/scripts/group_create.ts
import { apiGet, apiPost, apiPut } from "../api";

async function loadPage() {
  const slug = new URLSearchParams(window.location.search).get("slug");

  if (slug) {
    await loadGroupForEdit(slug);
  }

  setupSubmit(slug);
}

async function loadGroupForEdit(slug: string) {
  try {
    const group = await apiGet(`/groups/${slug}/`);

    // Preenche o formulário
    (document.getElementById("name") as HTMLInputElement).value = group.name;
    (document.getElementById("description") as HTMLTextAreaElement).value =
      group.description ?? "";

    // Troca textos da página para "Editar"
    document.querySelector("h1")!.innerHTML = "✏️ Editar Grupo";
    document.querySelector("p.text-gray")!.innerHTML =
      "Atualize as informações do grupo.";
    document.querySelector("#group-form button")!.innerHTML = "Salvar Alterações";

  } catch (err) {
    console.error(err);
    alert("Erro ao carregar grupo para edição.");
  }
}

function setupSubmit(slug: string | null) {
  const form = document.getElementById("group-form") as HTMLFormElement;
  const alertArea = document.getElementById("alert-area")!;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    alertArea.innerHTML = ""; // limpa mensagens anteriores

    const data = new FormData(form);

    const payload = {
      name: data.get("name"),
      description: data.get("description") || "",
    };

    try {
      let result;

      if (slug) {
        // MODO EDIÇÃO
        result = await apiPut(`/groups/${slug}/`, payload);
      } else {
        // MODO CRIAÇÃO
        result = await apiPost("/groups/", payload);
      }

      window.location.href = `/src/pages/group_detail.html?slug=${result.slug}`;

    } catch (err: any) {
      console.error("Erro ao salvar grupo:", err);

      // -----------------------------
      // 🟥 ERRO 400 — validação do DRF
      // -----------------------------
      if (err.message?.includes("Erro 400")) {
        try {
          const raw = err.message.replace("Erro 400:", "").trim();
          const parsed = JSON.parse(raw);

          if (parsed.name) {
            alertArea.innerHTML = `
              <div class="alert alert-danger py-2">
                <strong>Nome inválido:</strong> ${parsed.name[0]}
              </div>
            `;
            (document.getElementById("name") as HTMLInputElement).focus();
            return;
          }

        } catch {
          // fallback caso algo venha diferente
          alertArea.innerHTML = `
            <div class="alert alert-danger py-2">
              Não foi possível salvar. Verifique os dados.
            </div>
          `;
          return;
        }
      }

      // -----------------------------
      // ❌ ERRO genérico
      // -----------------------------
      alertArea.innerHTML = `
        <div class="alert alert-danger py-2">
          Erro ao salvar grupo. Tente novamente.
        </div>
      `;
    }
  });
}

loadPage();
