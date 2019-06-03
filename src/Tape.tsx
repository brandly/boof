import * as React from 'react'
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

export default Tape
