import { apiGet, apiPost } from "../api";

interface Group {
  id: number;
  name: string;
  slug: string;
}

async function loadGroups() {
  const groupsContainer = document.getElementById("groups-toggle")!;
  try {
    const groups: Group[] = await apiGet("/groups/");
    if (!groups.length) {
      groupsContainer.innerHTML = `<span class="text-muted small">Nenhum grupo disponível.</span>`;
      return;
    }

    groupsContainer.innerHTML = groups
      .map(
        (g) => `
        <input type="checkbox" id="group-${g.id}" name="groups" value="${g.id}" hidden />
        <label for="group-${g.id}" class="toggle-btn">${g.name}</label>
      `
      )
      .join("");
  } catch (err) {
    groupsContainer.innerHTML =
      `<div class="text-danger small">Erro ao carregar grupos.</div>`;
    console.error(err);
  }
}

async function handleSubmit(e: Event) {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  const data = new FormData(form);

  const selectedGroups = Array.from(
    form.querySelectorAll<HTMLInputElement>("input[name='groups']:checked")
  ).map((el) => el.value);

  const payload = {
    name: data.get("name"),
    date: data.get("date"),
    location: data.get("location"),
    buy_in: parseFloat(data.get("buy_in") as string),
    groups: selectedGroups,
    public: (data.get("public") as string) === "on",
  };

  try {
    const created = await apiPost("/games/", payload);
    alert("Partida criada com sucesso!");
    window.location.href = `./group_detail.html?id=${created.id}`;
  } catch (err) {
    console.error(err);
    alert("Erro ao criar partida. Verifique os dados e tente novamente.");
  }
}

document.getElementById("game-form")?.addEventListener("submit", handleSubmit);
loadGroups();
