const recordForm = document.getElementById("recordForm");
const recordList = document.getElementById("recordList");
const messageDiv = document.getElementById("message");
const filterDirector = document.getElementById("filterDirector");
const submitBtn = document.getElementById("submitBtn");
const cancelBtn = document.getElementById("cancelBtn");
const loadingDiv = document.getElementById("loading");
const paginationDiv = document.getElementById("pagination");
const showAllMessage = document.getElementById("showAllMessage");

const PAGE_SIZE = 20;
let currentPage = 1;
let displayedRecords = [];
let recordsCache = [];
let editMode = false;
let editId = null;

// ── Directores ──────────────────────────────────────────────────────────────
const populateDirectors = (records) => {
  filterDirector.innerHTML = "";
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Todos los directores";
  filterDirector.appendChild(defaultOption);

  const directors = [...new Set(records.map((r) => r.directed_by))].sort();
  directors.forEach((director) => {
    const option = document.createElement("option");
    option.value = director;
    option.textContent = director;
    filterDirector.appendChild(option);
  });
};

// ── Carga inicial ────────────────────────────────────────────────────────────
const fetchData = async () => {
  loadingDiv.style.display = "block";
  recordList.innerHTML = "";
  try {
    const response = await fetch("/api/data");
    if (!response.ok) throw new Error("No se pudo conectar con el servidor.");
    recordsCache = await response.json();
    populateDirectors(recordsCache);
  } catch (error) {
    showMessage(error.message, "error");
  } finally {
    loadingDiv.style.display = "none";
  }
};

// ── Paginación ───────────────────────────────────────────────────────────────
const renderPage = (records, page) => {
  currentPage = page;
  displayedRecords = records;
  const start = (page - 1) * PAGE_SIZE;
  const pageRecords = records.slice(start, start + PAGE_SIZE);
  displayRecords(pageRecords);
  renderPagination(records.length, page);
};

const renderPagination = (total, page) => {
  paginationDiv.innerHTML = "";
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return;

  const info = document.createElement("span");
  info.className = "page-info";
  info.textContent = `Página ${page} de ${totalPages} (${total} registros)`;
  paginationDiv.appendChild(info);

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "← Anterior";
  prevBtn.disabled = page === 1;
  prevBtn.onclick = () => renderPage(displayedRecords, page - 1);
  paginationDiv.appendChild(prevBtn);

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Siguiente →";
  nextBtn.disabled = page === totalPages;
  nextBtn.onclick = () => renderPage(displayedRecords, page + 1);
  paginationDiv.appendChild(nextBtn);
};

// ── Visualización de registros ───────────────────────────────────────────────
const displayRecords = (data) => {
  recordList.innerHTML = "";
  if (data.length === 0) {
    const li = document.createElement("li");
    li.className = "no-records";
    li.textContent = "No hay registros para mostrar.";
    recordList.appendChild(li);
    return;
  }
  data.forEach((record) => {
    const li = document.createElement("li");

    const imdb = record.imdb_rating ? `IMDB: ${record.imdb_rating}` : "IMDB: —";
    const tmdb = record.tmdb_rating ? `TMDB: ${record.tmdb_rating}` : "TMDB: —";
    const viewers = record.us_viewers_in_millions ? `${record.us_viewers_in_millions}M espect.` : "";
    const desc = record.description && record.description.length > 120
      ? record.description.slice(0, 120) + "…"
      : record.description || "";

    const info = document.createElement("div");
    info.className = "record-info";
    info.innerHTML = `
      <strong>${record.title}</strong>
      <span class="record-meta">Temp. ${record.season} · Ep. ${record.number_in_season} · ${record.original_air_date}</span>
      <span class="record-credits">Dir.: ${record.directed_by} · Guión: ${record.written_by}</span>
      <span class="record-ratings">${imdb} &nbsp;|&nbsp; ${tmdb}${viewers ? ` &nbsp;|&nbsp; ${viewers}` : ""}</span>
      <span class="record-desc">${desc}</span>
    `;
    li.appendChild(info);

    const actions = document.createElement("div");
    actions.className = "record-actions";

    const editButton = document.createElement("button");
    editButton.textContent = "Editar";
    editButton.className = "btn-edit";
    editButton.onclick = () => startEdit(record);
    actions.appendChild(editButton);

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Eliminar";
    deleteButton.className = "btn-delete";
    deleteButton.onclick = () => deleteRecord(record.id, li);
    actions.appendChild(deleteButton);

    li.appendChild(actions);
    recordList.appendChild(li);
  });
};

// ── Mensajes ─────────────────────────────────────────────────────────────────
const showMessage = (text, type = "success") => {
  messageDiv.textContent = text;
  messageDiv.className = type === "error" ? "msg-error" : "msg-success";
  setTimeout(() => {
    messageDiv.textContent = "";
    messageDiv.className = "";
  }, 4000);
};

