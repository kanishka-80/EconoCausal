


import test from 'node:test'
import assert from 'node:assert/strict'
import { parseCSVContent } from '../src/utils/csv.js'

test('parses a basic CSV file', () => {
  assert.deepEqual(
    parseCSVContent('name,amount\nAsha,100\nRavi,200'),
    {
      headers: ['name', 'amount'],
      rows: [['Asha', '100'], ['Ravi', '200']],
    }
  )
})

test('supports quoted commas and escaped quotes', () => {
  const result = parseCSVContent(
    'name,note\nAsha,"hello, world"\nRavi,"said ""hello"""'
  )
  assert.deepEqual(result.rows, [
    ['Asha', 'hello, world'],
    ['Ravi', 'said "hello"'],
  ])
})

test('supports newlines inside quoted fields', () => {
  const result = parseCSVContent(
    'name,note\nAsha,"first line\nsecond line"'
  )
  assert.deepEqual(result.rows, [
    ['Asha', 'first line\nsecond line'],
  ])
})

test('supports BOM and Windows line endings', () => {
  const result = parseCSVContent(
    '\uFEFFname,amount\r\nAsha,100\r\nRavi,200\r\n'
  )
  assert.equal(result.headers[0], 'name')
  assert.equal(result.rows.length, 2)
})

test('rejects a file with no data rows', () => {
  assert.throws(() => parseCSVContent('name,amount'), /no data rows/)
})

test('rejects missing column headers', () => {
  assert.throws(
    () => parseCSVContent('name,,amount\nAsha,10,100'),
    /Each column must have a header/
  )
})
test('rejects inconsistent row lengths', () => {
  assert.throws(
    () => parseCSVContent('name,amount\nAsha,100\nRavi,200,extra'),
    /expected 2\./
  )
})


test('rejects an unclosed quoted field', () => {
  assert.throws(
    () => parseCSVContent('name,note\nAsha,"unfinished'),
    /unclosed quoted field/
  )
})
