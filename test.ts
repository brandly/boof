/* global test, expect */
// import test from 'ava'
import { Program } from './program'

test('program will execute', () => {
  const p = new Program('++++++++++++++++++++++++++++++++++++.')
  expect(p.run().print()).toEqual('$')
})
