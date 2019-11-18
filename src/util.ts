export function includes<T>(list: T[], val: T) {
  return list.indexOf(val) !== -1
}

type Hash = { [key: string]: string }
export function getUrlHash(): Hash {
  return window.location.hash
    .slice(1)
    .split('&')
    .reduce((out: Hash, pair) => {
      const [key, val] = decodeURIComponent(pair).split('=')
      out[key] = val
      return out
    }, {})
}
