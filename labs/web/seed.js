import Database from 'better-sqlite3'
import { reward } from './bkflag.js'
export function makeDb() {
  const db = new Database(':memory:')
  db.exec(`
    CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT, role TEXT);
    CREATE TABLE orders (id INTEGER PRIMARY KEY, owner TEXT, item TEXT, secret TEXT);
    CREATE TABLE secrets (id INTEGER PRIMARY KEY, name TEXT, value TEXT);
  `)
  db.prepare('INSERT INTO users VALUES (1,?,?,?)').run('alice', 'wonderland1', 'user')
  db.prepare('INSERT INTO users VALUES (2,?,?,?)').run('admin', 'super-secret-pw', 'admin')
  db.prepare('INSERT INTO orders VALUES (1042,?,?,?)').run('alice', 'Widget', 'nothing here')
  // The admin's order secret is the IDOR room's prize.
  db.prepare('INSERT INTO orders VALUES (1337,?,?,?)').run('admin', 'Vault Key', reward('idor'))
  // Union-based SQLi can read this secrets table (sqli room's prize).
  db.prepare('INSERT INTO secrets VALUES (1,?,?)').run('union-flag', reward('sqli'))
  return db
}
