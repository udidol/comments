import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import * as bcrypt from "bcrypt";
import { CommentsController } from "../comments/comments.controller";
import { CommentEntity } from "../comments/comments.service";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Database = require("better-sqlite3");

interface RunResult {
  changes: number;
  lastInsertRowid: number | bigint;
}

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private db: InstanceType<typeof Database>;

  onModuleInit() {
    const dbPath = path.join(__dirname, "../../database/comments.db");
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.initSchema();
    this.seedUsers();
    this.seedComments();
  }

  onModuleDestroy() {
    this.db.close();
  }

  private initSchema() {
    // First, create tables without indexes
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_id TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        text_content TEXT NOT NULL,
        x_coord REAL NOT NULL,
        y_coord REAL NOT NULL,
        type TEXT NOT NULL DEFAULT 'comment' CHECK(type IN ('comment', 'reply')),
        parent_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        date_last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (parent_id) REFERENCES comments(id)
    );
    `);

    // Run migrations to add new columns
    this.runMigrations();

    // Create indexes after migrations
    this.createIndexes();
  }

  private runMigrations() {
    // Check if columns exist and add them if not
    const tableInfo = this.db
      .prepare("PRAGMA table_info(comments)")
      .all() as Array<{ name: string }>;
    const columnNames = tableInfo.map((col) => col.name);

    // Add 'type' column if it doesn't exist
    if (!columnNames.includes("type")) {
      this.db.exec(
        "ALTER TABLE comments ADD COLUMN type TEXT NOT NULL DEFAULT 'comment'"
      );
      console.log("Migration: Added type column to comments table");
    }

    // Add 'parent_id' column if it doesn't exist
    if (!columnNames.includes("parent_id")) {
      this.db.exec("ALTER TABLE comments ADD COLUMN parent_id INTEGER");
      console.log("Migration: Added parent_id column to comments table");
    }

    // Add 'created_at' column if it doesn't exist
    if (!columnNames.includes("created_at")) {
      this.db.exec(
        "ALTER TABLE comments ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP"
      );
      // Set created_at to date_last_updated for existing rows
      this.db.exec(
        "UPDATE comments SET created_at = date_last_updated WHERE created_at IS NULL"
      );
      console.log("Migration: Added created_at column to comments table");
    }
  }

  private createIndexes() {
    // Create all indexes (IF NOT EXISTS handles duplicates)
    try {
      this.db.exec(
        "CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id)"
      );
      this.db.exec(
        "CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at ASC)"
      );
    } catch {
      // Indexes might already exist
    }
  }

  private seedUsers() {
    const existingUsers = this.db
      .prepare("SELECT 1 as count FROM users LIMIT 1")
      .get() as { count: number };

    if (existingUsers.count === 0) {
      const passwordHash = bcrypt.hashSync(
        process.env.JOINT_PASSWORD as string,
        10
      );
      const insert = this.db.prepare(
        "INSERT INTO users (username, password_hash) VALUES (?, ?)"
      );

      const users = ["udi", "jonathan", "shimi", "yotam"];
      for (const username of users) {
        insert.run(username, passwordHash);
      }
      console.log("Seeded test users: udi, jonathan, shimi, yotam");
    }
  }

  seedComments() {
    const existingComments = this.db
      .prepare("SELECT 1 as count FROM comments LIMIT 1")
      .get() as { count: number } | undefined;

    if (!existingComments || existingComments.count === 0) {
      const seedCommentsPath = path.join(
        __dirname,
        "../../database/comments-seed.txt"
      );
      // Read the seed comments file line by line and create an array of Comment objects using these comment text contents (each line contains a comment text content). For user_id, iterate over user IDs 1 to 4 in a round-robin fashion. For x_coord and y_coord, generate random numbers between 0 and 1000.
      const seedCommentsTextLines = fs
        .readFileSync(seedCommentsPath, "utf-8")
        .split("\n");

      const DEFAULT_FILE_ID = "default-file-id";
      for (const [index, comment] of seedCommentsTextLines.entries()) {
        const userId = (index % 4) + 1;
        this.db
          .prepare(
            `INSERT INTO comments (file_id, user_id, text_content, x_coord, y_coord, type, parent_id)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          )
          .run(
            DEFAULT_FILE_ID,
            userId,
            comment.trim(),
            Math.floor(Math.random() * 1000),
            Math.floor(Math.random() * 1000),
            "comment",
            null
          );
      }
      console.log("Seeded initial comments from seed_comments.txt");
    }
  }

  getDb() {
    return this.db;
  }

  run(sql: string, params: unknown[] = []): RunResult {
    return this.db.prepare(sql).run(...params);
  }

  get<T>(sql: string, params: unknown[] = []): T | undefined {
    return this.db.prepare(sql).get(...params) as T | undefined;
  }

  all<T>(sql: string, params: unknown[] = []): T[] {
    return this.db.prepare(sql).all(...params) as T[];
  }
}
