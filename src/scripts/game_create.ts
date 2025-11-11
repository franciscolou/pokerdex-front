import { apiGet, apiPost } from "../api";

interface Group {
  id: number;
  name: string;
}

const form = document.getElementById("game-form") as HTMLFormElement;

async function loadForm() {
  const groups: Group[] = await apiGet("/groups/");
  renderForm(groups);
}

function renderForm(groups: Group[]) {
  form.innerHTML = `
    <div class="mb-3">
      <label class="form-label">Título</label>
      <input name="title" type="text" class="form-control" placeholder="Ex: Noite de Sexta" required />
    </div>

    <div class="mb-3">
      <label class="form-label">Data</label>
      <input name="date" type="date" class="form-control" required />
    </div>

    <div class="mb-3">
      <label class="form-label">Local</label>
      <input name="location" type="text" class="form-control" placeholder="Ex: Casa do João" />
    </div>

    <div class="mb-3">
      <label class="form-label">Buy-in</label>
      <input name="buy_in" type="number" step="0.01" min="0" class="form-control" placeholder="Ex: 50.00" required />
    </div>

    <div class="mb-3">
      <label class="form-label">Postar em grupos</label>
      <div class="toggle-group d-flex flex-wrap gap-2">
        ${groups
          .map(
            (g) => `
            <input type="checkbox" id="group-${g.id}" name="groups" value="${g.id}" />
            <label for="group-${g.id}" class="toggle-btn">${g.name}</label>
          `
          )
          .join("")}
      </div>
    </div>

    <div class="d-flex justify-content-end">
      <a href="/src/pages/group_list.html" class="btn btn-sm btn-outline-light me-2">Cancelar</a>
      <button type="submit" class="btn btn-sm btn-warning">Criar partida</button>
    </div>
  `;

  form.addEventListener("submit", handleSubmit);
}

async function handleSubmit(ev: SubmitEvent) {
  ev.preventDefault();

  const formData = new FormData(form);
  const data = {
    title: formData.get("title"),
    date: formData.get("date"),
    location: formData.get("location"),
    buy_in: Number(formData.get("buy_in")),
    groups: Array.from(formData.getAll("groups")).map((id) => Number(id)),
  };

  if (!data.groups.length) {
    alert("Selecione pelo menos um grupo.");
    return;
  }

  try {
    await apiPost("/games/", data);
    alert("Partida criada com sucesso!");
    window.location.href = "/src/pages/group_list.html";
  } catch (err) {
    console.error(err);
    alert("Erro ao criar partida. Verifique os campos e tente novamente.");
  }
}

loadForm();
