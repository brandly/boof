const maxCellVal = 256

export type State = {
  index: number
  pointer: number
  tape: number[]
  output: number[]
}

export type Token = {
  char: string
  line: number
  column: number
}

export type Log = {
  before: State
  token: Token
  after: State
}

const valid = new Set('><+-[].,'.split(''))
const tokenize = (src: string) => {
  const chars = src.split('')

  let line = 0
  let column = 0
  const tokens = chars.map((char) => {
    const t = {
      char,
      line,
      column
    }

    if (char === '\n') {
      column = 0
      line++
    } else {
      column++
    }
    return t
  })

  return tokens.filter((t) => valid.has(t.char))
}

export class Program {
  src: string
  tokens: Token[]
  state: State
  history: Log[]

  constructor(src: string) {
    this.src = src
    this.tokens = tokenize(src)
    this.state = {
      index: 0,
      pointer: 0,
      tape: [0],
      output: []
    }
    this.history = []
  }

  run(input: string = '', debug: boolean = false) {
    const inputChars = input.split('')
    while (!this.hasFinished()) {
      const before = this.state
      const token = this.tokens[this.state.index]
      this.state = advance(consume(this.tokens, this.state, inputChars))
      this.history.push({
        before,
        token,
        after: this.state
      })
      debug &&
        console.log(
          this.src[this.state.index - 1],
          '\n',
          this.state.tape
            .map((c, i) => (i === this.state.pointer ? `(${c})` : c.toString()))
            .join(' ')
        )
    }
    return this
  }

  print() {
    return this.state.output.map((char) => String.fromCharCode(char)).join('')
  }

  hasFinished() {
    return this.state.index >= this.tokens.length
  }
}

function advance(s: State): State {
  return { ...s, index: s.index + 1 }
}
function consume(tokens: Token[], state: State, input: string[]): State {
  const { char } = tokens[state.index]
  const { tape, pointer, output } = state

  switch (char) {
    case '>': {
      const newTape = tape.slice(0)
      const newPointer = pointer + 1
      newTape[newPointer] = newTape[newPointer] || 0
      return {
        ...state,
        tape: newTape,
        pointer: newPointer
      }
    }
    case '<': {
      const updated = pointer - 1
      if (updated < 0) {
        // TODO: improve this error, provide inline feedback
        throw new Error('Invalid tape pointer')
      }
      return {
        ...state,
        pointer: updated
      }
    }
    case '+': {
      const newTape = tape.slice(0)
      newTape[pointer] = ((newTape[pointer] || 0) + 1) % maxCellVal
      return {
        ...state,
        tape: newTape
      }
    }
    case '-': {
      const newTape = tape.slice(0)
      newTape[pointer] = (newTape[pointer] || 0) - 1
      if (newTape[pointer] < 0) {
        newTape[pointer] = newTape[pointer] + maxCellVal
      }
      return {
        ...state,
        tape: newTape
      }
    }
    case '[': {
      if (!tape[pointer]) {
        let depth = 1
        let { index } = state
        while (depth > 0) {
          index += 1
          if (tokens[index].char === '[') {
            depth += 1
          } else if (tokens[index].char === ']') {
            depth -= 1
          }
        }
        return {
          ...state,
          index
        }
      } else {
        return state
      }
    }
    case ']': {
      let depth = 1
      let { index } = state
      while (depth > 0) {
        index -= 1
        if (tokens[index].char === '[') {
          depth -= 1
        } else if (tokens[index].char === ']') {
          depth += 1
        }
      }
      index -= 1
      return {
        ...state,
        index
      }
    }
    case '.': {
      return {
        ...state,
        output: output.concat(tape[pointer] || 0)
      }
    }
    case ',': {
      const val = (input.shift() || '\0').charCodeAt(0)
      const newTape = tape.slice(0)
      newTape[pointer] = val
      return {
        ...state,
        tape: newTape
      }
    }
    default:
      return state
  }
}
