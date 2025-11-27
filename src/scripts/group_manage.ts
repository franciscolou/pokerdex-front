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

    (document.getElementById("name") as HTMLInputElement).value = group.name;
    (document.getElementById("description") as HTMLTextAreaElement).value =
      group.description ?? "";

    document.querySelector("h1")!.innerHTML = "✏️ Editar Grupo";
    document.querySelector("p.text-gray")!.innerHTML =
      "Atualize as informações do grupo.";
    document.querySelector("#group-form button")!.innerHTML = "Salvar Alterações";

    if (group.is_creator) {
      const form = document.getElementById("group-form")!;
      const deleteBtn = document.createElement("button");

      deleteBtn.id = "delete-group-btn";
      deleteBtn.type = "button";
      deleteBtn.className = "btn btn-sm btn-outline-danger mt-3";
      deleteBtn.innerHTML = "🗑️ Deletar Grupo";

      form.insertAdjacentElement("afterend", deleteBtn);
      attachDeleteGroupButton(slug);
    }
  } catch (err) {
    console.error(err);
    alert("Erro ao carregar grupo para edição.");
  }
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
