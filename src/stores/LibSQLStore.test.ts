import { describe, it, beforeEach, expect } from "vitest";
import { LibSQLStore, LibSQLStoreArgs } from "./LibSQLStore";
import { OpenAIModel } from "@root/models";

// Use a test database file or in-memory for isolation
const TEST_DB_URL = "file:data/test-database.db";

const defaultOptions: LibSQLStoreArgs = {
  tableName: "test_embeddings",
  model: new OpenAIModel(),
  url: TEST_DB_URL,
  dimensions: 1536,
};

const sampleDoc = {
  content: "Hello world",
  metadata: { source: "test" },
};

describe("LibSQLStore", () => {
  let store: LibSQLStore;

  beforeEach(async () => {
    store = new LibSQLStore(defaultOptions);
    await store.reset();
  });

  it("should initialize with correct options", () => {
    expect(store.options.url).toBe(TEST_DB_URL);
    expect(store.options.tableName).toBe("test_embeddings");
    expect(store.options.dimensions).toBe(1536);
  });

  it("should add and retrieve a document", async () => {
    const inserted = await store.addDocument(sampleDoc);
    expect(inserted.content).toBe(sampleDoc.content);
    expect(inserted.metadata).toEqual(sampleDoc.metadata);
    expect(inserted.vector).toBeDefined();
    expect(inserted.vector.length).toBeGreaterThan(0);

    const fetched = await store.getOne(inserted.id);
    expect(fetched.content).toBe(sampleDoc.content);
    expect(fetched.metadata).toEqual(sampleDoc.metadata);
    expect(fetched.vector).toBeDefined();
    expect(fetched.vector.length).toBeGreaterThan(0);
  });

  it("should throw when getting a non-existent document", async () => {
    await expect(store.getOne(9999)).rejects.toThrow("Embedding not found");
  });

  it("should search for similar vectors", async () => {
    // Insert multiple docs
    await store.addDocument(sampleDoc);
    await store.addDocument(sampleDoc);
    await store.addDocument(sampleDoc);

    const results = await store.search("Dummy");
    expect(results.length).toBeGreaterThan(1);
    // The closest vector should be the first one
    expect(results[0].vector).toBeDefined();
    expect(results[0].vector.length).toBeGreaterThan(0);
  });

  it("should reset the database", async () => {
    await store.addDocument(sampleDoc);
    await store.reset();
    await expect(store.getOne(1)).rejects.toThrow("Embedding not found");
  });
});
