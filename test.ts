/* global test, expect */
import { Program } from './program'

test('program will execute', () => {
  const p = new Program('++++++++++++++++++++++++++++++++++++.')
  expect(p.run().print()).toEqual('$')
})

test('cells underflow', () => {
  const p = new Program('------.')
  expect(p.run().print()).toEqual('ú')
})

test('cells overflow', () => {
  const p = new Program('--++.')
  const zero = new Program('.').run().print()
  expect(p.run().print()).toEqual(zero)
})
