export const includes = (list, val) => list.indexOf(val) !== -1

export function getUrlHash(): { [key: string]: string } {
  return window.location.hash
    .slice(1)
    .split('&')
    .reduce((out, pair) => {
      const [key, val] = decodeURIComponent(pair).split('=')
      out[key] = val
      return out
    }, {})
}
