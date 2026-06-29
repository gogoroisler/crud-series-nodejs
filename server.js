import 'dotenv/config'
import express from 'express'
import fs from 'fs'
import csv from 'csv-parser'
import morgan from 'morgan'
import { fileURLToPath } from 'url'

const FIELDS = [
  'id', 'title', 'description', 'original_air_date', 'directed_by',
  'written_by', 'season', 'number_in_season', 'number_in_series',
  'us_viewers_in_millions', 'imdb_rating', 'tmdb_rating',
]

// ── Funciones puras (exportadas para testing) ────────────────────────────────

export const filterRecords = (records, filters = {}) => {
  const { title, season, imdb_rating, tmdb_rating, directed_by } = filters
  return records.filter((data) => {
    const matchesTitle = title
      ? data.title.toLowerCase().includes(title.toLowerCase())
      : true
    const matchesSeason = season
      ? String(data.season).trim() === String(season).trim()
      : true
    const matchesImdb = imdb_rating
      ? parseFloat(data.imdb_rating) >= parseFloat(imdb_rating)
      : true
    const matchesTmdb = tmdb_rating
      ? parseFloat(data.tmdb_rating) >= parseFloat(tmdb_rating)
      : true
    const matchesDirector = directed_by
      ? data.directed_by === directed_by
      : true
    return matchesTitle && matchesSeason && matchesImdb && matchesTmdb && matchesDirector
  })
}

export const validateRecord = (record) => {
  const errors = []
  if (!record.title || String(record.title).trim() === '')
    errors.push('El título es requerido.')
  if (!record.season)
    errors.push('La temporada es requerida.')
  if (record.imdb_rating !== '' && record.imdb_rating != null) {
    const r = parseFloat(record.imdb_rating)
    if (!isNaN(r) && (r < 0 || r > 10))
      errors.push('El rating IMDB debe estar entre 0 y 10.')
  }
  if (record.tmdb_rating !== '' && record.tmdb_rating != null) {
    const r = parseFloat(record.tmdb_rating)
    if (!isNaN(r) && (r < 0 || r > 10))
      errors.push('El rating TMDB debe estar entre 0 y 10.')
  }
  return { valid: errors.length === 0, errors }
}

// ── Helpers de CSV ────────────────────────────────────────────────────────────

const readCSV = (csvFile) =>
  new Promise((resolve, reject) => {
    const results = []
    fs.createReadStream(csvFile)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject)
  })

const writeCSV = (records, csvFile) => {
  const header = FIELDS.join(',')
  const rows = records.map((r) =>
    FIELDS.map((f) => `"${String(r[f] ?? '').replace(/"/g, '""')}"`).join(',')
  )
  fs.writeFileSync(csvFile, [header, ...rows].join('\n'))
}

// ── Factory de la aplicación (permite inyectar el CSV en tests) ───────────────

export const createApp = (csvFile) => {
  const app = express()
  app.use(morgan('dev'))
  app.use(express.static('.'))
  app.use(express.json())

  app.get('/api/data', async (req, res) => {
    try {
      res.json(await readCSV(csvFile))
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Error al leer los datos.' })
    }
  })

  app.get('/api/data/search', async (req, res) => {
    try {
      const all = await readCSV(csvFile)
      res.json(filterRecords(all, req.query))
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Error al buscar registros.' })
    }
  })

  app.post('/api/data', async (req, res) => {
    const { valid, errors } = validateRecord(req.body)
    if (!valid) return res.status(400).json({ error: errors.join(' ') })
    try {
      const records = await readCSV(csvFile)
      const newRecord = { ...req.body, id: Date.now().toString() }
      records.push(newRecord)
      writeCSV(records, csvFile)
      res.status(201).json({ message: 'Registro agregado correctamente.', record: newRecord })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Error al agregar el registro.' })
    }
  })

  app.put('/api/data/:id', async (req, res) => {
    const { id } = req.params
    try {
      const records = await readCSV(csvFile)
      const index = records.findIndex((r) => r.id === id)
      if (index === -1) return res.status(404).json({ error: 'Registro no encontrado.' })
      records[index] = { ...req.body, id }
      writeCSV(records, csvFile)
      res.json({ message: 'Registro actualizado correctamente.', record: records[index] })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Error al actualizar el registro.' })
    }
  })

  app.delete('/api/data/:id', async (req, res) => {
    const { id } = req.params
    try {
      const records = await readCSV(csvFile)
      const filtered = records.filter((r) => r.id !== id)
      if (filtered.length === records.length)
        return res.status(404).json({ error: 'Registro no encontrado.' })
      writeCSV(filtered, csvFile)
      res.status(204).end()
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Error al eliminar el registro.' })
    }
  })

  return app
}

// ── Inicio del servidor (solo cuando se ejecuta directamente) ─────────────────

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const PORT = parseInt(process.env.PORT) || 3000
  const CSV_FILE = process.env.CSV_FILE || 'data.csv'
  const app = createApp(CSV_FILE)
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`)
  })
}
