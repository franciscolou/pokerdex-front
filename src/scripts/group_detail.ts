import { apiGet, apiPost } from "../api";

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
  already_requested: boolean; // <- importante
  join_requests: JoinRequest[];
}

interface JoinRequest {
  id: number;
  requested_by: { username: string };
  created_at: string;
}

/* ============================================================
   LOAD
============================================================ */
async function loadGroupDetail() {
  const slug = new URLSearchParams(window.location.search).get("slug");
  if (!slug) return alert("Grupo inválido");

  let group: GroupDetail;

  try {
    group = await apiGet(`/groups/${slug}/`);
  } catch (err) {
    console.error(err);
    return;
  }

  renderHeader(group);

  // Se não é membro → só mostra aviso e acabou
  if (!group.is_member) {
    renderNonMemberNotice(group);
    return;
  }

  renderMembers(group);

  if (group.is_admin || group.is_creator) {
    renderJoinRequests(group);
  }
  renderGames(group);
}

/* ============================================================
   HEADER DO GRUPO
============================================================ */
function renderHeader(group: GroupDetail) {
  document.getElementById("back-link-area")!.innerHTML = `
    <a href="/src/pages/group_list.html" class="btn btn-outline-light btn-sm">
      <i class="bi bi-chevron-left"></i> Voltar
    </a>
  `;

  document.getElementById("group-card")!.innerHTML = `
    <div class="card bg-dark border-secondary text-light mb-3">
      <div class="card-body">

        <div class="d-flex justify-content-between align-items-start">

          <div class="flex-grow-1 me-3">
            <h1 class="h4 text-warning mb-2">${group.name}</h1>
            <p class="text-gray mb-2">${group.description || "Sem descrição"}</p>

            <div class="d-flex flex-wrap gap-2">
              <span class="chip chip-neutral">Criado por: ${group.created_by.username}</span>
              <span class="chip chip-neutral">
                Data: ${new Date(group.created_at).toLocaleDateString("pt-BR")}
              </span>
              <span class="chip chip-neutral">Membros: ${group.memberships.length}</span>
            </div>
          </div>

          ${group.is_creator ? `
            <a href="/src/pages/group_manage.html?slug=${group.slug}"
              class="btn btn-warning btn-sm">
              ✏️ Editar
            </a>
          ` : ""}
        </div>

      </div>
    </div>
  `;
}

/* ============================================================
   AVISO PARA NÃO-MEMBROS
============================================================ */
function renderNonMemberNotice(group: GroupDetail) {
  // limpa containers que não devem ser exibidos
  document.getElementById("members-container")!.innerHTML = "";
  document.getElementById("games-container")!.innerHTML = "";

  const notice = document.createElement("div");

  // bloco grande, centralizado e com espaço do card
  notice.className = "text-center mt-4 mb-2";

  if (group.already_requested) {
    notice.innerHTML = `
      <p class="mb-2 fs-5"><strong>Solicitação enviada.</strong></p>
      <p class="text-gray fs-6">Aguardando aprovação dos administradores.</p>
    `;
  } else {
    notice.innerHTML = `
      <p class="mb-2 fs-5">Você não é membro deste grupo.</p>
      <p class="text-gray fs-6 mb-4">
        Solicite entrada para ver as partidas e os membros.
      </p>

      <button href="src/pages/group_list.html" id="join-btn" class="btn btn-warning btn-lg px-4 py-2">
        Pedir para entrar
      </button>
    `;
  }

  // insere abaixo do card, agora com distância maior
  document.getElementById("group-card")!.insertAdjacentElement("afterend", notice);

  attachJoinButton(group);
}



/* ============================================================
   BOTÃO PEDIR ENTRADA
============================================================ */
function attachJoinButton(group: GroupDetail) {
  const btn = document.getElementById("join-btn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    try {
      await apiPost(`/groups/${group.slug}/join_request/`, {});
      alert("Solicitação enviada!");
      location.reload();
    } catch (err) {
      console.log(err);
      alert("Erro ao enviar solicitação.");
    }
  });
}

