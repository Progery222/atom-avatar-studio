import { describe, it, expect } from 'vitest'
import { GPT_IMAGE_PRICING } from '@/constants/gpt-image'

describe('GPT_IMAGE_PRICING', () => {
  it('prices 1K at 2 credits', () => {
    expect(GPT_IMAGE_PRICING['1K']).toBe(2)
  })

  it('prices 2K at 3 credits', () => {
    expect(GPT_IMAGE_PRICING['2K']).toBe(3)
  })

  it('prices 4K at 5 credits', () => {
    expect(GPT_IMAGE_PRICING['4K']).toBe(5)
  })
})
