import { apiGet } from "../api";

interface Group {
  id: number;
  slug: string;
  name: string;
  description?: string;
  created_by: { username: string};
  member_count: number;
  post_count: number;
  last_post?: string | null;
}

async function renderGroups() {
  const headerActions = document.getElementById("header-actions")!;
  const myGroupsContainer = document.getElementById("my-groups-container")!;
  const otherGroupsContainer = document.getElementById("other-groups-container")!;
  const myGroupsCount = document.getElementById("my-groups-count")!;
  const otherGroupsCount = document.getElementById("other-groups-count")!;

  let pendingSection = document.getElementById("pending-groups-section");
  if (!pendingSection) {
    const wrapper = document.createElement("section");
    wrapper.id = "pending-groups-section";
    wrapper.className = "pending-section mb-4";
    wrapper.innerHTML = `
      <div class="d-flex align-items-center justify-content-between mb-2">
        <div class="d-flex align-items-center gap-2">
          <h2 class="h5 m-0">Aguardando aprovação</h2>
          <span id="pending-groups-count" class="badge bg-secondary">0</span>
        </div>
      </div>
      <div class="gradient-bar mb-3"></div>
      <div id="pending-groups-container" class="row g-3"></div>
    `;

    const myGroupsSection = document.querySelector(".my-groups-section")!;
    const otherGroupsSection = document.querySelector("section.mb-2")!;
    myGroupsSection.insertAdjacentElement("afterend", wrapper);

    pendingSection = wrapper;
  }

  const pendingGroupsContainer = document.getElementById("pending-groups-container")!;
  const pendingGroupsCount = document.getElementById("pending-groups-count")!;

  headerActions.innerHTML = `
    <a href="/src/pages/game_manage.html" class="btn btn-create-game">
      <i class="bi bi-cash-stack"></i> Nova noite
    </a>
    <a href="/src/pages/group_manage.html" class="btn btn-create-group">
      <i class="bi bi-people-fill"></i> Novo grupo
    </a>
  `;

  try {
    const data = await apiGet("/groups/");

    const myGroups: Group[] = data.myGroups || [];
    const otherGroups: Group[] = data.otherGroups || [];
    const pendingGroups: Group[] = data.requestedGroups || [];

    myGroupsCount.textContent = String(myGroups.length);
    otherGroupsCount.textContent = String(otherGroups.length);
    pendingGroupsCount.textContent = String(pendingGroups.length);

    myGroupsContainer.innerHTML =
      myGroups.length > 0
        ? myGroups.map(renderGroupCard).join("")
        : `
          <div class="text-center py-5 border-secondary">
            <h3 class="h5 mb-2">Ops! Nenhum grupo encontrado.</h3>
            <p class="text-gray mb-3">Crie ou entre em um grupo para começar.</p>
            <a href="/src/pages/group_manage.html" class="btn btn-create-group">
              <i class="bi bi-people-fill"></i> Criar novo grupo
            </a>
          </div>
      `;

    if (pendingGroups.length > 0) {
      pendingSection!.style.display = "block";
      pendingGroupsContainer.innerHTML = pendingGroups.map(renderGroupCard).join("");
    } else {
      pendingSection!.style.display = "none";
    }

    otherGroupsContainer.innerHTML =
      otherGroups.length > 0
        ? otherGroups.map(renderGroupCard).join("")
        : `<div class="text-center py-4 text-gray">Nenhum outro grupo encontrado.</div>`;
  } catch (err) {
    myGroupsContainer.innerHTML = `
      <div class="alert alert-danger">
        Erro ao carregar grupos: ${(err as Error).message}
      </div>`;
  }
}


function renderGroupCard(g: Group): string {
  const date = g.last_post
    ? new Date(g.last_post).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    : null;
  console.log(g);
  return `
    <div class="col-md-4 col-sm-6">
      <a href="/src/pages/group_detail.html?slug=${g.slug}"
         class="card card-hover bg-dark border-secondary text-light h-100 card-link position-relative">
        <div class="card-body d-flex flex-column">

          <h5 class="card-title mb-1 text-warning">${g.name}</h5>

          <p class="card-subtitle mb-2 small text-gray">
            criado por ${g.created_by.username}
            <span class="meta-dot"></span>
            ${g.member_count} membro${g.member_count !== 1 ? "s" : ""}
          </p>

          ${g.description ? `<p class="card-text text-truncate-2 mb-3">${g.description}</p>` : ""}

          <span class="chip chip-neutral align-self-start">
            <i class="bi bi-suit-spa"></i> ${g.post_count} jogo${g.post_count !== 1 ? "s" : ""}
          </span>
        </div>

        <div class="last-post">
          <i>${date ? `Última partida em: ${date}` : "Sem jogos ainda"}</i>
        </div>
      </a>
    </div>
  `;
}

renderGroups();
