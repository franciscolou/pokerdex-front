import { apiGet, apiPost, apiPut, apiDelete } from "../api";

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

    // 🔒 Se NÃO for criador, bloqueia edição
    if (!group.is_creator) {
      blockUnauthorizedAccess(group);
      return;
    }

    // Preenche o formulário
    (document.getElementById("name") as HTMLInputElement).value = group.name;
    (document.getElementById("description") as HTMLTextAreaElement).value =
      group.description ?? "";

    // Ajusta textos da UI
    document.querySelector("h1")!.innerHTML = "✏️ Editar Grupo";
    document.querySelector("p.text-gray")!.innerHTML =
      "Atualize as informações do grupo.";
    document.querySelector("#group-form button")!.innerHTML =
      "Salvar Alterações";

    const cardEl = document.querySelector(".card") as HTMLElement | null;

    if (cardEl) {
      // garante que o card pode ter posicionamento absoluto
      if (getComputedStyle(cardEl).position === "static") {
        cardEl.style.position = "relative";
      }

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.id = "delete-group-btn";
      deleteBtn.className = "btn btn-sm btn-danger";
      deleteBtn.innerHTML = "<i class='bi bi-trash-fill'></i>";

      // 👉 POSIÇÃO SUPERIOR DIREITA
      deleteBtn.style.position = "absolute";
      deleteBtn.style.top = "10px";
      deleteBtn.style.right = "10px";
      deleteBtn.style.zIndex = "20";

      deleteBtn.addEventListener("click", async () => {
        if (!confirm("Tem certeza que deseja deletar este grupo?")) return;

        try {
          await apiDelete(`/groups/${slug}/`);
          alert("Grupo deletado com sucesso.");
          window.location.href = "/src/pages/group_list.html";
        } catch (err) {
          console.error(err);
          alert("Erro ao deletar grupo.");
        }
      });

      cardEl.appendChild(deleteBtn);
    }

  } catch (err) {
    console.error(err);
    alert("Erro ao carregar grupo para edição.");
  }
}


function blockUnauthorizedAccess(group: any) {
  const container = document.querySelector(".card-body")!;
  container.innerHTML = `
    <div class="alert alert-danger">
      <strong>Acesso negado.</strong><br/>
      Apenas o criador do grupo pode editá-lo.
    </div>

    <a href="/src/pages/group_detail.html?slug=${group.slug}"
       class="btn btn-warning mt-3">
       <i class="bi bi-chevron-left"></i> Voltar para o grupo
    </a>
  `;
}



function attachDeleteGroupButton(slug: string) {
  const btn = document.getElementById("delete-group-btn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    if (!confirm("Tem certeza que deseja deletar este grupo?")) return;

    try {
      await apiDelete(`/groups/${slug}/`);
      alert("Grupo deletado com sucesso.");
      window.location.href = "/src/pages/group_list.html";
    } catch (err) {
      console.error(err);
      alert("Erro ao deletar grupo.");
    }
  });
}

const cancelBtn = document.getElementById("cancel-btn");
if (cancelBtn) {
  cancelBtn.addEventListener("click", (e) => {
    e.preventDefault();
    window.history.back();
  });
}


function setupSubmit(slug: string | null) {
  const form = document.getElementById("group-form") as HTMLFormElement;
  const alertArea = document.getElementById("alert-area")!;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    alertArea.innerHTML = "";

    const data = new FormData(form);

    const payload = {
      name: data.get("name"),
      description: data.get("description") || "",
    };

    try {
      let result;

      if (slug) {
        result = await apiPut(`/groups/${slug}/`, payload);
      } else {
        result = await apiPost("/groups/", payload);
      }

      window.location.href = `/src/pages/group_detail.html?slug=${result.slug}`;

    } catch (err: any) {
      console.error("Erro ao salvar grupo:", err);

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
          alertArea.innerHTML = `
            <div class="alert alert-danger py-2">
              Não foi possível salvar. Verifique os dados.
            </div>
          `;
          return;
        }
      }

      alertArea.innerHTML = `
        <div class="alert alert-danger py-2">
          Erro ao salvar grupo. Tente novamente.
        </div>
      `;
    }
  });
}

loadPage();
