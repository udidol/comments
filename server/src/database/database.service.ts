import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import * as bcrypt from "bcryptjs";
import { CommentsController } from "../comments/comments.controller";
import { CommentEntity } from "../comments/comments.service";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const sqlite3 = require("sqlite3").verbose();

interface RunResult {
  changes: number;
  lastInsertRowid: number | bigint;
}

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private db: InstanceType<typeof sqlite3.Database>;

  async onModuleInit() {
    const dbPath = path.join(__dirname, "../../database/comments.db");
    this.db = new sqlite3.Database(dbPath);
    await this.run("PRAGMA journal_mode = WAL", []);
    await this.initSchema();
    await this.seedUsers();
    await this.seedComments();
  }

  onModuleDestroy() {
    this.db.close();
  }

  private async initSchema() {
    // First, create tables without indexes
    await new Promise<void>((resolve, reject) => {
      this.db.exec(
        `
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
    `,
        (err: Error) => {
          if (err) return reject(err);
          resolve();
        }
      );
    });

    // Run migrations to add new columns
    await this.runMigrations();

    // Create indexes after migrations
    await this.createIndexes();
  }

  private async runMigrations() {
    // Check if columns exist and add them if not
    const tableInfo = await this.all<{ name: string }>(
      "PRAGMA table_info(comments)",
      []
    );
    const columnNames = tableInfo.map((col) => col.name);

    // Add 'type' column if it doesn't exist
    if (!columnNames.includes("type")) {
      await this.run(
        "ALTER TABLE comments ADD COLUMN type TEXT NOT NULL DEFAULT 'comment'",
        []
      );
      console.log("Migration: Added type column to comments table");
    }

    // Add 'parent_id' column if it doesn't exist
    if (!columnNames.includes("parent_id")) {
      await this.run("ALTER TABLE comments ADD COLUMN parent_id INTEGER", []);
      console.log("Migration: Added parent_id column to comments table");
    }

    // Add 'created_at' column if it doesn't exist
    if (!columnNames.includes("created_at")) {
      await this.run(
        "ALTER TABLE comments ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP",
        []
      );
      // Set created_at to date_last_updated for existing rows
      await this.run(
        "UPDATE comments SET created_at = date_last_updated WHERE created_at IS NULL",
        []
      );
      console.log("Migration: Added created_at column to comments table");
    }
  }

  private async createIndexes() {
    // Create all indexes (IF NOT EXISTS handles duplicates)
    try {
      await this.run(
        "CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id)",
        []
      );
      await this.run(
        "CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at ASC)",
        []
      );
    } catch {
      // Indexes might already exist
    }
  }

  private async seedUsers() {
    const existingUsers = await this.get<{ count: number }>(
      "SELECT 1 as count FROM users LIMIT 1",
      []
    );

    if (!existingUsers) {
      const passwordHash = bcrypt.hashSync(
        process.env.JOINT_PASSWORD as string,
        10
      );

      const users = ["udi", "jonathan", "shimi", "yotam"];
      for (const username of users) {
        await this.run(
          "INSERT INTO users (username, password_hash) VALUES (?, ?)",
          [username, passwordHash]
        );
      }
      console.log("Seeded test users: udi, jonathan, shimi, yotam");
    }
  }

  async seedComments() {
    const existingComments = await this.get<{ count: number }>(
      "SELECT 1 as count FROM comments LIMIT 1",
      []
    );

    if (!existingComments) {
      const seedCommentsPath = path.join(
        __dirname,
        "../../database/comments-seed.txt"
      );
      // Read the seed comments file line by line and create an array of Comment objects using these comment text contents (each line contains a comment text content). For user_id, iterate over user IDs 1 to 4 in a round-robin fashion. For x_coord and y_coord, generate random numbers between 0 and 1000.
      const seedCommentsTextLines = fs
        .readFileSync(seedCommentsPath, "utf-8")
        .split("\n");

      const DEFAULT_FILE_ID = "default";
      for (const [index, comment] of seedCommentsTextLines.entries()) {
        const userId = (index % 4) + 1;
        await this.run(
          `INSERT INTO comments (file_id, user_id, text_content, x_coord, y_coord, type, parent_id)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            DEFAULT_FILE_ID,
            userId,
            comment.trim(),
            Math.floor(Math.random() * 1000),
            Math.floor(Math.random() * 1000),
            "comment",
            null,
          ]
        );
      }
      console.log("Seeded initial comments from seed_comments.txt");
    }
  }

  getDb() {
    return this.db;
  }

  run(sql: string, params: unknown[] = []): Promise<RunResult> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err: Error | null) {
        if (err) {
          reject(err);
        } else {
          resolve({
            lastInsertRowid: this.lastID,
            changes: this.changes,
          });
        }
      });
    });
  }

  get<T>(sql: string, params: unknown[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err: Error | null, row: T) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  all<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err: Error | null, rows: T[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}
