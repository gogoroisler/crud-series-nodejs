const express = require("express");
const fs = require("fs");
const csv = require("csv-parser");
const { Parser } = require("json2csv");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;
const CSV_FILE = "data.csv";
const FIELDS = [
  "id", "title", "description", "original_air_date", "directed_by",
  "written_by", "season", "number_in_season", "number_in_series",
  "us_viewers_in_millions", "imdb_rating", "tmdb_rating",
];

app.use(express.static("."));
app.use(bodyParser.json());

const readCSV = () =>
  new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(CSV_FILE)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", reject);
  });

const writeCSV = (records) => {
  if (records.length === 0) {
    fs.writeFileSync(CSV_FILE, FIELDS.map((f) => `"${f}"`).join(",") + "\n");
    return;
  }
  const parser = new Parser({ fields: FIELDS });
  fs.writeFileSync(CSV_FILE, parser.parse(records));
};

// GET todos los registros
app.get("/api/data", async (req, res) => {
  try {
    const results = await readCSV();
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al leer los datos." });
  }
});

// GET búsqueda con filtros (server-side)
app.get("/api/data/search", async (req, res) => {
  const { title, season, imdb_rating, tmdb_rating, directed_by } = req.query;
  try {
    const all = await readCSV();
    const results = all.filter((data) => {
      const matchesTitle = title
        ? data.title.toLowerCase().includes(title.toLowerCase())
        : true;
      const matchesSeason = season
        ? String(data.season).trim() === String(season).trim()
        : true;
      const matchesImdb = imdb_rating
        ? parseFloat(data.imdb_rating) >= parseFloat(imdb_rating)
        : true;
      const matchesTmdb = tmdb_rating
        ? parseFloat(data.tmdb_rating) >= parseFloat(tmdb_rating)
        : true;
      const matchesDirector = directed_by
        ? data.directed_by === directed_by
        : true;
      return matchesTitle && matchesSeason && matchesImdb && matchesTmdb && matchesDirector;
    });
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al buscar registros." });
  }
});

// POST agregar registro
app.post("/api/data", async (req, res) => {
  const { title, season, number_in_season, number_in_series, imdb_rating, tmdb_rating } = req.body;
  if (!title || !season) {
    return res.status(400).json({ error: "Título y temporada son requeridos." });
  }
  if (imdb_rating && (imdb_rating < 0 || imdb_rating > 10)) {
    return res.status(400).json({ error: "El rating IMDB debe estar entre 0 y 10." });
  }
  try {
    const records = await readCSV();
    const newRecord = { ...req.body, id: Date.now().toString() };
    records.push(newRecord);
    writeCSV(records);
    res.status(201).json({ message: "Registro agregado correctamente.", record: newRecord });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al agregar el registro." });
  }
});

// PUT modificar registro
app.put("/api/data/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const records = await readCSV();
    const index = records.findIndex((r) => r.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Registro no encontrado." });
    }
    records[index] = { ...req.body, id };
    writeCSV(records);
    res.json({ message: "Registro actualizado correctamente.", record: records[index] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar el registro." });
  }
});

// DELETE eliminar registro
app.delete("/api/data/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const records = await readCSV();
    const filtered = records.filter((r) => r.id !== id);
    if (filtered.length === records.length) {
      return res.status(404).json({ error: "Registro no encontrado." });
    }
    writeCSV(filtered);
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar el registro." });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
