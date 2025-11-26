import { apiGet, apiPost, apiPatch } from "../api";

// Detect mode
const id = new URLSearchParams(window.location.search).get("id");
const isEditMode = Boolean(id);

// DOM refs
const titleEl = document.getElementById("page-title")!;
const partContainer = document.getElementById("participations-container")!;
const addBtn = document.getElementById("add-part-btn")!;
const form = document.getElementById("game-form") as HTMLFormElement;

let participationIndex = 0;   // for unique field IDs

async function loadGroupMembers(groupId: number) {
  const res = await apiGet(`/groups/${groupId}/`);  // usa o serializer GroupDetail
  return res.memberships.map((m: any) => ({
    id: m.user.id,
    username: m.user.username
  }));
}

function populateUserSelect(select: HTMLSelectElement, selectedId?: number) {
  select.innerHTML = groupMembers
    .map(m => `<option value="${m.id}" ${m.id === selectedId ? "selected" : ""}>${m.username}</option>`)
    .join("");
}


let groupMembers: { id: number; username: string }[] = [];


function createParticipationCard(data?: { id?: number; player_id?: number; rebuy?: number; final_balance?: number }) {
  const idx = participationIndex++;

  const card = document.createElement("div");
  card.className = "card bg-secondary text-light mb-2 p-2";
  card.id = `participation-${idx}`;

  card.innerHTML = `
    <input type="hidden" name="part_id_${idx}" value="${data?.id ?? ""}" />

    <div class="row g-2 align-items-end">
      <div class="col-md-4">
        <label class="form-label">Jogador</label>
        <select
          name="player_id_${idx}"
          class="form-control"
          data-player-select
          ${groupMembers.length ? "" : "disabled"}
        ></select>
      </div>

      <div class="col-md-3">
        <label class="form-label">Rebuy</label>
        <input type="number" step="0.01" name="rebuy_${idx}" class="form-control"
          value="${data?.rebuy ?? 0}" />
      </div>

      <div class="col-md-3">
        <label class="form-label">Balance Final</label>
        <input type="number" step="0.01" name="final_balance_${idx}" class="form-control"
          value="${data?.final_balance ?? 0}" required />
      </div>

      <div class="col-md-2">
        <button type="button" class="btn btn-danger btn-sm w-100"
          onclick="document.getElementById('participation-${idx}').remove()">
          Remover
        </button>
      </div>
    </div>
  `;

  partContainer.appendChild(card);

  // SE já existirem membros → popular select
  const select = card.querySelector("[data-player-select]") as HTMLSelectElement;
  if (groupMembers.length) populateUserSelect(select, data?.player_id);
}



addBtn.addEventListener("click", () => createParticipationCard());

// Load groups
async function loadGroups(selectedId?: number) {
  const select = document.getElementById("group") as HTMLSelectElement;
  try {
    const groups = (await apiGet("/groups/")).myGroups;
    select.innerHTML = groups.map((g: any) => `
      <option value="${g.id}" ${selectedId == g.id ? "selected" : ""}>
        ${g.name}
      </option>`).join("");
  } catch {
    select.innerHTML = `<option disabled>Erro ao carregar grupos</option>`;
  }
}

async function loadGame() {
  if (!isEditMode) return;
  titleEl.textContent = "✏️ Editar Partida";

  const game = await apiGet(`/games/${id}/`);
  console.log("Game to edit:", game);
  console.log("Form:", form);
  form.title.value = game.title;
  form.date.value = game.date;
  form.location.value = game.location;
  form.buy_in.value = game.buy_in;

  await loadGroups(game.group.id);

  // Load participations dynamically
  game.participations?.forEach((p: any) => {
    createParticipationCard({
      id: p.id,
      player: p.player.id,
      rebuy: p.rebuy,
      final_balance: p.final_balance
    });
  });
}

async function handleSubmit(e: Event) {
  e.preventDefault();
  const data = new FormData(form);

  // Base payload
  const gamePayload: any = {
    title: data.get("title") as string,
    date: data.get("date"),
    location: data.get("location") || "",
    buy_in: Number(data.get("buy_in")),
    group_id: Number(data.get("group")),
  };

  // Extract participations
  const participations: any[] = [];
  document.querySelectorAll("[id^='participation']").forEach((card) => {
    const idx = card.id.split("-")[1];
    participations.push({
      player_id: Number(data.get(`player_id_${idx}`)),
      rebuy: Number(data.get(`rebuy_${idx}`)),
      final_balance: Number(data.get(`final_balance_${idx}`)),
    });
  });

  try {
    let created;

    if (isEditMode) {
      created = await apiPatch(`/games/${id}/`, gamePayload);
    } else {
      created = await apiPost(`/games/`, gamePayload);
    }

    // Save participations
    if (participations.length) {
      for (const part of participations) {
        await apiPost(`/games/${created.id}/add_participation/`, part);
      }
    }

    window.location.href = `/src/pages/game_detail.html?id=${created.id}`;
  } catch (err) {
    console.error(err);
    alert("Erro ao salvar. Tente novamente.");
  }
}

document.getElementById("group")?.addEventListener("change", async (e) => {
  const groupId = Number((e.target as HTMLSelectElement).value);
  if (!groupId) return;

  // Buscar membros:
  groupMembers = await loadGroupMembers(groupId);

  // Liberar os selects existentes:
  document.querySelectorAll("[data-player-select]").forEach(sel => {
    populateUserSelect(sel as HTMLSelectElement);
    sel.removeAttribute("disabled");
  });
});

document.getElementById("group")?.addEventListener("change", () => {
  partContainer.innerHTML = "";   // remove todos os cards
  participationIndex = 0;         // reseta IDs
});



form.addEventListener("submit", handleSubmit);
if (!isEditMode) titleEl.textContent = "➕ Nova Partida";
loadGroups();
loadGame();
