//convert a base64 string to ArrayBuffer
function base64ToArrayBuffer(base64) {
  const binaryString = window.atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

//convert ArrayBuffer to base64 string
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}

//import public key from PEM format
async function importPublicKey(pemKey) {
  //remove PEM header/footer and newlines
  const pemContents = pemKey
    .replace(/-----BEGIN PUBLIC KEY-----/, '')
    .replace(/-----END PUBLIC KEY-----/, '')
    .replace(/\s/g, '')

  const binaryDer = base64ToArrayBuffer(pemContents)

  return await window.crypto.subtle.importKey(
    'spki',
    binaryDer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256'
    },
    true,
    ['encrypt']
  )
}

//encrypt password using RSA-OAEP public key
export async function encryptPassword(password, publicKeyPem) {
  try {
    const publicKey = await importPublicKey(publicKeyPem)
    const encodedPassword = new TextEncoder().encode(password)

    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP'
      },
      publicKey,
      encodedPassword
    )

    return arrayBufferToBase64(encryptedBuffer)
  } catch (error) {
    console.error('Password encryption failed:', error)
    throw new Error('Failed to encrypt password')
  }
}

//validate password strength
export function validatePassword(password) {
  const errors = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

//calculate password strength (0-100)
export function calculatePasswordStrength(password) {
  let strength = 0

  if (password.length >= 8) strength += 20
  if (password.length >= 12) strength += 10
  if (password.length >= 16) strength += 10

  if (/[a-z]/.test(password)) strength += 15
  if (/[A-Z]/.test(password)) strength += 15
  if (/[0-9]/.test(password)) strength += 15
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength += 15

  return Math.min(100, strength)
}