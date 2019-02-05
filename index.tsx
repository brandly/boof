import * as React from 'react'
import { render } from 'react-dom'
import { Program } from './program'
import { includes } from './util'

function summarize(history: Log[]): string {
  const { before } = history[0]
  const { after } = history[history.length - 1]

  const cellChanges: string[] = []
  for (let i = 0; i < Math.max(before.tape.length, after.tape.length); i++) {
    const diff: number = after.tape[i] - (before.tape[i] || 0)
    const verb = diff > 0 ? 'Add' : 'Subtract'
    const preposition = diff > 0 ? 'to' : 'from'
    cellChanges.push(
      diff === 0 ? '' : `${verb} ${Math.abs(diff)} ${preposition} c${i}`
    )
  }

  const prints: string = after.output
    .slice(before.output.length)
    .map(char => String.fromCharCode(char))
    .join('')
  const printed: string = prints.length ? `Print ${JSON.stringify(prints)}` : ''
  return cellChanges
    .concat(printed)
    .filter(Boolean)
    .join('. ')
}

function changeSequencesPerLine(history: Log[]): Log[][][] {
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
function summariesPerLine(history: Log[]): string[] {
  return changeSequencesPerLine(history).map(line => {
    const summaries = line.map(seq => summarize(seq))
    const summaryToCount = summaries.reduce((map, summary) => {
      if (!summary) return map
      if (!map[summary]) map[summary] = 0
      map[summary] += 1
      return map
    }, {})
    return (
      Object.keys(summaryToCount)
        .map(
          summary =>
            `${summary}` +
            (summaryToCount[summary] > 1 ? ` x${summaryToCount[summary]}` : '')
        )
        .join(' ~~ ') || nbsp
    )
  })
}

const repeat = (val, times) => {
  const output = []
  for (var i = 0; i < times; i++) {
    output.push(val)
  }
  return output.join('')
}

function prettyPrint(str: string): string {
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

function toDigits(count: number, input): string {
  let v: string = input.toString()
  while (v.length < count) {
    v = ' ' + v
  }
  return v
}
const Tape = (props: { state: State }) => {
  const { tape } = props.state
  const separator = ' '
  const digits = Math.max.apply(
    Math,
    tape
      .map(v => v.toString().length)
      .concat((tape.length - 1).toString().length)
  )
  const indexes = tape
    .map((_, index) => toDigits(digits, index))
    .join(separator)
  const prints = tape.map(v => toDigits(digits, v)).join(separator)
  const pointer = tape
    .map((_, index) =>
      toDigits(digits, index === props.state.pointer ? '^' : '')
    )
    .join(separator)
  return (
    <pre className="tape">
      {'Cell  ' +
        indexes +
        '\n' +
        'Value ' +
        prints +
        '\n' +
        '      ' +
        pointer}
    </pre>
  )
}

function getUrlHash(): { [key: string]: string } {
  return window.location.hash
    .slice(1)
    .split('&')
    .reduce((out, pair) => {
      const [key, val] = decodeURIComponent(pair).split('=')
      out[key] = val
      return out
    }, {})
}

class Executor {
  constructor() {}
}

interface BoofProps {
  input: string
  src: string
  summaries: string[]
  program: Program | null
}

class Boof extends React.Component<{}, BoofProps> {
  constructor(props) {
    super(props)
    this.state = {
      input: '',
      src:
        '++++++++\n[\n  >++++\n  [\n    >++\n    >+++\n    >+++\n    >+\n    <<<<-\n  ]\n  >+\n  >+\n  >-\n  >>+\n  [\n    <\n  ]\n  <-\n]\n>>.\n>---.\n+++++++..\n+++.\n>>.\n<-.\n<.\n+++.\n------.\n--------.\n>>+.\n>++.',
      summaries: [],
      program: null
    }
  }

  componentDidMount() {
    const hash = getUrlHash()
    try {
      this.run(atob(hash.s))
    } catch (e) {
      console.error(e)
      this.run()
    }
  }

  run(src = this.state.src) {
    const p = new Program(src)
    p.run(this.state.input)
    this.setState({
      src,
      program: p,
      summaries: summariesPerLine(p.history)
    })
  }

  render() {
    const { program, input } = this.state
    return (
      <div>
        <header>
          <a href="https://github.com/brandly/boof">
            <h1>boof</h1>
          </a>
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
              <input
                type="text"
                placeholder="output"
                value={program.print()}
                readOnly
              />
              {!program.hasFinished() && <span>(didn't finish)</span>}
            </div>
          )}
          <div className="buttons">
            <button
              onClick={() => {
                const src = prettyPrint(this.state.src)
                this.setState({
                  src
                })
                this.run(src)
              }}
            >
              pretty
            </button>
            <button
              onClick={() => {
                try {
                  window.location.hash = `s=${btoa(this.state.src)}`
                } catch (e) {
                  alert(e)
                }
              }}
            >
              save
            </button>
          </div>
        </header>
        <div className="scroll">
          <div className="pane">
            <textarea
              wrap="off"
              style={{
                fontSize: 'inherit',
                fontFamily: 'inherit',
                minWidth: '100%',
                height: this.state.src.split('\n').length * 18 + 4 + 'px',
                overflowX: 'auto'
              }}
              value={this.state.src}
              onChange={e => {
                if (e.target instanceof HTMLTextAreaElement) {
                  const src = e.target.value
                  this.run(src)
                }
              }}
            />
          </div>
          <ul className="pane">
            {this.state.src.split('\n').map((_, line) => (
              <li key={line}>{this.state.summaries[line] || nbsp}</li>
            ))}
          </ul>
        </div>
        {program && (
          <footer>
            <Tape state={program.state} />
          </footer>
        )}
      </div>
    )
  }
}

render(<Boof />, document.querySelector('#main'))