/* ============================================================
   LISTA DE MEMBROS
============================================================ */
function renderMembers(group: GroupDetail) {
  const container = document.getElementById("members-container")!;

  container.innerHTML = `
    <div class="card bg-dark border-secondary text-light">
      <div class="card-body">
        <h3 class="h5 mb-3">Membros (${group.memberships.length})</h3>
        <ul class="list-group list-group-flush">
          ${group.memberships
            .map(
              (m) => `
            <li class="list-group-item d-flex justify-content-between text-light">
              <span>${m.user.username}</span>
              <span class="badge bg-${m.role === "ADMIN" ? "warning" : "secondary"}">
                ${m.role.toLowerCase()}
              </span>
            </li>
          `
            )
            .join("")}
        </ul>
      </div>
    </div>
  `;
}

/* ============================================================
   SOLICITAÇÕES DE ENTRADA (SOMENTE ADMIN/CRIADOR)
============================================================ */
function renderJoinRequests(group: GroupDetail) {
  const requests = group.join_requests || [];
  const container = document.getElementById("members-container")!;

  const wrapper = document.createElement("div");
  wrapper.className = "mt-4";

  wrapper.innerHTML = `
    <h3 class="h6 text-warning mb-2">Solicitações Pendentes</h3>

    ${
      requests.length === 0
        ? `<p class="text-gray small">Nenhum pedido pendente.</p>`
        : `
        <ul class="list-group">
          ${requests
            .map(
              (r) => `
            <li class="list-group-item d-flex justify-content-between align-items-center bg-dark text-light">
              <div>
                <strong>${r.requested_by.username}</strong>
                <div class="text-gray small">
                  ${new Date(r.created_at).toLocaleDateString("pt-BR")}
                </div>
              </div>

              <div class="d-flex gap-2">
                <button class="btn btn-success btn-sm" data-approve="${r.id}">
                  ✔ Aprovar
                </button>
                <button class="btn btn-danger btn-sm" data-reject="${r.id}">
                  ✖ Rejeitar
                </button>
              </div>
            </li>
          `
            )
            .join("")}
        </ul>
      `
    }
  `;

  container.insertAdjacentElement("afterend", wrapper);

  attachRequestActions(group.slug);
}

function attachRequestActions(groupSlug: string) {
  document.querySelectorAll("[data-approve]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-approve");
      try {
        await apiPost(`/grouprequests/${id}/accept/`, {});
        alert("Usuário aprovado!");
        location.reload();
      } catch (err) {
        console.error(err);
        alert("Erro ao aprovar solicitação.");
      }
    });
  });

  document.querySelectorAll("[data-reject]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-reject");
      try {
        await fetch(`http://localhost:8000/api/grouprequests/${id}/`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
        });
        alert("Solicitação rejeitada.");
        location.reload();
      } catch (err) {
        console.error(err);
        alert("Erro ao rejeitar.");
      }
    });
  });
}

/* ============================================================
   LISTA DE PARTIDAS
============================================================ */
function renderGames(group: GroupDetail) {
  const container = document.getElementById("games-container")!;

  if (!group.recent_games.length) {
    container.innerHTML = `
      <div class="card bg-dark border-secondary text-light">
        <div class="card-body text-center py-4">
          <p class="mb-3">Nenhuma partida registrada.</p>
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

function renderGameItem(g: Game) {
  const d = new Date(g.date);
  const formatted = `${d.getDate()} ${d.toLocaleString("pt-BR", {
    month: "short",
  })} ${d.getFullYear()}`;
  const location = g.location ? `, em ${g.location}` : "";

  const qty = g.participations_count ?? 0;
  const label = qty === 1 ? "jogador" : "jogadores";

  return `
    <li class="list-group-item d-flex justify-content-between align-items-center text-light game-item"
        data-game-id="${g.id}" style="cursor:pointer">
      <div>
        <strong>${g.title}</strong>
        <div class="small text-gray">${formatted}${location}</div>
      </div>

      <div class="d-flex gap-3 align-items-center">
        <span class="chip chip-gold">💰 R$ ${g.buy_in}</span>
        <span class="badge bg-secondary">👥 ${qty} ${label}</span>
      </div>
    </li>
  `;
}

function attachGameClickEvents() {
  document.querySelectorAll(".game-item").forEach((item) => {
    item.addEventListener("click", () => {
      const id = item.getAttribute("data-game-id");
      if (id) location.href = `/src/pages/game_detail.html?id=${id}`;
    });
  });
}

/* ============================================================
   START
============================================================ */
loadGroupDetail();
