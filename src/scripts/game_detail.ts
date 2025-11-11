import { apiGet, apiDelete } from "../api";

interface GroupRef {
  slug: string;
  name: string;
}

interface Game {
  id: number;
  name: string;
  date: string;
  location?: string;
  buy_in: number;
  total_pot: number;
  can_edit_game: boolean;
  from_group?: GroupRef;
}

interface Participation {
  id: number;
  player: string;
  player_id: number;
  rebuy: number;
  final_balance: number;
}

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function getParam(key: string): string | null {
  return new URLSearchParams(window.location.search).get(key);
}

async function renderGameDetail() {
  const gameId = getParam("id");
  if (!gameId) {
    document.body.innerHTML = "<p>Erro: ID da partida não informado.</p>";
    return;
  }

  const game: Game = await apiGet(`/games/${gameId}/`);
  const participations: Participation[] = await apiGet(`/games/${gameId}/participations/`);

  const backLink = document.getElementById("back-link-area")!;
  const gameCard = document.getElementById("game-card")!;
  const partContainer = document.getElementById("participations-container")!;

  // 🔙 link de retorno
  if (game.from_group) {
    backLink.innerHTML = `
      <a href="/src/pages/group_detail.html?slug=${game.from_group.slug}"
         class="back-link-ghost">
        <i class="bi bi-chevron-left"></i> Voltar ao grupo
      </a>`;
  }

  const gameDate = new Date(game.date).toLocaleDateString("pt-BR");

  // 🪪 informações do jogo
  gameCard.innerHTML = `
    <div class="card bg-dark border-secondary text-light mb-3">
      <div class="card-body d-flex flex-column flex-md-row align-items-start align-items-md-center gap-3">
        <div class="flex-grow-1">
          <h1 class="h4 text-warning mb-2">${game.name}</h1>

          <div class="d-flex flex-wrap gap-2">
            <span class="chip chip-neutral" title="Data">📅 ${gameDate}</span>
            ${
              game.location
                ? `<span class="chip chip-neutral" title="Local">📍 ${game.location}</span>`
                : ""
            }
            <span class="chip chip-gold" title="Buy-in">💰 ${formatCurrency(game.buy_in)}</span>
            <span class="chip chip-green" title="Total da noite">💵 ${formatCurrency(
              game.total_pot
            )}</span>
          </div>
        </div>

        ${
          game.can_edit_game
            ? `
          <a class="btn btn-sm btn-glass btn-glass-gold btn-icon-gap d-md-label"
             href="/src/pages/game_edit.html?id=${game.id}">
             <i class="bi bi-pencil-fill"></i>Editar</a>
          <button class="btn btn-sm btn-glass btn-glass-danger btn-icon-gap d-md-label"
                  id="delete-game-btn">
             <i class="bi bi-trash3-fill"></i>Excluir</button>
        `
            : ""
        }

        ${
          participations.length
            ? `
          <div class="ms-md-auto d-flex gap-2">
            <a href="/src/pages/participation_add.html?game=${game.id}"
               class="btn btn-sm btn-glass btn-glass-green btn-icon-gap d-md-label">
              <i class="bi bi-person-fill-add"></i>
              Adicionar participante
            </a>
          </div>
        `
            : ""
        }
      </div>
    </div>
  `;

  // 🗑️ botão de deletar partida
  const delBtn = document.getElementById("delete-game-btn");
  if (delBtn) {
    delBtn.addEventListener("click", async () => {
      if (confirm("Tem certeza que deseja excluir esta partida?")) {
        await apiDelete(`/games/${gameId}/`);
        window.location.href = "/src/pages/group_list.html";
      }
    });
  }

  // 📋 participações
  if (!participations.length) {
    partContainer.innerHTML = `
      <div class="text-center my-4">
        <p class="mb-3">Nenhuma participação ainda.</p>
        <a href="/src/pages/participation_add.html?game=${game.id}" class="btn btn-warning">
          + Adicionar participação
        </a>
      </div>`;
    return;
  }

  partContainer.innerHTML = `
    <div class="card bg-dark border-secondary text-light">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h2 class="h5 m-0">Participações</h2>
          <span class="badge bg-secondary">${participations.length}</span>
        </div>
        <ul class="list-group list-group-flush">
          ${participations.map((p) => renderParticipation(game, p)).join("")}
        </ul>
      </div>
    </div>
  `;
}

function renderParticipation(game: Game, p: Participation): string {
  const invested = game.buy_in + p.rebuy;
  const cls =
    p.final_balance > invested
      ? "amount-win"
      : p.final_balance < invested
      ? "amount-loss"
      : "amount-even";

  return `
    <li class="list-group-item text-light d-flex justify-content-between align-items-center">
      <div class="d-flex align-items-center gap-2">
        <span class="player-pill">${p.player}</span>
      </div>

      <div class="text-end">
        <div class="d-flex align-items-center gap-2 justify-content-end">
          <div class="amount ${cls}">
            ${formatCurrency(p.final_balance)}
          </div>

          <span class="chip chip-neutral" title="Rebuy">
            ↻ ${formatCurrency(p.rebuy || 0)}
          </span>

          <a class="btn btn-xs btn-promote"
             href="/src/pages/participation_edit.html?game=${game.id}&part=${p.id}">
            <i class="bi bi-pencil-fill"></i>
          </a>
          <button class="btn btn-xs btn-remove" data-id="${p.id}">
            <i class="bi bi-trash3-fill"></i>
          </button>
        </div>
      </div>
    </li>
  `;
}

renderGameDetail();
