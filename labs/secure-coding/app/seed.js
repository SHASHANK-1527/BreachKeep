import Database from 'better-sqlite3'
export function makeDb() {
  const db = new Database(':memory:')
  db.exec(`
    CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT, role TEXT);
    CREATE TABLE orders (id INTEGER PRIMARY KEY, owner TEXT, item TEXT, secret TEXT);
  `)
  db.prepare('INSERT INTO users VALUES (1,?,?,?)').run('alice', 'wonderland1', 'user')
  db.prepare('INSERT INTO users VALUES (2,?,?,?)').run('admin', 'super-secret-pw', 'admin')
  db.prepare('INSERT INTO orders VALUES (1042,?,?,?)').run('alice', 'Widget', 'ok')
  db.prepare('INSERT INTO orders VALUES (1337,?,?,?)').run('admin', 'Vault Key', 'admin-only-notes')
  return db
}
