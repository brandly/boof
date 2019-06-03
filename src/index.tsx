import * as React from 'react'
import { render } from 'react-dom'
import { getUrlHash } from './util'
import Tape from './Tape'
import prettyPrint from './prettyPrint'

const worker = new Worker('./worker.tsx')

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
