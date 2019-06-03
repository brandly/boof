import * as React from 'react'
import { render } from 'react-dom'
import { includes, getUrlHash } from './util'

const worker = new Worker('./worker.tsx')

const repeat = (val: string, times: number) => {
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
    .map((_, index: number) => toDigits(digits, index))
    .join(separator)
  const prints = tape.map(v => toDigits(digits, v)).join(separator)
  const pointer = tape
    .map((_, index: number) =>
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

interface BoofState {
  input: string
  src: string
  program: { summaries: string[]; output: string; hasFinished: bool } | null
  tape: Program.State
}

const nbsp = '\u00A0'
class Boof extends React.Component<{}, BoofState> {
  constructor(props) {
    super(props)
    this.state = {
      input: '',
      src: prettyPrint(
        '++++++++[>++++[>++>+++>+++>+<<<<-]>+>+>->>+[<]<-]>>.>---.+++++++..+++.>>.<-.<.+++.------.--------.>>+.>++.'
      ),
      program: null
    }
    worker.onmessage = e => {
      this.setState({
        program: e.data
      })
    }
  }

  componentDidMount() {
    const hash = getUrlHash()
    try {
      this.run(atob(hash.s))
    } catch (e) {
      console.error('Error getting URL hash:', e)
      this.run()
    }
  }

  run(src = this.state.src) {
    worker.postMessage({ src, input: this.state.input })

    this.setState({
      src
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
                value={program.output}
                readOnly
              />
              {!program.hasFinished && <span>(didn't finish)</span>}
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
            {program
              ? this.state.src
                  .split('\n')
                  .map((_, line) => (
                    <li key={line}>{program.summaries[line] || nbsp}</li>
                  ))
              : null}
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
