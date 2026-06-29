import { describe, it, expect } from 'vitest'
import { validateRecord } from '../../server.js'

describe('validateRecord', () => {
  const validRecord = {
    title: 'Bart the Genius',
    season: '1',
    imdb_rating: '7.7',
    tmdb_rating: '7.4',
  }

  it('acepta un registro válido completo', () => {
    const { valid, errors } = validateRecord(validRecord)
    expect(valid).toBe(true)
    expect(errors).toHaveLength(0)
  })

  it('rechaza si falta el título', () => {
    const { valid, errors } = validateRecord({ ...validRecord, title: '' })
    expect(valid).toBe(false)
    expect(errors).toContain('El título es requerido.')
  })

  it('rechaza si el título es solo espacios', () => {
    const { valid, errors } = validateRecord({ ...validRecord, title: '   ' })
    expect(valid).toBe(false)
    expect(errors).toContain('El título es requerido.')
  })

  it('rechaza si falta la temporada', () => {
    const { valid, errors } = validateRecord({ ...validRecord, season: '' })
    expect(valid).toBe(false)
    expect(errors).toContain('La temporada es requerida.')
  })

  it('rechaza IMDB fuera de rango (mayor a 10)', () => {
    const { valid, errors } = validateRecord({ ...validRecord, imdb_rating: '11' })
    expect(valid).toBe(false)
    expect(errors).toContain('El rating IMDB debe estar entre 0 y 10.')
  })

  it('rechaza IMDB fuera de rango (negativo)', () => {
    const { valid, errors } = validateRecord({ ...validRecord, imdb_rating: '-1' })
    expect(valid).toBe(false)
    expect(errors).toContain('El rating IMDB debe estar entre 0 y 10.')
  })

  it('rechaza TMDB fuera de rango', () => {
    const { valid, errors } = validateRecord({ ...validRecord, tmdb_rating: '10.5' })
    expect(valid).toBe(false)
    expect(errors).toContain('El rating TMDB debe estar entre 0 y 10.')
  })

  it('acepta ratings vacíos (campos opcionales)', () => {
    const { valid } = validateRecord({ ...validRecord, imdb_rating: '', tmdb_rating: '' })
    expect(valid).toBe(true)
  })

  it('acepta ratings en los límites (0 y 10)', () => {
    expect(validateRecord({ ...validRecord, imdb_rating: '0' }).valid).toBe(true)
    expect(validateRecord({ ...validRecord, imdb_rating: '10' }).valid).toBe(true)
  })

  it('acumula múltiples errores', () => {
    const { valid, errors } = validateRecord({ title: '', season: '' })
    expect(valid).toBe(false)
    expect(errors).toHaveLength(2)
  })
})
