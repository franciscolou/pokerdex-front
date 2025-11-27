import { apiGet, apiPost, apiPatch, apiDelete } from "../api";

const id = new URLSearchParams(window.location.search).get("id");
const isEditMode = Boolean(id);

const titleEl = document.getElementById("page-title")!;
const partContainer = document.getElementById("participations-container")!;
const addBtn = document.getElementById("add-part-btn")!;
const form = document.getElementById("game-form") as HTMLFormElement;
const cancelBtn = document.getElementById("cancel-btn")!;

let originalParticipants: number[] = [];
let groupMembers: { id: number; username: string }[] = [];
let currentUser: any = null;

let participationIndex = 0;


function blockUnauthorized() {
  const container = document.querySelector(".card-body")!;
  container.innerHTML = `
      <div class="alert alert-danger">
        <strong>Acesso negado.</strong><br>
        Você não tem permissão para editar esta partida.
      </div>

      <a href="/src/pages/group_list.html" class="btn btn-warning mt-3">
        ⬅ Voltar
      </a>
  `;
  
  form.remove();
  addBtn.remove();
  partContainer.remove();
}


async function loadCurrentUser() {
  try {
    currentUser = await apiGet("/auth/me/");
  } catch {
    currentUser = null;
  }
}


async function loadGroupMembers(groupSlug: string) {
  const res = await apiGet(`/groups/${groupSlug}/`);
  return res.memberships.map((m: any) => ({
    id: m.user.id,
    username: m.user.username,
  }));
}

function populateUserSelect(select: HTMLSelectElement, selectedId?: number) {
  select.innerHTML = groupMembers
    .map(
      m =>
        `<option value="${m.id}" ${
          m.id === selectedId ? "selected" : ""
        }>${m.username}</option>`
    )
    .join("");
}


