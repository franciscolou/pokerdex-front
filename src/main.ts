import { apiGet } from "./api.ts";
import { loadLayout } from "./scripts/layout.ts";
import { checkAuth } from "./api";

interface Group {
  id: number;
  name: string;
  slug: string;
  description?: string;
  created_by: string;
  member_count: number;
  post_count: number;
  last_post?: string;
}

function renderGroups(groups: Group[], container: HTMLElement, title: string) {
  if (groups.length === 0) {
    container.innerHTML = `
      <div class="text-center py-5">
        <h3 class="h5 mb-2">Ops! Nenhum grupo encontrado.</h3>
        <p class="text-gray mb-3">Crie ou participe de um grupo para começar.</p>
        <a href="/src/pages/group_create.html" class="btn btn-create-group">
          <i class="bi bi-people-fill"></i> Criar novo grupo
        </a>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <h2 class="h5 mb-3">${title}</h2>
    <div class="row g-3">
      ${groups
        .map(
          (g) => `
        <div class="col-md-4 col-sm-6">
          <a href="/src/pages/group_detail.html?slug=${g.slug}"
             class="card card-hover bg-dark border-secondary text-light h-100 card-link position-relative">
            <div class="card-body d-flex flex-column">
              <h5 class="card-title mb-1 text-warning">${g.name}</h5>
              <p class="card-subtitle mb-2 small text-gray">
                criado por ${g.created_by}
                <span class="meta-dot"></span>
                ${g.member_count} membro${g.member_count !== 1 ? "s" : ""}
              </p>
              ${
                g.description
                  ? `<p class="card-text text-truncate-2 mb-3">${g.description}</p>`
                  : ""
              }
              <span class="chip chip-neutral align-self-start">
                <i class="bi bi-suit-spa"></i> ${g.post_count} jogo${
            g.post_count !== 1 ? "s" : ""
          }
              </span>
            </div>
            <div class="last-post">
              ${
                g.last_post
                  ? `<i>Última partida em: ${new Date(g.last_post).toLocaleDateString("pt-BR")}</i>`
                  : `<i>Sem jogos ainda</i>`
              }
            </div>
          </a>
        </div>
      `
        )
        .join("")}
    </div>
  `;
}

async function main() {

  const isAuthenticated = await checkAuth();
  if (!isAuthenticated) {
    window.location.href = "/src/pages/login.html";
    return;
  }
  await loadLayout();

  const app = document.getElementById("app");
  if (!app) return;

  app.innerHTML = `<p class="text-gray">Carregando grupos...</p>`;

  try {
    const { myGroups, otherGroups } = await apiGet("/groups");

    app.innerHTML = `
      <section class="my-groups-section mb-5">
        <div id="my-groups"></div>
      </section>
      <section>
        <div id="other-groups"></div>
      </section>
    `;

    renderGroups(myGroups, document.getElementById("my-groups")!, "Meus Grupos");
    renderGroups(otherGroups, document.getElementById("other-groups")!, "Outros Grupos");
  } catch (err) {
    app.innerHTML = `
      <div class="alert alert-danger">
        Erro ao carregar grupos: ${(err as Error).message}
      </div>
    `;
  }
}

main();
