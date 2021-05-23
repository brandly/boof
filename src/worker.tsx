import * as Program from './program'

self.onmessage = (e: { data: { src: string; input: string } }) => {
  const { src, input } = e.data
  const program = new Program.Program(src)
  program.run(input)
  self.postMessage(
    {
      output: program.print(),
      summaries: summariesPerLine(program.history),
      state: program.state
    },
    []
  )
}

function summarize(history: Program.Log[]): string {
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
    .map((char: number) => String.fromCharCode(char))
    .join('')
  const printed: string = prints.length ? `Print ${JSON.stringify(prints)}` : ''
  return cellChanges.concat(printed).filter(Boolean).join('. ')
}

function changeSequencesPerLine(history: Program.Log[]): Program.Log[][][] {
  return history.reduce((result: Program.Log[][][], log, index) => {
    if (index === 0 || log.token.line !== history[index - 1].token.line) {
      if (!result[log.token.line]) {
        result[log.token.line] = []
      }
      result[log.token.line].push([])
    }
    const forLine = result[log.token.line]
    forLine[forLine.length - 1].push(log)
    return result
  }, [])
}

const nbsp = '\u00A0'
type SummaryCount = { [summary: string]: number }
function summariesPerLine(history: Program.Log[]): string[] {
  return changeSequencesPerLine(history).map((line) => {
    const summaries = line.map((seq) => summarize(seq))
    const summaryToCount: SummaryCount = summaries.reduce(
      (map: SummaryCount, summary) => {
        if (!summary) return map
        if (!map[summary]) map[summary] = 0
        map[summary] += 1
        return map
      },
      {}
    )
    return (
      Object.keys(summaryToCount)
        .map(
          (summary) =>
            `${summary}` +
            (summaryToCount[summary] > 1 ? ` x${summaryToCount[summary]}` : '')
        )
        .join(' ~~ ') || nbsp
    )
  })
}
