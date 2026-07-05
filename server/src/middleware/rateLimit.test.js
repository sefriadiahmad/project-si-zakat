import { EventEmitter } from 'events'
import { describe, expect, test } from '@jest/globals'
import { createAuthRateLimiter } from './rateLimit.js'
import { ErrorCodes } from '../utils/errors.js'

function createRequest(ip) {
  return {
    ip,
    method: 'POST',
    url: '/api/auth/login',
    originalUrl: '/api/auth/login',
    headers: {},
    app: { get: () => false },
  }
}

function createResponse(done) {
  const response = new EventEmitter()

  response.headersSent = false
  response.statusCode = 200
  response.writableEnded = false
  response.setHeader = () => {}
  response.status = (statusCode) => {
    response.statusCode = statusCode
    return response
  }
  response.send = (body) => {
    response.body = body
    response.writableEnded = true
    done(response)
    return response
  }
  response.json = (body) => response.send(body)

  return response
}

function invokeLimiter(limiter, ip) {
  return new Promise((resolve, reject) => {
    const response = createResponse(resolve)

    limiter(createRequest(ip), response, (error) => {
      if (error) {
        reject(error)
        return
      }

      resolve({ nextCalled: true, statusCode: response.statusCode })
    })
  })
}

describe('authRateLimiter', () => {
  test('blocks the sixth failed auth request in the same window', async () => {
    const limiter = createAuthRateLimiter({
      windowMs: 60_000,
      max: 5,
      skipSuccessfulRequests: false,
      validate: false,
    })
    const ip = '203.0.113.10'

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await expect(invokeLimiter(limiter, ip)).resolves.toMatchObject({
        nextCalled: true,
        statusCode: 200,
      })
    }

    await expect(invokeLimiter(limiter, ip)).resolves.toMatchObject({
      statusCode: 429,
      body: {
        message: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.',
        code: ErrorCodes.RATE_LIMIT_EXCEEDED,
      },
    })
  })
})
