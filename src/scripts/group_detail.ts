import { apiGet } from "../api";

interface Membership {
  user: { username: string };
  role: "ADMIN" | "MEMBER";
  joined_at: string;
}

interface Post {
  id: number;
  posted_at: string;
  game: { title: string; id: number };
  posted_by: { username: string };
}

interface Game {
  id: number;
  title: string;
  date: string;
  location?: string;
  buy_in: number;
  participations_count?: number;
}

interface GroupDetail {
  id: number;
  slug: string;
  name: string;
  description?: string;
  created_by: { username: string };
  created_at: string;
  memberships: Membership[];
  is_member: boolean;
  is_admin: boolean;
  is_creator: boolean;
  recent_games: Game[];
  recent_posts: Post[];
}

async function loadGroupDetail() {
  const slug = new URLSearchParams(window.location.search).get("slug");
  if (!slug) return alert("Grupo inválido");

  const group: GroupDetail = await apiGet(`/groups/${slug}/`);
  console.log("Group memeberships:", group.memberships);
  renderHeader(group);
  renderMembers(group);
  renderGames(group);
  renderPosts(group);
}

function renderHeader(group: GroupDetail) {
  document.getElementById("back-link-area")!.innerHTML = `
    <a href="/src/pages/group_list.html" class="btn btn-outline-light btn-sm">
      <i class="bi bi-chevron-left"></i> Voltar
    </a>`;

  document.getElementById("group-card")!.innerHTML = `
    <div class="card bg-dark border-secondary text-light mb-3">
      <div class="card-body">
        <h1 class="h4 text-warning mb-2">${group.name}</h1>
        <p class="text-gray mb-2">${group.description || "Sem descrição"}</p>

        <div class="d-flex flex-wrap gap-2">
          <span class="chip chip-neutral">Criado por: ${group.created_by.username}</span>
          <span class="chip chip-neutral">Data: ${new Date(group.created_at).toLocaleDateString("pt-BR")}</span>
          <span class="chip chip-neutral">Membros: ${group.memberships.length}</span>
        </div>

        ${group.is_member ? "" : `
          <button id="join-btn" class="btn btn-sm btn-warning mt-3">
            Pedir para entrar no grupo
          </button>
        `}
      </div>
    </div>
  `;
}

function renderMembers(group: GroupDetail) {
  const container = document.getElementById("members-container")!;
  console.log("Rendering members:", group.memberships);
  if (!group.memberships.length) {
    container.innerHTML = `<p class="text-gray">Nenhum membro ainda.</p>`;
    return;
  }

  container.innerHTML = `
    <div class="card bg-dark border-secondary text-light">
      <div class="card-body">
        <h3 class="h5 mb-3">Membros (${group.memberships.length})</h3>
        <ul class="list-group list-group-flush">
          ${group.memberships.map(
            (m) => `
              <li class="list-group-item d-flex justify-content-between">
                <span class="text-light">${m.user.username}</span>
                <span class="badge bg-${m.role === "ADMIN" ? "warning" : "secondary"}">
                  ${m.role.toLowerCase()}
                </span>
              </li>
            `
          ).join("")}
        </ul>
      </div>
    </div>
  `;
}

function renderGames(group: GroupDetail) {
  const container = document.getElementById("games-container")!;
  
  if (!group.recent_games.length) {
    container.innerHTML = `
      <div class="card bg-dark border-secondary text-light">
        <div class="card-body text-center py-4">
          <p class="mb-3 text-light">Nenhuma partida registrada neste grupo ainda.</p>
          <a href="/src/pages/game_create.html" class="btn btn-warning">
            + Criar primeira partida
          </a>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="card bg-dark border-secondary text-light">
      <div class="card-body">
        <h3 class="h5 mb-3">Últimas partidas</h3>
        <ul class="list-group list-group-flush">
          ${group.recent_games.map(renderGameItem).join("")}
        </ul>
      </div>
    </div>
  `;

  attachGameClickEvents();
}


function attachGameClickEvents() {
  document.querySelectorAll(".game-item").forEach((item) => {
    item.addEventListener("click", () => {
      const id = item.getAttribute("data-game-id");
      if (id) {
        window.location.href = `/src/pages/game_detail.html?id=${id}`;
      }
    });
  });
}

function renderGameItem(g: Game) {
  return `
    <li 
      class="list-group-item d-flex justify-content-between align-items-center text-light game-item"
      data-game-id="${g.id}"
      style="cursor: pointer;"
    >
      <div>
        <strong>${g.title}</strong>
        <div class="small text-gray">
          ${new Date(g.date).toLocaleDateString("pt-BR")}
        </div>
      </div>

      <div class="d-flex gap-3 align-items-center">
        <span class="chip chip-gold">💰 R$ ${g.buy_in}</span>
        <span class="badge bg-secondary">👥 ${g.participations_count ?? 0} jogadores</span>
      </div>
    </li>
  `;
}


function renderPosts(group: GroupDetail) {
  if (!group.recent_posts.length) return;

  const html = group.recent_posts
    .map(
      (p) => `
      <li class="list-group-item">
        <small>${p.posted_by.username} — ${new Date(p.posted_at).toLocaleString("pt-BR")}</small>
        <br>📣 ${p.game.title}
      </li>
    `
    )
    .join("");

  document.getElementById("participations-container")!.innerHTML = `
    <div class="card bg-dark border-secondary text-light mt-4">
      <div class="card-body">
        <h3 class="h5 mb-3">Atividades recentes</h3>
        <ul class="list-group list-group-flush">${html}</ul>
      </div>
    </div>
  `;
}

loadGroupDetail();
