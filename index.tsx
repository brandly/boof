import * as React from 'react'
import { render } from 'react-dom'
import TextareaAutosize from 'react-autosize-textarea'

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

  return tokens.filter(t => includes(valid, t.char))
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
    while (!this.hasFinished() && this.history.length < 10000) {
      let before = this.state
      let token = this.tokens[this.state.index]
      this.state = advance(consume(this.tokens, this.state, inputChars))
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
    return this.state.index >= this.tokens.length
  }
}

function advance (s: State): State { return { ...s, index: s.index + 1 } }
function consume (tokens: Token[], state: State, input: string[]): State {
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

function summarize (history: Log[]): string {
  const first = history[0]
  const last = history[history.length - 1]

  const cellChanges: string[] = first.before.tape.map((val, pointer) => {
    const diff = last.after.tape[pointer] - val
    const verb = diff > 0 ? 'Add' : 'Subtract'
    const preposition = diff > 0 ? 'to' : 'from'
    return diff === 0 ? '' : `${verb} ${Math.abs(diff)} ${preposition} c${pointer}`
  })

  const prints: string = last.after.output.slice(first.before.output.length).map(char => String.fromCharCode(char)).join('')
  const printed: string = prints.length ? `Print ${JSON.stringify(prints)}` : ''
  return cellChanges.concat(printed).filter(Boolean).join(', ')
}

function changeSequencesPerLine (history: Log[]): Log[][][] {
  return history.reduce((result, log, index) => {
    if (index === 0 || log.token.line !== history[index - 1].token.line) {
      if (!result[log.token.line]) result[log.token.line] = []
      result[log.token.line].push([])
    }
    const forLine = result[log.token.line]
    forLine[forLine.length - 1].push(log)
    return result
  }, [])
}

const nbsp = '\u00A0'
function summariesPerLine (history: Log[]): string[] {
  return changeSequencesPerLine(history).map(line => {
    const summaries = line.map(seq => summarize(seq))
    const summaryToCount = summaries.reduce((map, summary) => {
      if (!summary) return map
      if (!map[summary]) map[summary] = 0
      map[summary] += 1
      return map
    }, {})
    return Object.keys(summaryToCount).map(summary =>
      `${summary}` + (summaryToCount[summary] > 1 ? ` x${summaryToCount[summary]}` : '')
    ).join(' ~~ ') || nbsp
  })
}

const includes = (list, val) => list.indexOf(val) !== -1
const repeat = (val, times) => {
  const output = []
  for (var i = 0; i < times; i++) {
    output.push(val)
  }
  return output.join('')
}

function prettyPrint (str: string): string {
  var depth = 0
  var output: string[] = []
  const modifiers = '+-,.'
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

function toDigits (count: number, input): string {
  let v: string = input.toString()
  while (v.length < count) {
    v = ' ' + v
  }
  return v
}
const Tape = (props: { program: Program }) => {
  const { tape } = props.program.state
  const separator = ' '
  const digits = Math.max.apply(
    Math,
    tape
      .map(v => v.toString().length)
      .concat((tape.length - 1).toString().length)
  )
  const indexes = tape.map((_, index) => toDigits(digits, index)).join(separator)
  const prints = tape.map(v => toDigits(digits, v)).join(separator)
  const pointer = tape.map((_, index) =>
    toDigits(digits, (index === props.program.state.pointer ? '^' : ''))
  ).join(separator)
  return <pre className="tape">{'Cell  ' + indexes + '\n' + 'Value ' + prints + '\n' + '      ' + pointer}</pre>
}

function getUrlHash (): { [key:string]: string } {
  return window.location
            .hash
            .slice(1)
            .split('&')
            .reduce((out, pair) => {
              const [key, val] = decodeURIComponent(pair).split('=')
              out[key] = val
              return out
            }, {})
}

class Boof extends React.Component<{}, {
  input: string,
  src: string,
  summaries: string[],
  program: Program | null
}> {
  constructor (props) {
    super(props)
    this.state = {
      input: '',
      src: '++++++++\n[\n  >++++\n  [\n    >++\n    >+++\n    >+++\n    >+\n    <<<<-\n  ]\n  >+\n  >+\n  >-\n  >>+\n  [\n    <\n  ]\n  <-\n]\n>>.\n>---.\n+++++++..\n+++.\n>>.\n<-.\n<.\n+++.\n------.\n--------.\n>>+.\n>++.',
      summaries: [],
      program: null
    }
  }

  componentDidMount () {
    const hash = getUrlHash()
    try {
      this.run(atob(hash.s))
    } catch (e) {
      console.error(e)
      this.run()
    }
  }

  run (src = this.state.src) {
    const p = new Program(src)
    p.run(this.state.input)
    this.setState({
      src,
      program: p,
      summaries: summariesPerLine(p.history)
    })
  }

  render () {
    const { program, input } = this.state
    return <div>
      <header>
        <div className="buttons">
          <button onClick={() => {
            const src = prettyPrint(this.state.src)
            this.setState({
              src
            })
            this.run(src)
          }}>pretty</button>
          <button onClick={() => {
            window.location.hash = `s=${btoa(this.state.src)}`
          }}>save</button>
        </div>
        {program && (
          <div className="io">
            <input
              type="text"
              placeholder="input"
              value={input}
              onChange={e => {
                this.setState({ input: e.target.value })
                // wait for state to update
                setTimeout(() => {
                  this.run()
                })
              }}
            />
            <span className="operator">-></span>
            <input type="text" placeholder="output" value={program.print()} readOnly />
            {!program.hasFinished() && <span>(didn't finish)</span>}
          </div>
        )}
      </header>
      <div className="scroll">
        <div className="pane">
          <TextareaAutosize
            style={{
              fontSize: 'inherit',
              fontFamily: 'inherit'
            }}
            value={this.state.src}
            onChange={e => {
              if (e.target instanceof HTMLTextAreaElement) {
                const src = e.target.value
                this.run(src)
              }
            }}
          ></TextareaAutosize>
        </div>
        <ul className="pane">
          {this.state.src.split('\n').map((_, line) =>
            <li key={line}>{this.state.summaries[line] || nbsp}</li>
           )}
        </ul>
      </div>
      {program && (
        <footer>
          <Tape program={program} />
        </footer>
      )}
    </div>
  }
}

render(<Boof />, document.querySelector('#main'))