// ── Formulario: agregar / editar ─────────────────────────────────────────────
recordForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const imdbVal = parseFloat(document.getElementById("imdb_rating").value);
  const tmdbVal = parseFloat(document.getElementById("tmdb_rating").value);
  if (imdbVal && (imdbVal < 0 || imdbVal > 10)) {
    return showMessage("El rating IMDB debe estar entre 0 y 10.", "error");
  }
  if (tmdbVal && (tmdbVal < 0 || tmdbVal > 10)) {
    return showMessage("El rating TMDB debe estar entre 0 y 10.", "error");
  }

  const newRecord = {
    title: document.getElementById("title").value.trim(),
    description: document.getElementById("description").value.trim(),
    original_air_date: document.getElementById("original_air_date").value,
    directed_by: document.getElementById("directed_by").value.trim(),
    written_by: document.getElementById("written_by").value.trim(),
    season: parseInt(document.getElementById("season").value),
    number_in_season: parseInt(document.getElementById("number_in_season").value),
    number_in_series: parseInt(document.getElementById("number_in_series").value),
    us_viewers_in_millions: parseFloat(document.getElementById("us_viewers_in_millions").value),
    imdb_rating: document.getElementById("imdb_rating").value,
    tmdb_rating: document.getElementById("tmdb_rating").value,
  };

  const action = editMode ? "modificar" : "agregar";
  if (!confirm(`¿Estás seguro de que deseas ${action} este episodio?`)) return;

  try {
    const url = editMode ? `/api/data/${editId}` : "/api/data";
    const method = editMode ? "PUT" : "POST";
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRecord),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Error al guardar el registro.");
    }

    const result = await response.json();
    showMessage(result.message);
    cancelEdit();
    await fetchData();
    renderPage(recordsCache, 1);
    showAllMessage.style.display = "block";
  } catch (error) {
    showMessage(error.message, "error");
  }
});

// ── Edición ──────────────────────────────────────────────────────────────────
const startEdit = (record) => {
  editMode = true;
  editId = record.id;

  document.getElementById("title").value = record.title;
  document.getElementById("description").value = record.description;
  document.getElementById("original_air_date").value = record.original_air_date;
  document.getElementById("directed_by").value = record.directed_by;
  document.getElementById("written_by").value = record.written_by;
  document.getElementById("season").value = record.season;
  document.getElementById("number_in_season").value = record.number_in_season;
  document.getElementById("number_in_series").value = record.number_in_series;
  document.getElementById("us_viewers_in_millions").value = record.us_viewers_in_millions;
  document.getElementById("imdb_rating").value = record.imdb_rating;
  document.getElementById("tmdb_rating").value = record.tmdb_rating;

  submitBtn.textContent = "Guardar Cambios";
  submitBtn.classList.add("btn-edit-mode");
  cancelBtn.style.display = "inline-block";

  recordForm.scrollIntoView({ behavior: "smooth" });
};

const cancelEdit = () => {
  editMode = false;
  editId = null;
  recordForm.reset();
  submitBtn.textContent = "Agregar Episodio";
  submitBtn.classList.remove("btn-edit-mode");
  cancelBtn.style.display = "none";
};

cancelBtn.addEventListener("click", cancelEdit);

// ── Eliminación ──────────────────────────────────────────────────────────────
const deleteRecord = async (id, listItem) => {
  if (!confirm("¿Estás seguro de que deseas eliminar este episodio?")) return;

  try {
    const response = await fetch(`/api/data/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Error al eliminar el registro.");
    listItem.remove();
    recordsCache = recordsCache.filter((r) => r.id !== id);
    showMessage("Episodio eliminado correctamente.");
  } catch (error) {
    showMessage(error.message, "error");
  }
};

// ── Búsqueda ─────────────────────────────────────────────────────────────────
const searchRecords = async () => {
  const title = document.getElementById("filterTitle").value.trim();
  const season = document.getElementById("filterSeason").value.trim();
  const imdb_rating = document.getElementById("filterImdb").value.trim();
  const tmdb_rating = document.getElementById("filterTmdb").value.trim();
  const directed_by = filterDirector.value;

  const params = new URLSearchParams();
  if (title) params.set("title", title);
  if (season) params.set("season", season);
  if (imdb_rating) params.set("imdb_rating", imdb_rating);
  if (tmdb_rating) params.set("tmdb_rating", tmdb_rating);
  if (directed_by) params.set("directed_by", directed_by);

  loadingDiv.style.display = "block";
  try {
    const response = await fetch(`/api/data/search?${params.toString()}`);
    if (!response.ok) throw new Error("Error al buscar.");
    const results = await response.json();
    showAllMessage.textContent = `${results.length} resultado(s) encontrado(s).`;
    showAllMessage.style.display = "block";
    renderPage(results, 1);
  } catch (error) {
    showMessage(error.message, "error");
  } finally {
    loadingDiv.style.display = "none";
  }
};

document.getElementById("searchButton").addEventListener("click", searchRecords);

document.getElementById("showAllButton").addEventListener("click", () => {
  showAllMessage.textContent = `Mostrando todos los registros (${recordsCache.length}).`;
  showAllMessage.style.display = "block";
  renderPage(recordsCache, 1);
});

// ── Inicio ────────────────────────────────────────────────────────────────────
(async () => {
  await fetchData();
  renderPage(recordsCache, 1);
  showAllMessage.textContent = `Mostrando todos los registros (${recordsCache.length}).`;
  showAllMessage.style.display = "block";
})();
