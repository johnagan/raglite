import { describe, it, beforeEach, afterEach, expect } from "vitest";
import { DataStoreLoader } from "./DataStoreLoader.js";

describe("DataStoreLoader", () => {
  let loader: DataStoreLoader;

  let tableName = "test_embeddings";
  const databaseUrl = "file:data/test.db";
  const dimensions = 1536;

  const content = "Hello world";
  const metadata = { source: "test" };
  const vector = Array(1536)
    .fill(0)
    .map(() => Math.random());

  beforeEach(async () => {
    loader = new DataStoreLoader({ tableName, databaseUrl, dimensions });
  });

  afterEach(async () => {
    await loader.dropTable();
  });

  it("should add and retrieve a document", async () => {
    const inserted = await loader.insert({ content, metadata, vector });
    expect(inserted).toBeDefined();
    expect(inserted.id).toBeDefined();
    expect(inserted.content).toBe(content);
    expect(inserted.metadata).toEqual(metadata);
    expect(inserted.vector).toBeDefined();
    expect(inserted.vector?.length).toBeGreaterThan(0);
  });

  it("should get one document by id", async () => {
    const inserted = await loader.insert({ content, metadata, vector });
    const fetched = await loader.getOne(inserted.id);
    expect(fetched.id).toBe(inserted.id);
    expect(fetched.content).toBe(content);
    expect(fetched.metadata).toEqual(metadata);
    expect(fetched.vector).toBeDefined();
    expect(fetched.vector?.length).toBeGreaterThan(0);
  });

  it("should throw when getting a non-existent document", async () => {
    await expect(loader.getOne(9999)).rejects.toThrow("Embedding not found");
  });

  it("should search for the most relevant embeddings", async () => {
    const inserted = await loader.insert({ content, metadata, vector });
    const results = await loader.search(vector, 1);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(inserted.id);
  });
});
