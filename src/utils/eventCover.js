const gradients = [
  ['#465361', '#222a31'],
  ['#526574', '#28343d'],
  ['#59636d', '#30363c'],
  ['#475c5a', '#263633'],
  ['#61586a', '#342e3b'],
]

export function eventInitials(title = '') {
  const value = title.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join('')
  return value.toUpperCase() || 'EV'
}

export function eventCoverStyle(event = {}) {
  const source = String(event.title || event.id || 'event')
  const hash = [...source].reduce((total, character) => total + character.charCodeAt(0), 0)
  const [start, end] = gradients[hash % gradients.length]
  return {
    background: `radial-gradient(circle at 78% 22%, rgba(255,255,255,.2), transparent 28%), linear-gradient(135deg, ${start}, ${end})`,
  }
}
