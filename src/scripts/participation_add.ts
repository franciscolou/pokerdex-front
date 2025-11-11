import { apiGet, apiPost } from "../api";

interface Game {
  id: number;
  name: string;
}

interface Player {
  id: number;
  username: string;
}

function getParam(key: string): string | null {
  return new URLSearchParams(window.location.search).get(key);
}

async function renderParticipationForm() {
  const gameId = getParam("game");
  const form = document.getElementById("participation-form") as HTMLFormElement;
  const gameLabel = document.getElementById("game-label")!;
  const errorContainer = document.getElementById("error-container")!;

  if (!gameId) {
    gameLabel.innerHTML = `<span class="text-danger">Erro: ID da partida não informado.</span>`;
    return;
  }

  try {
    const game: Game = await apiGet(`/games/${gameId}/`);
    const players: Player[] = await apiGet(`/players/`); // endpoint que lista usuários disponíveis

    gameLabel.innerHTML = `Partida: <strong>${game.name}</strong>`;

    form.innerHTML = `
      <div>
        <label for="player" class="form-label">Jogador</label>
        <select id="player" name="player" class="form-control" required>
          <option value="">Selecione o jogador</option>
          ${players.map((p) => `<option value="${p.id}">${p.username}</option>`).join("")}
        </select>
      </div>

      <div>
        <label for="rebuy" class="form-label">Rebuy</label>
        <input
          type="number"
          step="0.01"
          min="0"
          id="rebuy"
          name="rebuy"
          placeholder="Ex: 0.00"
          class="form-control"
        />
        <div class="form-text text-muted">Valor adicional pago (se aplicável)</div>
      </div>

      <div>
        <label for="final_balance" class="form-label">Saldo final</label>
        <input
          type="number"
          step="0.01"
          id="final_balance"
          name="final_balance"
          placeholder="Ex: 120.00"
          class="form-control"
          required
        />
      </div>

      <div class="d-flex justify-content-end gap-2 mt-2">
        <a href="/src/pages/game_detail.html?id=${game.id}" class="btn btn-sm btn-outline-light">Cancelar</a>
        <button type="submit" class="btn btn-sm btn-warning">Salvar</button>
      </div>
    `;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorContainer.innerHTML = "";

      const data = {
        player_id: Number((document.getElementById("player") as HTMLSelectElement).value),
        rebuy: Number((document.getElementById("rebuy") as HTMLInputElement).value || 0),
        final_balance: Number(
          (document.getElementById("final_balance") as HTMLInputElement).value
        ),
      };

      if (!data.player_id || isNaN(data.final_balance)) {
        errorContainer.innerHTML = `<div class="alert alert-danger py-2 mb-3">Preencha todos os campos obrigatórios.</div>`;
        return;
      }

      try {
        await apiPost(`/games/${gameId}/participations/`, data);
        alert("Participação adicionada com sucesso!");
        window.location.href = `/src/pages/game_detail.html?id=${gameId}`;
      } catch (err) {
        console.error(err);
        errorContainer.innerHTML = `<div class="alert alert-danger py-2 mb-3">
          Ocorreu um erro ao adicionar a participação.
        </div>`;
      }
    });
  } catch (err) {
    console.error(err);
    gameLabel.innerHTML = `<span class="text-danger">Erro ao carregar dados da partida.</span>`;
  }
}

renderParticipationForm();
