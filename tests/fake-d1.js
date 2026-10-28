// A small fake of the Cloudflare D1 binding for tests, backed by Node's built-in
// SQLite (D1 is SQLite too), so the Worker's real SQL runs unchanged.
import { DatabaseSync } from 'node:sqlite';

class FakeStatement {
  constructor(db, sql, values = []) {
    this.db = db;
    this.sql = sql;
    this.values = values;
  }

  bind(...values) {
    return new FakeStatement(this.db, this.sql, values);
  }

  async run() {
    const info = this.db.prepare(this.sql).run(...this.values);
    return { success: true, meta: { changes: Number(info.changes) } };
  }

  async all() {
    return { success: true, results: this.db.prepare(this.sql).all(...this.values).map((row) => ({ ...row })) };
  }

  async first(column) {
    const row = this.db.prepare(this.sql).get(...this.values);
    if (!row) return null;
    return column ? row[column] : { ...row };
  }
}

/** Creates an in-memory D1-like database. */
export function createFakeD1() {
  const db = new DatabaseSync(':memory:');
  return {
    prepare: (sql) => new FakeStatement(db, sql),
    batch: async (statements) => Promise.all(statements.map((statement) => statement.run())),
    exec: async (sql) => {
      db.exec(sql);
      return { count: 1 };
    },
  };
}
