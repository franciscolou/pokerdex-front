// src/scripts/participation_add.ts
import { apiGet, apiPost } from "../api";

interface GameDetail {
  id: number;
  title: string;
  group: { slug: string };
}

interface Membership {
  user: { id: number; username: string };
}

async function loadForm() {
  const params = new URLSearchParams(window.location.search);
  const gameId = params.get("game");

  if (!gameId) {
    alert("Partida inválida.");
    return;
  }

  try {
    const game: GameDetail = await apiGet(`/games/${gameId}/`);

    const groupData = await apiGet(`/groups/${game.group.slug}/`);

    const select = document.getElementById("player") as HTMLSelectElement;

    select.innerHTML = `
      <option disabled selected>Selecione um jogador...</option>
      ${groupData.memberships
        .map((m: Membership) => 
          `<option value="${m.user.id}">${m.user.username}</option>`
        )
        .join("")}
    `;

    const titleEl = document.getElementById("game-title");
    if (titleEl) {
      titleEl.textContent = game.title;
    }

  } catch (err) {
    console.error(err);
    alert("Erro ao carregar dados do jogo.");
  }
}

async function handleSubmit(e: Event) {
  e.preventDefault();

  const params = new URLSearchParams(window.location.search);
  const gameId = params.get("game");

  if (!gameId) {
    alert("Partida inválida.");
    return;
  }

  const form = e.target as HTMLFormElement;
  const data = new FormData(form);

  const payload = {
    player_id: Number(data.get("player")),
    rebuy: Number(data.get("rebuy")) || 0,
    final_balance: Number(data.get("final_balance")) || 0,
  };


  try {
    await apiPost(`/games/${gameId}/add_participation/`, payload);

    window.location.href = `/src/pages/game_detail.html?id=${gameId}`;

  } catch (err) {
    console.error(err);
    alert("Erro ao salvar participação.");
  }
}

document.getElementById("participation-form")?.addEventListener("submit", handleSubmit);

loadForm();
