# api tests
- `logic.test.js` runs anywhere: `npm test` (flags, sorting math, code generation).
- `core.dbtest.js.skip` needs a live Mongo. Rename to `.js` and run with the
  docker-compose mongo up to exercise the DB-backed controllers.
