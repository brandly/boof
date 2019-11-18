import { includes } from './util'

export default function prettyPrint(str: string): string {
  var depth = 0
  var output: string[] = []
  const modifiers = '+-,.'.split('')
  for (var i = 0; i < str.length; i++) {
    if (str[i] !== '\n' && str[i] !== ' ') {
      // Indent after linebreak
      if (output[output.length - 1] === '\n') {
        if (str[i] == ']') {
          output.push(repeat('  ', depth - 1))
        } else {
          output.push(repeat('  ', depth))
        }
      }
      output.push(str[i])
    }
    // Break after modifier(s)
    if (includes(modifiers, str[i]) && !includes(modifiers, str[i + 1])) {
      output.push('\n')
    }
    // Break after brackets
    if (str[i] === '[' || str[i] == ']') {
      output.push('\n')
    }
    if (str[i] === '[') {
      depth += 1
    }
    if (str[i] == ']') {
      depth -= 1
    }
  }
  return output.join('')
}

const repeat = (val: string, times: number) => {
  const output = []
  for (var i = 0; i < times; i++) {
    output.push(val)
  }
  return output.join('')
}
