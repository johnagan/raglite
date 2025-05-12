import { BaseVectorStore, EmbeddableDocumentSchema, BaseVectorStoreArgsSchema, Document } from "@root/core";
import { createClient, type Client } from "@libsql/client";
import { z } from "zod";

const DEFAULT_TABLE_NAME = "embeddings";
const DEFAULT_DATABASE_URL = "file:data/raglite.db";
const DEFAULT_DIMENSIONS = 1536;

/**
 * The schema of the document record
 */
export const LibSQLDocumentSchema = EmbeddableDocumentSchema.extend({
  id: z.number().describe("The id of the document"),
  content: z.string().describe("The content of the document"),
  vector: z.preprocess((val) => {
    try {
      if (typeof val === "string") {
        return JSON.parse(val);
      }
      // Handle Node.js Buffer
      if (val instanceof Buffer) {
        // Convert Buffer to Float32Array, then to number[]
        return Array.from(new Float32Array(val.buffer, val.byteOffset, val.byteLength / 4));
      }
      // Handle ArrayBuffer
      if (val instanceof ArrayBuffer) {
        return Array.from(new Float32Array(val));
      }
      return val;
    } catch {
      return [];
    }
  }, z.number().array().describe("The vector of the embedding")),
  metadata: z.preprocess((val) => {
    try {
      return typeof val === "string" ? JSON.parse(val) : val;
    } catch {
      return {};
    }
  }, z.any().default({}).describe("The metadata of the embedding")),
});

export type LibSQLDocument = z.infer<typeof LibSQLDocumentSchema>;

/**
 * The schema of a new document record
 */
export const NewLibSQLDocumentSchema = LibSQLDocumentSchema.omit({ id: true, vector: true });

export type NewLibSQLDocument = z.infer<typeof NewLibSQLDocumentSchema>;

/**
 * The arguments for the LibSQLStore class.
 */
export const LibSQLStoreArgsSchema = BaseVectorStoreArgsSchema.extend({
  url: z.string().optional().describe("The URL of the database"),
  tableName: z.string().optional().describe("The name of the table"),
  dimensions: z.number().optional().describe("The dimensions of the embedding vectors"),
});

export type LibSQLStoreArgs = z.infer<typeof LibSQLStoreArgsSchema>;

/**
 * The options for the LibSQLStore class.
 */
export const LibSQLStoreOptionsSchema = LibSQLStoreArgsSchema.extend({
  dimensions: z.coerce.number().default(DEFAULT_DIMENSIONS),
  tableName: z.string().default(DEFAULT_TABLE_NAME),
  url: z.string().default(DEFAULT_DATABASE_URL),
});

export type LibSQLStoreOptions = z.infer<typeof LibSQLStoreOptionsSchema>;

/**
 * The LibSQLStore class is a class that extends the BaseVectorStore class.
 * It is used to store and retrieve embeddings from a LibSQL database.
 */
export class LibSQLStore extends BaseVectorStore {
  options: LibSQLStoreOptions;
  client: Client;

  /**
   * The constructor for the LibSQLStore class.
   * @param options - The options for the LibSQLStore class.
   */
  constructor(options: LibSQLStoreArgs) {
    super(options);
    this.options = LibSQLStoreOptionsSchema.parse(options);
    this.client = createClient({ url: this.options.url });
  }

  /**
   * Resets the database.
   */
  async reset() {
    const { tableName, dimensions } = this.options;
    await this.client.batch([
      `DROP TABLE IF EXISTS ${tableName}`,
      `CREATE TABLE ${tableName} (id INTEGER PRIMARY KEY AUTOINCREMENT, content TEXT, metadata TEXT, vector F32_BLOB(${dimensions}))`,
      `CREATE INDEX ${tableName}_idx ON ${tableName} (libsql_vector_idx(vector))`,
    ]);
  }

  /**
   * Gets an embedding from the database.
   * @param id - The id of the embedding to get.
   * @returns The embedding.
   */
  async getOne(id: number): Promise<LibSQLDocument> {
    const { tableName } = this.options;
    const result = await this.client.execute({
      args: [id],
      sql: `select * from ${tableName} where id = ?`,
    });

    // If the embedding is not found, throw an error
    if (result.rows.length === 0) {
      throw new Error("Embedding not found");
    }

    return LibSQLDocumentSchema.parse(result.rows[0]);
  }

  /**
   * Adds a document to the database.
   * @param doc - The document to add.
   * @returns The added document.
   */
  async addDocument(doc: Document) {
    const { content, metadata } = doc;
    const { tableName } = this.options;
    const vector = await this.model.embed(content);

    const result = await this.client.execute({
      args: [content, JSON.stringify(metadata), JSON.stringify(vector)],
      sql: `
            insert into ${tableName} (content, metadata, vector)
            values (?, ?, vector32(?))
          `,
    });

    // If the embedding is not found, throw an error
    if (result.rowsAffected === 0) {
      throw new Error("Failed to insert embedding");
    }

    return await this.getOne(Number(result.lastInsertRowid));
  }

  /**
   * Searches the database for the most relevant embeddings.
   * @param text - The text to search for.
   * @param results - The number of results to return
   * @returns The most relevant embeddings.
   */
  async search(text: string, results = 3): Promise<LibSQLDocument[]> {
    const vectorQuery = await this.model.embed(text);
    const vector = JSON.stringify(vectorQuery);
    const { tableName } = this.options;

    const records = await this.client.execute({
      args: [vector, results, vector],
      sql: `
        select id, metadata, content, e.vector
        from vector_top_k('${tableName}_idx', vector32(?), ?) i
        join ${tableName} e using (id)
        order by vector_distance_cos(e.vector, vector32(?))
      `,
    });

    // Convert the records to the SearchResult type
    return records.rows.map((row) => LibSQLDocumentSchema.parse(row));
  }
}
