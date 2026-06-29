import { describe, it, expect } from 'vitest'
import { filterRecords } from '../../server.js'

const records = [
  { id: '0', title: 'Simpsons Roasting on an Open Fire', season: '1', directed_by: 'David Silverman', imdb_rating: '8.1', tmdb_rating: '7.0' },
  { id: '1', title: 'Bart the Genius', season: '1', directed_by: 'David Silverman', imdb_rating: '7.7', tmdb_rating: '7.4' },
  { id: '2', title: "Homer's Odyssey", season: '1', directed_by: 'Wes Archer', imdb_rating: '7.3', tmdb_rating: '6.5' },
  { id: '3', title: 'Bart Gets an F', season: '2', directed_by: 'David Silverman', imdb_rating: '8.0', tmdb_rating: '7.8' },
  { id: '4', title: 'Simpson and Delilah', season: '2', directed_by: 'Rich Moore', imdb_rating: '7.8', tmdb_rating: '7.2' },
]

describe('filterRecords', () => {
  it('sin filtros devuelve todos los registros', () => {
    expect(filterRecords(records, {})).toHaveLength(5)
  })

  it('filtra por título (case insensitive)', () => {
    const result = filterRecords(records, { title: 'bart' })
    expect(result).toHaveLength(2)
    expect(result.map(r => r.id)).toEqual(['1', '3'])
  })

  it('filtra por título parcial', () => {
    const result = filterRecords(records, { title: 'homer' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })

  it('filtra por temporada exacta', () => {
    const result = filterRecords(records, { season: '2' })
    expect(result).toHaveLength(2)
    expect(result.every(r => r.season === '2')).toBe(true)
  })

  it('filtra por rating IMDB mínimo', () => {
    const result = filterRecords(records, { imdb_rating: '8.0' })
    expect(result).toHaveLength(2)
    expect(result.every(r => parseFloat(r.imdb_rating) >= 8.0)).toBe(true)
  })

  it('filtra por rating TMDB mínimo', () => {
    // Ratings: 7.0, 7.4, 6.5, 7.8, 7.2 → >= 7.3 son: 7.4 y 7.8
    const result = filterRecords(records, { tmdb_rating: '7.3' })
    expect(result).toHaveLength(2)
    expect(result.every(r => parseFloat(r.tmdb_rating) >= 7.3)).toBe(true)
  })

  it('filtra por director exacto', () => {
    const result = filterRecords(records, { directed_by: 'David Silverman' })
    expect(result).toHaveLength(3)
  })

  it('combina múltiples filtros (AND)', () => {
    const result = filterRecords(records, { title: 'bart', season: '1' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('devuelve array vacío si no hay coincidencias', () => {
    expect(filterRecords(records, { title: 'x-files' })).toHaveLength(0)
  })

  it('llama sin argumentos devuelve todos los registros', () => {
    expect(filterRecords(records)).toHaveLength(5)
  })
})
