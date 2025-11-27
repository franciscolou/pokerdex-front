import { apiDelete, apiGet, apiPost } from "../api";

interface Membership {
  user: { id: number, username: string };
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
  already_requested: boolean;
  join_requests: JoinRequest[];
}

interface JoinRequest {
  id: number;
  requested_by: { username: string };
  created_at: string;
}

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

  if (!group.is_member) {
    renderNonMemberNotice(group);
    return;
  }

  renderMembers(group);

  if (group.is_admin || group.is_creator) {
    renderJoinRequests(group);
    attachRequestActions(group.slug);
  }

  renderGames(group);

}


function renderHeader(group: GroupDetail) {
  const backLink = `
    <a href="/src/pages/group_list.html" class="btn btn-outline-light btn-sm">
      <i class="bi bi-chevron-left"></i> Voltar
    </a>
  `;

  const leaveBtn = group.is_member
    ? `
      <button id="leave-btn" class="btn btn-outline-danger btn-sm">
        Sair do grupo
      </button>
    `
    : "";

  document.getElementById("back-link-area")!.innerHTML = `
    <div class="d-flex justify-content-between align-items-center w-100">
      <div>${backLink}</div>
      <div>${leaveBtn}</div>
    </div>
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

          ${
            group.is_creator
              ? `
              <a href="/src/pages/group_manage.html?slug=${group.slug}"
                class="btn btn-warning btn-sm">
                <i class="bi bi-pencil-square"></i>
              </a>
            `
              : ""
          }
        </div>
      </div>
    </div>
  `;

  attachLeaveButton(group);
}

function attachLeaveButton(group: GroupDetail) {
  const btn = document.getElementById("leave-btn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    if (!confirm("Tem certeza que deseja sair do grupo?")) return;

    try {
      await apiPost(`/groups/${group.slug}/leave/`, {});
      location.href = "/src/pages/group_list.html";
    } catch (err) {
      console.error(err);
      alert("Erro ao sair do grupo.");
    }
  });
}


function renderNonMemberNotice(group: GroupDetail) {
  document.getElementById("members-container")!.innerHTML = "";
  document.getElementById("games-container")!.innerHTML = "";

  const notice = document.createElement("div");

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

  document.getElementById("group-card")!.insertAdjacentElement("afterend", notice);

  attachJoinButton(group);
}


function attachJoinButton(group: GroupDetail) {
  const btn = document.getElementById("join-btn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    try {
      await apiPost(`/groups/${group.slug}/join_request/`, {});
      location.reload();
    } catch (err) {
      alert("Erro ao enviar solicitação.");
    }
  });
}

function renderMembers(group: GroupDetail) {
  const container = document.getElementById("members-container")!;

  container.innerHTML = `
    <div class="card bg-dark border-secondary text-light">
      <div class="card-body">
        <div class="d-flex text-light justify-content-between align-items-center mb-3">
          <h3 class="h5 mb-0">Membros (${group.memberships.length})</h3>

          <button 
            id="invite-btn" 
            class="btn btn-glass btn-glass-blue text-light btn-sm"
            style="display:flex; align-items:center; gap:.35rem;"
          >
           <i class="bi bi-link-45deg"></i> Convite
         </button>
        </div>
        
        
        <ul class="list-group list-group-flush">
          ${group.memberships
            .map((m) => {
              let badge = "";

              if (m.user.username === group.created_by.username) {
                badge = "<i class='bi bi-award text-warning' title='Criador'></i>";
              } else if (m.role === "ADMIN") {
                badge = "<i class='bi bi-shield-shaded text-info' title='Administrador'></i>";
              } else {
                badge = "<i class='bi bi-person text-secondary' title='Membro'></i>";
              }

              return `
                <li class="list-group-item d-flex justify-content-between align-items-center text-light">
                  <div>
                    <span>${m.user.username}</span>
                    ${badge}
                  </div>

                  ${
                    m.user.username === group.created_by.username
                      ? "" 
                      : (
                          group.is_creator
                            ? `
                              <div class="d-flex gap-2">
                                ${
                                  m.role === "ADMIN"
                                    ? `<button class="btn btn-sm btn-outline-warning" data-demote="${m.user.username}"><i class="bi bi-person-fill-down"></i></button>`
                                    : `<button class="btn btn-sm btn-outline-success" data-promote="${m.user.username}"><i class="bi bi-person-fill-up"></i></button>`
                                }
                                <button class="btn btn-sm btn-outline-danger" data-remove="${m.user.username}"><i class="bi bi-person-x-fill"></i></button>
                              </div>
                            `
                            : group.is_admin && m.role === "MEMBER"
                              ? `<div><button class="btn btn-sm btn-outline-danger" data-remove="${m.user.username}"><i class="bi bi-person-x-fill"></i></button></div>`
                              : ""
                        )
                  }
                </li>
              `;
            })
            .join("")}
        </ul>
      </div>
    </div>
  `;

  attachMemberActions(group.slug, group);
  attachInviteButton(group);
}


