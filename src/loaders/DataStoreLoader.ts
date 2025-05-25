import {
  type IDocument,
  type IRecord,
  type ILoaderOptions,
  type ILoaderCallback,
  DocumentSchema,
  RecordSchema,
  VectorSchema,
  MetadataSchema,
  Loader,
} from "../core/index.js";

import { createClient, type Client } from "@libsql/client";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { z } from "zod";

const DEFAULT_DATABASE_URL = "file:data/ragpipe.db";
const DEFAULT_TABLE_NAME = "embeddings";
const DEFAULT_DIMENSIONS = 384;

/**
 * The schema of the document record
 */
export const LibSQLRecordSchema = RecordSchema.extend({
  id: z.number().describe("The id of the record"),
  createdAt: z.preprocess((val) => {
    if (typeof val === "string") {
      return new Date(val);
    }
    return val;
  }, z.date()),
  vector: z.preprocess((val) => {
    try {
      if (typeof val === "string") {
        return JSON.parse(val);
      }
      // Handle Node.js Buffer
      if (val instanceof Buffer) {
        // Convert Buffer to Float32Array, then to number[]
        return Array.from(
          new Float32Array(val.buffer, val.byteOffset, val.byteLength / 4)
        );
      }
      // Handle ArrayBuffer
      if (val instanceof ArrayBuffer) {
        return Array.from(new Float32Array(val));
      }
      return val;
    } catch {
      return [];
    }
  }, VectorSchema),
  metadata: z.preprocess((val) => {
    try {
      return typeof val === "string" ? JSON.parse(val) : val;
    } catch {
      return {};
    }
  }, MetadataSchema),
});

export type LibSQLRecord = z.infer<typeof LibSQLRecordSchema>;

/**
 * The arguments for the LibSQLStore class.
 */
export const LibSQLStoreOptionsSchema = z.object({
  databaseUrl: z
    .string()
    .optional()
    .describe("The URL of the database")
    .default(DEFAULT_DATABASE_URL)
    .transform((val) => {
      return process.env.DATABASE_URL || val;
    }),
  tableName: z
    .string()
    .optional()
    .describe("The name of the table")
    .default(DEFAULT_TABLE_NAME)
    .transform((val) => {
      return process.env.TABLE_NAME || val;
    }),
  dimensions: z.coerce
    .number()
    .optional()
    .describe("The dimensions of the embedding vectors")
    .default(DEFAULT_DIMENSIONS)
    .transform((val) => {
      return Number(process.env.DIMENSIONS || val);
    }),
  search: z
    .boolean()
    .optional()
    .describe("Whether to search the database")
    .default(false),
});

export type LibSQLStoreArgs = z.infer<typeof LibSQLStoreOptionsSchema>;

export type LibSQLStoreOptions = LibSQLStoreArgs & {
  databaseUrl: string;
  tableName: string;
  dimensions: number;
};

export interface IDataStoreLoaderOptions<
  T extends DataStoreLoader = DataStoreLoader
> extends ILoaderOptions<T>,
    LibSQLStoreArgs {}

/**
 * The LibSQLStore class is a class that extends the BaseVectorStore class.
 * It is used to store and retrieve embeddings from a LibSQL database.
 */
export class DataStoreLoader extends Loader {
  private _client: Client | null = null;

  /**
   * The constructor for the LibSQLStore class.
   * @param options - The options for the LibSQLStore class.
   */
  constructor(public options: IDataStoreLoaderOptions = {}) {
    super(options);
    this.options = LibSQLStoreOptionsSchema.parse(
      options
    ) as LibSQLStoreOptions;
  }

  /**
   * Transform the data
   * @param doc - The document to transform
   * @param callback - The callback to call when the data is transformed
   */
  async _load(doc: IDocument, callback: ILoaderCallback) {
    try {
      if (this.options.search) {
        const records = await this.search(doc.vector);
        for (const record of records) {
          this.process(record);
        }
        callback();
      } else {
        const record = await this.insert(doc);
        callback(null, record);
      }
    } catch (error) {
      callback(error as Error);
    }
  }

  /**
   * Gets an embedding from the database.
   * @param id - The id of the embedding to get.
   * @returns The embedding.
   */
  async getOne(id: number): Promise<LibSQLRecord> {
    const { tableName } = this.options;
    const client = await this.getClient();

    const result = await client.execute({
      args: [id],
      sql: `
        select id, created_at as createdAt, metadata, content, e.vector
        from ${tableName} e
        where e.id = ?
      `,
    });

    // If the embedding is not found, throw an error
    if (result.rows.length === 0) {
      throw new Error("Embedding not found");
    }

    return LibSQLRecordSchema.parse(result.rows[0]);
  }

  /**
   * Adds a document to the database.
   * @param doc - The document to add.
   * @returns The added document.
   */
  async insert(doc: IDocument) {
    const { content, metadata, vector } = DocumentSchema.parse(doc);
    const { tableName } = this.options;

    if (typeof content !== "string") {
      throw new Error("Content must be a string");
    }

    // Create the table and index if they don't exist
    const client = await this.getClient();
    const result = await client.execute({
      args: [content, JSON.stringify(metadata), JSON.stringify(vector)],
      sql: `insert into ${tableName} (content, metadata, vector)
              values (?, ?, vector32(?))`,
    });

    // If the embedding is not found, throw an error
    if (result.rowsAffected === 0) {
      throw new Error("Failed to insert embedding");
    }

    const record = await this.getOne(Number(result.lastInsertRowid));
    return record;
  }

  /**
   * Searches the database for the most relevant embeddings.
   * @param vectorQuery - The vector to search for.
   * @param results - The number of results to return
   * @returns The most relevant embeddings.
   */
  async search(vectorQuery: number[], results = 3): Promise<IRecord[]> {
    const vector = JSON.stringify(vectorQuery);
    const { tableName } = this.options;
    const client = await this.getClient();

    const records = await client.execute({
      args: [vector, results, vector],
      sql: `select id, created_at as createdAt, metadata, content, e.vector
            from vector_top_k('${tableName}_idx', vector32(?), ?) i
            join ${tableName} e using (id)
            order by vector_distance_cos(e.vector, vector32(?))`,
    });

    // Convert the records to the SearchResult type
    return records.rows.map((row) => LibSQLRecordSchema.parse(row));
  }

  /**
   * Drops the table.
   */
  async dropTable() {
    const { tableName } = this.options;
    const client = await this.getClient();

    await client.batch([
      `DROP INDEX IF EXISTS ${tableName}_idx`,
      `DROP TABLE IF EXISTS ${tableName}`,
    ]);
  }

  /**
   * Initializes the database.
   * @returns The client for the database.
   */
  async initDatabase() {
    const { databaseUrl: url, tableName, dimensions } = this.options;

    // Create the directory if it doesn't exist
    if (url.startsWith("file:")) {
      const dbPath = url.slice(5);
      mkdirSync(dirname(dbPath), { recursive: true });
    }

    // create the client
    const client = createClient({ url });

    // Create the table and index if they don't exist
    await client.batch([
      `CREATE TABLE IF NOT EXISTS ${tableName} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        content TEXT,
        metadata TEXT,
        vector F32_BLOB(${dimensions})
      )`,
      `CREATE INDEX IF NOT EXISTS ${tableName}_idx ON ${tableName} (libsql_vector_idx(vector))`,
    ]);

    return client;
  }

  /**
   * Gets the client for the database.
   * @returns The client for the database.
   */
  async getClient() {
    if (!this._client) {
      this._client = await this.initDatabase();
    }

    return this._client;
  }
}