function createParticipationCard(data?: any) {
  if (!groupMembers.length) return;

  const idx = participationIndex++;

  const card = document.createElement("div");
  card.className = "card bg-transparent text-light mb-2 p-2";
  card.id = `participation-${idx}`;

  card.innerHTML = `
    <input type="hidden" name="part_id_${idx}" value="${data?.id ?? ""}" />

    <div class="row g-2 align-items-end">
      <div class="col-md-4">
        <label class="form-label">Jogador</label>
        <select name="player_id_${idx}" class="form-control" data-player-select></select>
      </div>

      <div class="col-md-3">
        <label class="form-label">Rebuy</label>
        <input type="number" step="0.01" name="rebuy_${idx}" class="form-control" 
          value="${data?.rebuy ?? 0}" />
      </div>

      <div class="col-md-3">
        <label class="form-label">Saldo final</label>
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
  populateUserSelect(card.querySelector("[data-player-select]")!, data?.player_id);
}

addBtn.addEventListener("click", () => {
  if (!groupMembers.length) {
    alert("Escolha um grupo antes de adicionar jogadores!");
    return;
  }
  createParticipationCard();
});


async function loadGroups(selectedId?: number) {
  const select = document.getElementById("group") as HTMLSelectElement;

  try {
    const groups = (await apiGet("/groups/")).myGroups;

    select.innerHTML = `
      <option value="" disabled ${selectedId ? "" : "selected"}>
        Selecione um grupo...
      </option>
      ${groups
        .map(
          (g: any) => `
        <option value="${g.id}" data-slug="${g.slug}"
          ${selectedId == g.id ? "selected" : ""}>
          ${g.name}
        </option>`
        )
        .join("")}
    `;
  } catch {
    select.innerHTML = `<option disabled>Erro ao carregar grupos</option>`;
  }
}


async function loadGame() {
  if (!isEditMode) {
    titleEl.textContent = "➕ Nova Partida";
    return;
  }

  titleEl.textContent = "✏️ Editar Partida";

  const game = await apiGet(`/games/${id}/`);

  const me = await apiGet("/auth/me/");

  const groupDetail = await apiGet(`/groups/${game.group.slug}/`);

  const isGroupOwner = groupDetail.created_by.id === me.id;
  const isGameOwner = game.created_by.id === me.id;

  if (!isGroupOwner && !isGameOwner) {
    const container = document.querySelector(".card-body")!;
    container.innerHTML = `
      <div class="alert alert-danger">
        <strong>Acesso negado.</strong><br>
        Você não tem permissão para editar esta partida.
      </div>

      <a href="/src/pages/group_detail.html?slug=${game.group.slug}" 
         class="btn btn-warning mt-3">
        ⬅ Voltar
      </a>
    `;

    form.remove();
    addBtn.remove();
    partContainer.remove();
    return;
  }


try {
  const cardEl = document.querySelector(".card") as HTMLElement | null;

  if (cardEl) {
    if (getComputedStyle(cardEl).position === "static") {
      cardEl.style.position = "relative";
    }

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.id = "delete-game-btn";
    deleteBtn.className = "btn btn-danger btn-sm";
    deleteBtn.innerHTML = "<i class='bi bi-trash-fill'></i>";

    deleteBtn.style.position = "absolute";
    deleteBtn.style.top = "10px";
    deleteBtn.style.right = "10px";

    deleteBtn.addEventListener("click", async () => {
      if (!confirm("Tem certeza que deseja excluir esta partida?")) return;

      try {
        await apiDelete(`/games/${id}/delete/`);

        window.location.href =
          `/src/pages/group_detail.html?slug=${game.group.slug}`;
      } catch (err) {
        console.error(err);
        alert("Erro ao excluir a partida.");
      }
    });

    cardEl.appendChild(deleteBtn);
  }
} catch (err) {
  console.error("Erro ao criar botão delete:", err);
}


  originalParticipants = game.participations.map((p: any) => p.player.id);

  form.title.value = game.title;
  form.date.value = game.date;
  form.location.value = game.location;
  form.buy_in.value = game.buy_in;

  await loadGroups(game.group.id);
  const groupSelect = document.getElementById("group") as HTMLSelectElement;
  groupSelect.setAttribute("readonly", "true");
  groupSelect.classList.add("bg-secondary");

  groupMembers = await loadGroupMembers(game.group.slug);
  addBtn.removeAttribute("disabled");

  game.participations?.forEach((p: any) => {
    createParticipationCard({
      id: p.id,
      player_id: p.player.id,
      rebuy: p.rebuy,
      final_balance: p.final_balance,
    });
  });
}


async function handleSubmit(e: Event) {
  e.preventDefault();

  const data = new FormData(form);

  const currentPlayers = Array.from(
    document.querySelectorAll("[id^='participation']")
  ).map(card => {
    const idx = card.id.split("-")[1];
    return Number(data.get(`player_id_${idx}`));
  });

  const toRemove = originalParticipants.filter(
    playerId => !currentPlayers.includes(playerId)
  );

  const gamePayload: any = {
    title: data.get("title"),
    date: data.get("date"),
    location: data.get("location") || "",
    buy_in: Number(data.get("buy_in")),
    group_id: Number(data.get("group")),
  };

  const participations: any[] = [];

  document.querySelectorAll("[id^='participation']").forEach(card => {
    const idx = card.id.split("-")[1];
    const playerId = Number(data.get(`player_id_${idx}`));

    if (!playerId) {
      return;
    }

    participations.push({
      player_id: playerId,
      rebuy: Number(data.get(`rebuy_${idx}`)),
      final_balance: data.get(`final_balance_${idx}`),
    });

  });

  try {
    let created;

    if (isEditMode) {
      created = await apiPatch(`/games/${id}/`, gamePayload);
    } else {
      created = await apiPost(`/games/`, gamePayload);
    }

    for (const part of participations) {
      await apiPost(`/games/${created.id}/add_participation/`, part);
    }

    for (const playerId of toRemove) {
      await apiPost(`/games/${created.id}/remove_participation/`, {
        player_id: playerId,
      });
    }

    window.location.href = `/src/pages/game_detail.html?id=${created.id}`;
  } catch (err) {
    console.error(err);
    alert("Erro ao salvar. Tente novamente.");
  }
}


document.getElementById("group")?.addEventListener("change", async (e) => {
  const select = e.target as HTMLSelectElement;
  const slug = select.selectedOptions[0]?.getAttribute("data-slug");
  if (!slug) return;

  groupMembers = await loadGroupMembers(slug);
  addBtn.removeAttribute("disabled");
  partContainer.innerHTML = "";
  participationIndex = 0;
});


form.addEventListener("submit", handleSubmit);

(async () => {
  await loadCurrentUser();
  await loadGroups();
  await loadGame();
  if (!isEditMode) {
    titleEl.textContent = "➕ Nova Partida";
  }
})();

cancelBtn.addEventListener("click", (e) => {
  e.preventDefault();
  window.history.back();
});