function attachMemberActions(groupSlug: string, group: GroupDetail) {
  // PROMOTE
  document.querySelectorAll("[data-promote]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const username = btn.getAttribute("data-promote");
      const member = findMemberIdByUsername(username!, group);
      if (!member) return;

      try {
        await apiPost(`/groups/${groupSlug}/promote/${member}/`, {});
        location.reload();
      } catch (err) {
        console.error(err);
        alert("Erro ao promover usuário.");
      }
    });
  });

  // DEMOTE
  document.querySelectorAll("[data-demote]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const username = btn.getAttribute("data-demote");
      const member = findMemberIdByUsername(username!, group);
      if (!member) return;

      try {
        await apiPost(`/groups/${groupSlug}/demote/${member}/`, {});
        location.reload();
      } catch (err) {
        console.error(err);
        alert("Erro ao rebaixar usuário.");
      }
    });
  });

  // REMOVE
  document.querySelectorAll("[data-remove]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const username = btn.getAttribute("data-remove");
      const member = findMemberIdByUsername(username!, group);
      if (!member) return;

      if (!confirm(`Tem certeza que deseja remover ${username} do grupo?`)) return;

      try {
        await apiPost(`/groups/${groupSlug}/remove/${member}/`, {});
        alert(`Usuário removido!`);
        location.reload();
      } catch (err) {
        console.error(err);
        alert("Erro ao remover usuário.");
      }
    });
  });
}

function findMemberIdByUsername(username: string, group: GroupDetail): number | null {
  const member = group.memberships.find((m) => m.user.username === username);
  return member ? member.user.id : null;
}


function renderJoinRequests(group: GroupDetail) {
  const requests = group.join_requests || [];
  const container = document.getElementById("requests-container")!;
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
                  <i class="bi bi-check-lg"></i>
                </button>
                <button class="btn btn-danger btn-sm" data-reject="${r.id}">
                  <i class="bi bi-x-lg"></i>
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
  container.innerHTML = "";
  container.appendChild(wrapper);
}



function attachRequestActions(groupSlug: string) {
  document.querySelectorAll("[data-approve]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-approve");
      try {
        await apiPost(`/group-requests/${id}/accept/`, {});
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
        await apiDelete(`/group-requests/${id}/`);
        location.reload();
      } catch (err) {
        console.error(err);
        alert("Erro ao rejeitar.");
      }
    });
  });
}


function renderGames(group: GroupDetail) {
  const container = document.getElementById("games-container")!;

  if (!group.recent_games.length) {
    container.innerHTML = `
      <div class="bg-dark border-secondary text-light">
        <div class="card-body text-center py-4">
          <p class="mb-3">Nenhuma partida registrada.</p>
          <a href="/src/pages/game_manage.html" class="btn btn-create-game me-2">
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

function attachInviteButton(group: GroupDetail) {
  const btn = document.getElementById("invite-btn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const link = `${location.origin}/src/pages/group_invite.html?slug=${group.slug}`;
    navigator.clipboard.writeText(link);

    const originalHTML = btn.innerHTML;

    btn.innerHTML = `<i class="bi bi-check-lg"></i> Copiado!`;

    btn.style.transform = "scale(1.05)";
    btn.style.boxShadow = "0 0 0 .25rem rgba(0,140,255,.25)";

    setTimeout(() => {
      btn.innerHTML = originalHTML;
      btn.style.transform = "scale(1)";
      btn.style.boxShadow = "none";
    }, 2200);
  });
}


loadGroupDetail();
