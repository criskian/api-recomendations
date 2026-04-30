const API_BASE_URL = "http://127.0.0.1:8000";

const form = document.querySelector("#search-form");
const userInput = document.querySelector("#user-id");
const loadAllButton = document.querySelector("#load-all");
const statusBox = document.querySelector("#status");
const result = document.querySelector("#result");

function setStatus(message, type = "info") {
  statusBox.hidden = false;
  statusBox.textContent = message;
  statusBox.className = `status ${type === "error" ? "error" : ""}`;
}

function clearStatus() {
  statusBox.hidden = true;
  statusBox.textContent = "";
}

async function fetchJson(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const detail = payload && payload.detail ? payload.detail : "Respuesta inesperada de la API";
    throw new Error(detail);
  }

  return payload;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderUser(user) {
  const rows = user.recommendations
    .map((movie, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(movie.movie_title)}</td>
        <td>${movie.movie_id}</td>
        <td>${Number(movie.score).toFixed(3)}</td>
      </tr>
    `)
    .join("");

  result.innerHTML = `
    <div class="summary">
      <span class="pill">Usuario ${user.user_id}</span>
      <span class="pill">Cluster ${user.cluster}</span>
      <span class="pill">${user.recommendations.length} recomendaciones</span>
    </div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Película</th>
          <th>movie_id</th>
          <th>score</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderAll(users) {
  const rows = users
    .map((user) => `
      <tr>
        <td>${user.user_id}</td>
        <td>${user.cluster}</td>
        <td>${user.recommendations.length}</td>
      </tr>
    `)
    .join("");

  result.innerHTML = `
    <div class="summary">
      <span class="pill">${users.length} usuarios</span>
      <span class="pill">Vista compacta</span>
    </div>
    <table>
      <thead>
        <tr>
          <th>user_id</th>
          <th>cluster</th>
          <th>recomendaciones</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const userId = userInput.value.trim();
  if (!userId) {
    setStatus("Escribe un user_id para consultar.", "error");
    result.innerHTML = "";
    return;
  }

  setStatus("Consultando usuario...");
  result.innerHTML = "";

  try {
    const user = await fetchJson(`/recommendations/${encodeURIComponent(userId)}`);
    clearStatus();
    renderUser(user);
  } catch (error) {
    setStatus(error.message || "No fue posible consultar el usuario.", "error");
  }
});

loadAllButton.addEventListener("click", async () => {
  setStatus("Cargando todos los usuarios...");
  result.innerHTML = "";

  try {
    const users = await fetchJson("/recommendations");
    clearStatus();
    renderAll(users);
  } catch (error) {
    setStatus(error.message || "No fue posible consultar las recomendaciones.", "error");
  }
});
