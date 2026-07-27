import os from 'node:os'

export function getLanAddress() {
  if (process.env.CIT_APK_HOST) return process.env.CIT_APK_HOST

  const candidates = Object.entries(os.networkInterfaces())
    .flatMap(([name, addresses = []]) => addresses.map(address => ({ name, ...address })))
    .filter(address => address.family === 'IPv4' && !address.internal)
    .filter(address => (
      address.address.startsWith('192.168.')
      || address.address.startsWith('10.')
      || /^172\.(1[6-9]|2\d|3[01])\./.test(address.address)
    ))
    .sort((left, right) => {
      const virtual = /virtual|vmware|vbox|hyper-v|wsl/i
      const leftScore = (virtual.test(left.name) ? 10 : 0) + (left.address.endsWith('.1') ? 2 : 0)
      const rightScore = (virtual.test(right.name) ? 10 : 0) + (right.address.endsWith('.1') ? 2 : 0)
      return leftScore - rightScore
    })

  if (!candidates.length) {
    throw new Error('No local Wi-Fi/LAN address was found. Connect this laptop to Wi-Fi and try again.')
  }

  return candidates[0].address
}
