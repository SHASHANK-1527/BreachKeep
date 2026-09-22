// Usage: node src/scripts/hashAdmin.js "your-admin-password"
import bcrypt from 'bcryptjs'
const pw = process.argv[2]
if (!pw) { console.error('Pass the password as an argument'); process.exit(1) }
console.log(await bcrypt.hash(pw, 12))
