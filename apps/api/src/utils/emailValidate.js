import { Resolver } from 'dns/promises'

const resolver = new Resolver()

export async function isValidEmailDomain(email) {
  const domain = email.split('@')[1]
  if (!domain) return false
  
  // Format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return false

  try {
    // Check MX records exist
    const mxRecords = await resolver.resolveMx(domain)
    return mxRecords && mxRecords.length > 0
  } catch {
    return false
  }
}