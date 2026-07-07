import { jest } from '@jest/globals'

export function buildZakatMockDb(rows = []) {
  // Store the rows
  const storedRows = [...rows]

  // Create a factory function that returns fresh query builders
  function createQueryBuilder() {
    const qb = function (table) {
      // Reset state for new query chain
      qb._table = table
      qb._rows = storedRows
      qb._filters = []
      qb._groupBy = []
      qb._select = []
      qb._limit = undefined
      qb._offset = undefined
      qb._orderBy = undefined
      qb._joins = []
      qb._sumObj = undefined
      qb._calledFirst = false
      return qb
    }

    qb.where = jest.fn(function (col, op, val) {
      qb._filters.push({ col, op, val })
      return qb
    })

    qb.whereNot = jest.fn(function () { return qb })

    qb.groupBy = jest.fn(function (...cols) {
      qb._groupBy = cols
      return qb
    })

    qb.select = jest.fn(function (...cols) {
      qb._select.push(...cols.map((c) => (typeof c === 'string' ? { type: 'column', name: c } : c)))
      return qb
    })

    qb.count = jest.fn(function (alias) {
      qb._select.push({ type: 'count', alias })
      return qb
    })

    qb.sum = jest.fn(function (obj) {
      qb._sumObj = obj
      return qb
    })

    qb.first = jest.fn(function () {
      qb._calledFirst = true
      return qb
    })

    qb.limit = jest.fn(function (n) {
      qb._limit = n
      return qb
    })

    qb.offset = jest.fn(function (n) {
      qb._offset = n
      return qb
    })

    qb.orderBy = jest.fn(function (col, dir) {
      qb._orderBy = { col, dir }
      return qb
    })

    qb.join = jest.fn(function (table, left, right) {
      qb._joins.push({ table, left, right })
      return qb
    })

    qb.clone = jest.fn(function () {
      // Clone creates a new query builder with same state
      const cloned = createQueryBuilder()
      cloned._filters = [...qb._filters]
      cloned._groupBy = [...qb._groupBy]
      cloned._select = [...qb._select]
      cloned._limit = qb._limit
      cloned._offset = qb._offset
      cloned._orderBy = qb._orderBy
      cloned._joins = [...qb._joins]
      cloned._sumObj = qb._sumObj
      return cloned
    })

    qb.raw = jest.fn((sql) => ({ raw: sql }))
    qb.fn = { now: jest.fn(() => new Date().toISOString()) }

    qb.then = function (resolve, reject) {
      try {
        let result

        // Group by queries
        if (qb._groupBy.length > 0) {
          if (qb._sumObj) {
            const filtered = applyFilters(qb._rows, qb._filters)
            const grouped = applyGroupBy(filtered, qb._groupBy)
            result = grouped.map((g) => {
              const obj = {}
              qb._groupBy.forEach((c) => {
                const col = c.includes('.') ? c.split('.')[1] : c
                obj[col] = g[col]
              })
              for (const [key, expr] of Object.entries(qb._sumObj)) {
                if (typeof expr === 'object' && expr.raw) {
                  obj[key] = computeCASE(expr.raw, g)
                } else {
                  obj[key] = g.reduce((acc, r) => acc + (Number(r[expr]) || 0), 0)
                }
              }
              return obj
            })
          } else {
            const filtered = applyFilters(qb._rows, qb._filters)
            const grouped = applyGroupBy(filtered, qb._groupBy)
            result = grouped.map((g) => {
              const obj = {}
              qb._groupBy.forEach((c) => {
                const col = c.includes('.') ? c.split('.')[1] : c
                obj[col] = g[col]
              })
              qb._select.forEach((sel) => {
                if (sel.type === 'count') {
                  obj[sel.alias || 'count'] = g.length
                } else if (sel.type === 'column') {
                  const col = sel.name.includes('.') ? sel.name.split('.')[1] : sel.name
                  obj[col] = g[col]
                }
              })
              return obj
            })
          }
          return Promise.resolve(result).then(resolve, reject)
        }

        const filtered = applyFilters(qb._rows, qb._filters)
        const limited = qb._limit ? filtered.slice(0, qb._limit) : filtered

        // Handle .first() specifically
        if (qb._calledFirst) {
          if (qb._sumObj) {
            result = {}
            for (const [key, expr] of Object.entries(qb._sumObj)) {
              if (typeof expr === 'object' && expr.raw) {
                result[key] = computeCASE(expr.raw, filtered)
              } else {
                result[key] = filtered.reduce((acc, r) => acc + (Number(r[expr]) || 0), 0)
              }
            }
            // sum().first() returns single object
            return Promise.resolve(result).then(resolve, reject)
          } else {
            // first() returns single row or null
            result = limited[0] || null
            return Promise.resolve(result).then(resolve, reject)
          }
        }

        // Regular query returns array
        result = limited
        return Promise.resolve(result).then(resolve, reject)
      } catch (error) {
        return Promise.reject(error).then(reject, reject)
      }
    }

    return qb
  }

  // The db function creates a fresh query builder each time it's called
  const db = createQueryBuilder()

  // Override the function itself to create fresh builders
  const dbProxy = function (table) {
    const builder = createQueryBuilder()
    return builder(table)
  }

  // Copy properties needed for fn and raw
  dbProxy.raw = db.raw
  dbProxy.fn = db.fn

  return dbProxy
}

function applyFilters(rows, filters) {
  return rows.filter((row) => {
    return filters.every((f) => {
      if (!f) return true
      const val = row[f.col]
      if (f.op === 'ilike' || f.op === 'like') {
        return String(val || '').toLowerCase().includes(String(f.val).replace(/%/g, '').toLowerCase())
      }
      if (f.op === '=' || !f.op || f.op === '==') {
        return val == f.val
      }
      return true
    })
  })
}

function applyGroupBy(rows, cols) {
  if (!cols || cols.length === 0) return [rows]
  const map = new Map()
  for (const row of rows) {
    const key = cols.map((c) => row[c]).join('|')
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(row)
  }
  return Array.from(map.values())
}

function computeCASE(sql, rows) {
  if (!Array.isArray(rows)) return 0
  return rows.reduce((acc, row) => {
    const match = sql.match(/CASE WHEN (.+?) THEN (.+?) ELSE 0 END/)
    if (!match) return acc
    const condition = match[1]
    const valueExpr = match[2]
    let condMet = false
    if (condition.includes("IN (")) {
      const matchIn = condition.match(/IN \((.+?)\)/)
      if (matchIn) {
        const values = matchIn[1].split(',').map((v) => v.trim().replace(/'/g, ''))
        const field = condition.split(' ')[0]
        condMet = values.includes(String(row[field]))
      }
    } else if (condition.includes('=')) {
      const [field, val] = condition.split('=').map((s) => s.trim().replace(/'/g, ''))
      condMet = String(row[field]) === val
    }
    if (condMet) {
      const val = valueExpr.trim()
      acc += Number(row[val]) || 0
    }
    return acc
  }, 0)
}
