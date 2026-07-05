import { jest } from '@jest/globals'

export function buildZakatMockDb(rows = []) {
  const db = function (table) {
    db._currentTable = table
    db._filters = []
    db._groupBy = []
    db._select = []
    db._limit = undefined
    db._offset = undefined
    db._orderBy = undefined
    db._joins = []
    db._sumObj = undefined
    return db
  }

  db._rows = rows

  db.where = jest.fn(function (col, op, val) {
    db._filters.push({ col, op, val })
    return db
  })

  db.whereNot = jest.fn(function () { return db })

  db.groupBy = jest.fn(function (...cols) {
    db._groupBy = cols
    return db
  })

  db.select = jest.fn(function (...cols) {
    db._select.push(...cols.map((c) => (typeof c === 'string' ? { type: 'column', name: c } : c)))
    return db
  })

  db.count = jest.fn(function (alias) {
    db._select.push({ type: 'count', alias })
    return db
  })

  db.sum = jest.fn(function (obj) {
    db._sumObj = obj
    return db
  })

  db.first = jest.fn(function () {
    return db
  })

  db.limit = jest.fn(function (n) {
    db._limit = n
    return db
  })

  db.offset = jest.fn(function (n) {
    db._offset = n
    return db
  })

  db.orderBy = jest.fn(function (col, dir) {
    db._orderBy = { col, dir }
    return db
  })

  db.join = jest.fn(function (table, left, right) {
    db._joins.push({ table, left, right })
    return db
  })

  db.clone = jest.fn(function () {
    const cloned = buildZakatMockDb(db._rows)
    cloned._filters = [...db._filters]
    cloned._groupBy = [...db._groupBy]
    cloned._select = [...db._select]
    cloned._limit = db._limit
    cloned._offset = db._offset
    cloned._orderBy = db._orderBy
    cloned._joins = [...db._joins]
    cloned._sumObj = db._sumObj
    return cloned
  })

  db.raw = jest.fn((sql) => ({ raw: sql }))
  db.fn = { now: jest.fn(() => new Date().toISOString()) }

  db.then = function (resolve, reject) {
    try {
      let result
      if (db._groupBy.length > 0) {
        if (db._sumObj) {
          const filtered = applyFilters(db._rows, db._filters)
          const grouped = applyGroupBy(filtered, db._groupBy)
          result = grouped.map((g) => {
            const obj = {}
            db._groupBy.forEach((c) => {
              const col = c.includes('.') ? c.split('.')[1] : c
              obj[col] = g[col]
            })
            for (const [key, expr] of Object.entries(db._sumObj)) {
              if (typeof expr === 'object' && expr.raw) {
                obj[key] = computeCASE(expr.raw, g)
              } else {
                obj[key] = g.reduce((acc, r) => acc + (Number(r[expr]) || 0), 0)
              }
            }
            return obj
          })
        } else {
          const filtered = applyFilters(db._rows, db._filters)
          const grouped = applyGroupBy(filtered, db._groupBy)
          result = grouped.map((g) => {
            const obj = {}
            db._groupBy.forEach((c) => {
              const col = c.includes('.') ? c.split('.')[1] : c
              obj[col] = g[col]
            })
            db._select.forEach((sel) => {
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

    const filtered = applyFilters(db._rows, db._filters)
    const limited = db._limit ? filtered.slice(0, db._limit) : filtered

    if (db._sumObj && db.first.mock.calls.length > 0) {
      result = {}
      for (const [key, expr] of Object.entries(db._sumObj)) {
        if (typeof expr === 'object' && expr.raw) {
          result[key] = computeCASE(expr.raw, filtered)
        } else {
          result[key] = filtered.reduce((acc, r) => acc + (Number(r[expr]) || 0), 0)
        }
      }
      return Promise.resolve([result]).then(resolve, reject)
    }

    if (db.first.mock.calls.length > 0) {
      result = limited[0] || null
      return Promise.resolve(Array.isArray(result) ? result : [result]).then(resolve, reject)
    }

    result = limited
    return Promise.resolve(result).then(resolve, reject)
    } catch (error) {
      return Promise.reject(error).then(reject, reject)
    }
  }

  return db
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
