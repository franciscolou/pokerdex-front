import { apiGet, apiPost } from "../api";

interface Group {
  id: number;
  name: string;
}

async function loadGroups() {
  const select = document.getElementById("group") as HTMLSelectElement;
  try {
    const groups: Group[] = await apiGet("/groups/");
    select.innerHTML =
      `<option value="" disabled selected>Selecione um grupo...</option>` +
      groups.map((g) => `<option value="${g.id}">${g.name}</option>`).join("");
  } catch (err) {
    select.innerHTML = `<option disabled>Erro ao carregar grupos</option>`;
    console.error(err);
  }
}

async function handleSubmit(e: Event) {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  const data = new FormData(form);

  const payload = {
    title: data.get("title") || "",
    date: data.get("date"),
    location: data.get("location") || "",
    buy_in: Number(data.get("buy_in")),
    group: Number(data.get("group")),
    public: data.get("public") === "on",
  };

  try {
    const created = await apiPost("/games/", payload);

    if (!created?.id) {
      alert("Erro inesperado: partida criada mas ID não retornado.");
      return;
    }

    alert("Partida criada com sucesso!");
    window.location.href = `/src/pages/game_detail.html?id=${created.id}`;

  } catch (err) {
    console.error(err);
    alert("Erro ao criar partida. Verifique os dados e tente novamente.");
  }
}

document.getElementById("game-form")?.addEventListener("submit", handleSubmit);
loadGroups();
