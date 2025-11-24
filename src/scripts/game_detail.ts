import { apiGet } from "../api";

interface GameDetail {
  id: number;
  title: string;
  date: string;
  location?: string;
  buy_in: number;
  created_by: { username: string };
  group: { id: number; slug: string; name: string };
  participations?: Participation[];
}

interface Participation {
  id: number;
  player: { username: string };
  rebuy: number;
  final_balance: number;
}

async function loadGameDetail() {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) return alert("Partida inválida.");

  try {
    const game: GameDetail = await apiGet(`/games/${id}/`);

    renderBackLink(game);
    renderGameCard(game);
    renderParticipations(game);

  } catch (err) {
    console.error(err);
    alert("Erro ao carregar partida.");
  }
}

function renderBackLink(game: GameDetail) {
  const el = document.getElementById("back-link-area")!;
  el.innerHTML = `
    <a href="/src/pages/group_detail.html?slug=${game.group.slug}"
       class="btn btn-outline-light btn-sm">
      <i class="bi bi-chevron-left"></i> Voltar ao grupo
    </a>`;
}

function renderGameCard(game: GameDetail) {
  const el = document.getElementById("game-card")!;
  el.innerHTML = `
    <div class="card bg-dark border-secondary text-light">
      <div class="card-body d-flex flex-column flex-md-row align-items-start gap-3">

        <div class="flex-grow-1">
          <h1 class="h4 text-warning mb-2">${game.title || "Partida"}</h1>

          <div class="d-flex flex-wrap gap-2 mb-3">
            <span class="chip chip-neutral">📅 ${new Date(game.date).toLocaleDateString("pt-BR")}</span>
            ${game.location ? `<span class="chip chip-neutral">📍 ${game.location}</span>` : ""}
            <span class="chip chip-gold">💰 Buy-in: R$${game.buy_in}</span>
            <span class="chip chip-neutral">👤 Criado por: ${game.created_by.username}</span>
          </div>
        </div>

      </div>
    </div>
  `;
}

function renderParticipations(game: GameDetail) {
  const el = document.getElementById("participations-container")!;

  const parts = game.participations ?? [];

  if (!parts.length) {
    el.innerHTML = `
      <div class="text-center my-4">
        <p class="mb-3">Nenhuma participação registrada.</p>
        <a href="/src/pages/participation_add.html?game=${game.id}" 
          class="btn btn-warning">
          + Adicionar participantes
        </a>
      </div>
    `;
    return;
  }

  el.innerHTML = `
    <div class="card bg-dark border-secondary text-light">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h3 class="h5 m-0">Participações</h3>
          <span class="badge bg-secondary">${parts.length}</span>
        </div>

        <ul class="list-group list-group-flush">
          ${parts.map(renderParticipation).join("")}
        </ul>
      </div>
    </div>
  `;
}


function renderParticipation(p: Participation) {
  const totalInvested = Number(p.rebuy);
  const balance = Number(p.final_balance);

  const color =
    balance > totalInvested ? "amount-win" :
    balance < totalInvested ? "amount-loss" :
    "amount-even";

  return `
    <li class="list-group-item d-flex justify-content-between align-items-center text-light">
      <div>
        <strong>${p.player.username}</strong>
        <small class="text-muted d-block">R$ ${balance} (rebuy: ${p.rebuy || 0})</small>
      </div>

      <div class="${color}">R$ ${balance}</div>
    </li>
  `;
}

loadGameDetail();
