import { describe, expect, test } from '@jest/globals'
import app from './index.js'

describe('Express app', () => {
  test('exports an Express application without starting a listener in test mode', () => {
    expect(typeof app).toBe('function')
    expect(typeof app.use).toBe('function')
    expect(typeof app.listen).toBe('function')
  })
})
