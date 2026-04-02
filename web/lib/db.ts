import Database from "better-sqlite3";
import path from "path";

// shop.db lives next to the Next.js app (web/data) after repo restructure
const DB_PATH = path.join(process.cwd(), "data", "shop.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH, { readonly: false });
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
  }
  return _db;
}
