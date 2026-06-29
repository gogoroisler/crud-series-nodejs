import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import { createApp } from '../../server.js'
import fs from 'fs'

const FIXTURE = 'tests/fixtures/test.csv'
const TEST_CSV = 'tests/fixtures/test_run.csv'
const app = createApp(TEST_CSV)

beforeEach(() => {
  fs.copyFileSync(FIXTURE, TEST_CSV)
})

afterAll(() => {
  if (fs.existsSync(TEST_CSV)) fs.unlinkSync(TEST_CSV)
})

// ── GET /api/data ─────────────────────────────────────────────────────────────

describe('GET /api/data', () => {
  it('devuelve todos los registros con status 200', async () => {
    const res = await request(app).get('/api/data')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body).toHaveLength(5)
  })

  it('cada registro tiene los campos requeridos', async () => {
    const res = await request(app).get('/api/data')
    const record = res.body[0]
    expect(record).toHaveProperty('id')
    expect(record).toHaveProperty('title')
    expect(record).toHaveProperty('season')
    expect(record).toHaveProperty('directed_by')
  })
})

// ── GET /api/data/search ──────────────────────────────────────────────────────

describe('GET /api/data/search', () => {
  it('filtra por título', async () => {
    const res = await request(app).get('/api/data/search?title=bart')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
    expect(res.body.every(r => r.title.toLowerCase().includes('bart'))).toBe(true)
  })

  it('filtra por temporada', async () => {
    const res = await request(app).get('/api/data/search?season=2')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
    expect(res.body.every(r => r.season === '2')).toBe(true)
  })

  it('filtra por director', async () => {
    const res = await request(app).get('/api/data/search?directed_by=Wes Archer')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].directed_by).toBe('Wes Archer')
  })

  it('devuelve array vacío si no hay coincidencias', async () => {
    const res = await request(app).get('/api/data/search?title=xfiles')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(0)
  })
})

// ── POST /api/data ────────────────────────────────────────────────────────────

describe('POST /api/data', () => {
  const newEpisode = {
    title: 'Treehouse of Horror',
    description: 'Three scary stories.',
    original_air_date: '1990-10-25',
    directed_by: 'Rich Moore',
    written_by: 'Al Jean',
    season: 2,
    number_in_season: 3,
    number_in_series: 16,
    us_viewers_in_millions: 24.6,
    imdb_rating: '8.4',
    tmdb_rating: '8.1',
  }

  it('agrega un registro y devuelve 201', async () => {
    const res = await request(app).post('/api/data').send(newEpisode)
    expect(res.status).toBe(201)
    expect(res.body.record.title).toBe('Treehouse of Horror')
    expect(res.body.record.id).toBeDefined()
  })

  it('el registro nuevo aparece en GET /api/data', async () => {
    await request(app).post('/api/data').send(newEpisode)
    const res = await request(app).get('/api/data')
    expect(res.body).toHaveLength(6)
  })

  it('rechaza registro sin título (400)', async () => {
    const res = await request(app).post('/api/data').send({ ...newEpisode, title: '' })
    expect(res.status).toBe(400)
    expect(res.body.error).toContain('título')
  })

  it('rechaza registro sin temporada (400)', async () => {
    const res = await request(app).post('/api/data').send({ ...newEpisode, season: '' })
    expect(res.status).toBe(400)
    expect(res.body.error).toContain('temporada')
  })
})

// ── PUT /api/data/:id ─────────────────────────────────────────────────────────

describe('PUT /api/data/:id', () => {
  it('actualiza un registro existente', async () => {
    const updated = { title: 'Bart the Genius (Editado)', season: '1' }
    const res = await request(app).put('/api/data/1').send(updated)
    expect(res.status).toBe(200)
    expect(res.body.record.title).toBe('Bart the Genius (Editado)')
  })

  it('el cambio persiste en GET /api/data', async () => {
    await request(app).put('/api/data/1').send({ title: 'Modificado', season: '1' })
    const res = await request(app).get('/api/data')
    const found = res.body.find(r => r.id === '1')
    expect(found.title).toBe('Modificado')
  })

  it('devuelve 404 si el id no existe', async () => {
    const res = await request(app).put('/api/data/99999').send({ title: 'X', season: '1' })
    expect(res.status).toBe(404)
  })
})

// ── DELETE /api/data/:id ──────────────────────────────────────────────────────

describe('DELETE /api/data/:id', () => {
  it('elimina un registro y devuelve 204', async () => {
    const res = await request(app).delete('/api/data/0')
    expect(res.status).toBe(204)
  })

  it('el registro eliminado no aparece en GET /api/data', async () => {
    await request(app).delete('/api/data/0')
    const res = await request(app).get('/api/data')
    expect(res.body).toHaveLength(4)
    expect(res.body.find(r => r.id === '0')).toBeUndefined()
  })

  it('devuelve 404 si el id no existe', async () => {
    const res = await request(app).delete('/api/data/99999')
    expect(res.status).toBe(404)
  })
})
