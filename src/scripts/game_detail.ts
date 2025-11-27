import { apiGet } from "../api";

interface GameDetail {
  id: number;
  description: string;
  title: string;
  date: string;
  location?: string;
  buy_in: number;
  created_by: { username: string };
  group: { id: number; slug: string; name: string };
  participations?: Participation[];
  is_game_creator: boolean;
  is_group_creator: boolean;
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
  const isCreator = game.is_game_creator === true || game.is_group_creator === true;

  const parts = game.participations ?? [];
  const totalRebuys = parts.reduce((sum, p) => sum + (Number(p.rebuy) || 0), 0);
  const totalPot = (parts.length * game.buy_in) + totalRebuys;

  el.innerHTML = `
    <div class="card bg-dark border-secondary text-light">
      <div class="card-body d-flex flex-column flex-md-row align-items-start gap-3">

        <div class="flex-grow-1">
          <h1 class="h4 text-warning mb-2">${game.title || "Partida"}</h1>
          <p class="text-gray mb-2">${game.description || ""}</p>

          <div class="d-flex flex-wrap gap-2 mb-3">
            <span class="chip chip-neutral">👤 Criado por: ${game.created_by.username}</span>
          
            <span class="chip chip-neutral">📅 ${new Date(game.date).toLocaleDateString("pt-BR")}</span>
          
            ${game.location ? `<span class="chip chip-neutral">📍 ${game.location}</span>` : ""}
          
            <span class="chip chip-total">💵 R$${game.buy_in}</span>
            
            <span class="chip chip-gold">💰 R$${totalPot.toFixed(2)}</span>
          </div>
        </div>

        ${isCreator ? `
          <div>
            <a href="/src/pages/game_manage.html?id=${game.id}"
               class="btn btn-outline-warning btn-sm">
              <i class="bi bi-pencil-square"></i> Editar partida
            </a>
          </div>
        ` : ""}
      </div>
    </div>
  `;
}



function renderParticipations(game: GameDetail) {
  const el = document.getElementById("participations-container")!;
  const parts = game.participations ?? [];

  if (!parts.length) {
    el.innerHTML = `
      <div class="text-center mt-4">
        <p class="text-gray mb-3">Essa partida ainda não tem participações.</p>
        <a href="/src/pages/participation_add.html?game=${game.id}" 
          class="btn btn-warning btn-sm">
          <i class="bi bi-person-plus"></i> Adicionar participação
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
          ${parts.map(p => renderParticipation(p, game.buy_in)).join("")
}
        </ul>
      </div>
    </div>
  `;
}



function renderParticipation(p: Participation, buyIn: number) {
  const rebuyValue = Number(p.rebuy) || 0;
  const finalBalance = Number(p.final_balance) || 0;

  const totalInvested = buyIn + rebuyValue;
  const profit = finalBalance - totalInvested;

  const color =
    profit > 0 ? "amount-win" :
    profit < 0 ? "amount-loss" :
    "amount-even";

  const rebuyChip = rebuyValue > 0
    ? `<span class="chip chip-neutral ms-2">
         <i class="bi bi-arrow-repeat"></i> R$ ${rebuyValue.toFixed(2)}
       </span>`
    : "";

  return `
    <li class="list-group-item d-flex justify-content-between align-items-center text-light">
      <div>
        <strong>${p.player.username}</strong>
      </div>

      <div class="d-flex align-items-center justify-content-between gap-2">
      ${rebuyChip}
        <div class="${color}">
          R$ ${finalBalance.toFixed(2)}
        </div>
      </div>
    </li>
  `;
}




loadGameDetail();
