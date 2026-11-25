export function apiMessage(error, fallback) {
  const message = error?.response?.data?.message
  return typeof message === 'string' && message ? message : fallback
}

export const passwordHint = '15–72 characters'

export function passwordError(password) {
  if ([...password].length < 15) return 'Use at least 15 characters.'
  if (new TextEncoder().encode(password).length > 72) return 'That password is too long. Try a shorter passphrase.'
  return ''
}

export function photoError(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return 'Choose a JPG, PNG, or WebP image.'
  if (file.size === 0 || file.size > 512 * 1024) return 'Choose a non-empty image of 512 KB or less.'
  return ''
}

export function readPhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}
export const universities = [
  'Cairo University', 'Alexandria University', 'Ain Shams University',
  'Al-Azhar University', 'Assiut University', 'Tanta University',
  'Mansoura University', 'Zagazig University', 'Helwan University',
  'Minia University', 'Menoufia University', 'Suez Canal University',
  'South Valley University', 'Benha University', 'Fayoum University',
  'Beni Suef University', 'Kafrelsheikh University', 'Sohag University',
  'Port Said University', 'Damanhour University', 'Aswan University',
  'Damietta University', 'Suez University', 'Arish University',
  'New Valley University', 'Matrouh University', 'Luxor University',
  'Hurghada University', 'Capital University', 'Sadat City University',
]

