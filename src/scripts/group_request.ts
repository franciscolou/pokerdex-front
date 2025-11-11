import { apiGet, apiPost } from "../api";

interface Group {
  id: number;
  slug: string;
  name: string;
  created_by: string;
  created_at: string;
  member_count: number;
  already_member: boolean;
  already_requested: boolean;
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  const d = date.toLocaleDateString("pt-BR");
  const t = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${d} às ${t}`;
}

function getQueryParam(key: string): string | null {
  return new URLSearchParams(window.location.search).get(key);
}

async function renderJoinRequest() {
  const slug = getQueryParam("slug");
  const container = document.getElementById("join-request-container")!;
  if (!slug) {
    container.innerHTML = `<p class="text-danger">Erro: grupo não informado.</p>`;
    return;
  }

  try {
    const group: Group = await apiGet(`/groups/${slug}/`);
    const createdAt = formatDateTime(group.created_at);

    container.innerHTML += `
      <h1 class="h3 fw-semibold text-warning mb-2">${group.name}</h1>
      <p class="small mb-1">
        Criado por <span class="text-reset fw-medium">${group.created_by}</span>
        <span class="meta-dot"></span>
        ${createdAt}
        <span class="meta-dot"></span>
        ${group.member_count} membro${group.member_count !== 1 ? "s" : ""}
      </p>
      <div class="soft-divider"></div>
    `;

    if (group.already_member) {
      container.innerHTML += `
        <div class="alert frost-alert text-light mb-3">
          ✅ Você já é membro deste grupo.
        </div>
        <a href="/src/pages/group_detail.html?slug=${group.slug}" class="btn btn-sm btn-warning glow-btn">
          Ir para o grupo
        </a>
      `;
    } else if (group.already_requested) {
      container.innerHTML += `
        <div class="alert frost-alert text-light mb-3">
          ⏳ Sua solicitação de entrada foi enviada aos administradores. Aguarde a aprovação.
        </div>
        <a href="/src/pages/group_list.html" class="btn btn-sm btn-outline-light">Voltar</a>
      `;
    } else {
      container.innerHTML += `
        <div class="alert frost-alert text-light mb-3">
          🔒 Para participar deste grupo, envie uma solicitação aos administradores.
          <div class="mt-3">
            <button id="request-btn" class="btn btn-lg btn-warning glow-btn">
              Solicitar entrada
            </button>
          </div>
        </div>
        <a href="/src/pages/group_list.html"
           class="link-light link-underline-opacity-0 link-underline-opacity-75-hover small">
           ← Voltar à lista de grupos
        </a>
      `;

      const btn = document.getElementById("request-btn")!;
      btn.addEventListener("click", async () => {
        try {
          await apiPost(`/groups/${slug}/join-request/`, {});
          alert("Solicitação enviada com sucesso!");
          window.location.href = `/src/pages/group_list.html`;
        } catch (err) {
          alert("Erro ao enviar solicitação. Tente novamente.");
          console.error(err);
        }
      });
    }
  } catch (err) {
    container.innerHTML = `<div class="text-danger">Erro ao carregar informações do grupo.</div>`;
    console.error(err);
  }
}

renderJoinRequest();
