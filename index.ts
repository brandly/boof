interface State {
  index: number,
  pointer: number,
  tape: number[],
  output: number[]
}

interface Token {
  char: string,
  line: number,
  column: number
}

interface Log {
  before: State,
  token: Token,
  after: State
}

const valid = '><+-[].,'
const tokenize = (src: string) => {
  const chars = src.split('')

  let line = 0
  let column = 0
  const tokens = chars.map((char, i) => {
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

  return tokens.filter(t => valid.indexOf(t.char) !== -1)
}

class Program {
  src: string;
  tokens: Token[];
  state: State;
  history: Log[];

  constructor (src: string) {
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

  run (input: string, debug: boolean = false) {
    const inputChars = input.split('')
    while (!this.hasFinished()) {
      let before = this.state
      let token = this.tokens[this.state.index]
      this.state = advance(consume(this.src, this.state, inputChars))
      this.history.push({
        before,
        token,
        after: this.state
      })
      debug && console.log(
        this.src[this.state.index - 1],
        '\n',
        this.state.tape
          .map((c, i) =>
            i === this.state.pointer ? `(${c})` : c.toString()
          )
          .join(' ')
       )
    }
    return this
  }

  print () {
    return this.state.output.map(char => String.fromCharCode(char)).join('')
  }

  hasFinished () {
    return this.state.index >= this.src.length
  }
}

{
  const cat = ',[.,]'

  // [ 72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33, 10 ]
  const helloWorld = '++++++++[>++++[>++>+++>+++>+<<<<-]>+>+>->>+[<]<-]>>.>---.+++++++..+++.>>.<-.<.+++.------.--------.>>+.>++.'

  // const p = new Program(cat)
  // console.log(JSON.stringify(p.run('abc', true).history, null, 2))
  const p = new Program(helloWorld)
  console.log(p.run('').print())
}

function advance (s: State) { return { ...s, index: s.index + 1 } }
function consume (src: string, state: State, input: string[]) {
  const char = src[state.index]
  const { tape, pointer, output } = state

  switch (char) {
    case '>': {
      const newTape = tape.slice(0)
      const newPointer = pointer + 1
      newTape[newPointer] = newTape[newPointer] || 0
      return {
        ...state,
        tape: newTape,
        pointer: pointer + 1
      }
    }
    case '<':
      return {
        ...state,
        pointer: pointer - 1
      }
    case '+': {
      const newTape = tape.slice(0)
      newTape[pointer] = (newTape[pointer] || 0) + 1
      return {
        ...state,
        tape: newTape
      }
    }
    case '-': {
      const newTape = tape.slice(0)
      newTape[pointer] = (newTape[pointer] || 0) - 1
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
          if (src[index] === '[') {
            depth += 1
          } else if (src[index] === ']') {
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
        if (src[index] === '[') {
          depth -= 1
        } else if (src[index] === ']') {
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
        output: output.concat(tape[state.pointer] || 0)
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
