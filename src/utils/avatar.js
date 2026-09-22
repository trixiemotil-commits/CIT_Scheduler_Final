export function initialsAvatar(userOrName = '') {
  const name = typeof userOrName === 'string'
    ? userOrName
    : `${userOrName?.firstName || ''} ${userOrName?.lastName || userOrName?.name || ''}`
  const normalizedName = name.trim() || 'User'
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(normalizedName)}&background=DDECE5&color=1B4332&bold=true`
}
