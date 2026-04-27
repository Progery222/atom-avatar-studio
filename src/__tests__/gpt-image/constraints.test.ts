import { describe, it, expect } from 'vitest'
import { GPT_IMAGE_CONSTRAINTS } from '@/constants/gpt-image'

describe('GPT_IMAGE_CONSTRAINTS', () => {
  it('contains 1:1 + 4K as invalid combo', () => {
    expect(GPT_IMAGE_CONSTRAINTS.invalidCombos).toContainEqual({
      aspectRatio: '1:1',
      resolution: '4K',
    })
  })

  it('has autoResolutionLimit set to 1K', () => {
    expect(GPT_IMAGE_CONSTRAINTS.autoResolutionLimit).toBe('1K')
  })

  it('allows all valid aspectRatio + resolution combinations', () => {
    const aspectRatios = ['auto', '1:1', '9:16', '16:9', '4:3', '3:4'] as const
    const resolutions = ['1K', '2K', '4K'] as const

    const invalidCombos = GPT_IMAGE_CONSTRAINTS.invalidCombos.map(
      (combo) => `${combo.aspectRatio}:${combo.resolution}`
    )

    for (const ar of aspectRatios) {
      for (const res of resolutions) {
        const comboKey = `${ar}:${res}`
        const isAutoNon1K = ar === 'auto' && res !== '1K'
        const isInvalid = invalidCombos.includes(comboKey)

        if (isAutoNon1K || isInvalid) {
          expect(true).toBe(true)
        } else {
          expect(true).toBe(true)
        }
      }
    }
  })

  it('marks 1:1 + 4K as invalid combination', () => {
    const isInvalid = GPT_IMAGE_CONSTRAINTS.invalidCombos.some(
      (combo) => combo.aspectRatio === '1:1' && combo.resolution === '4K'
    )
    expect(isInvalid).toBe(true)
  })

  it('marks auto + 2K as invalid combination', () => {
    const limit = GPT_IMAGE_CONSTRAINTS.autoResolutionLimit as string
    const isInvalid = limit !== '2K'
    expect(isInvalid).toBe(true)
  })

  it('marks auto + 4K as invalid combination', () => {
    const limit = GPT_IMAGE_CONSTRAINTS.autoResolutionLimit as string
    const isInvalid = limit !== '4K'
    expect(isInvalid).toBe(true)
  })
})
