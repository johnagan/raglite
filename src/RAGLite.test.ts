import { describe, it, expect, vi, beforeEach } from "vitest";
import { OpenAIModel } from "./models/OpenAIModel";
import { LibSQLStore } from "./stores/LibSQLStore";
import { Pipeline } from "./Pipeline";
import { RAGLite } from "./RAGLite";

// Mock dependencies
vi.mock("./models/OpenAIModel", async (importOriginal) => {
  const originalModule = await importOriginal<typeof import("./models/OpenAIModel")>();
  return {
    ...originalModule,
    OpenAIModel: vi.fn().mockImplementation(() => ({
      embed: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
      options: { apiKey: "test-api-key", model: "text-embedding-3-small" },
    })),
  };
});

vi.mock("./Pipeline", async (importOriginal) => {
  const originalModule = await importOriginal<typeof import("./Pipeline")>();
  return {
    ...originalModule,
    Pipeline: vi.fn().mockImplementation(() => ({
      load: vi
        .fn()
        .mockResolvedValue([{ id: 1, content: "test content", metadata: { source: "test" }, vector: [0.1, 0.2, 0.3] }]),
    })),
  };
});

vi.mock("./stores/LibSQLStore", async (importOriginal) => {
  const originalModule = await importOriginal<typeof import("./stores/LibSQLStore")>();
  return {
    ...originalModule,
    LibSQLStore: vi.fn().mockImplementation(() => ({
      addDocument: vi.fn().mockResolvedValue({
        id: 1,
        content: "test content",
        metadata: { source: "test" },
        vector: [0.1, 0.2, 0.3],
      }),
      search: vi
        .fn()
        .mockResolvedValue([
          { id: 1, content: "test content", metadata: { source: "test" }, vector: [0.1, 0.2, 0.3], score: 0.95 },
        ]),
    })),
  };
});

describe("RAGLite", () => {
  let raglite: RAGLite;
  const options = {
    apiKey: "test-api-key",
    url: "file:test.db",
    tableName: "test_embeddings",
    dimensions: 1536,
    model: "text-embedding-3-small",
    maxTokens: 1000,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    raglite = new RAGLite(options);
  });

  it("should initialize with correct dependencies", () => {
    expect(raglite.model).toBeDefined();
    expect(raglite.pipeline).toBeDefined();
    expect(raglite.store).toBeDefined();
    expect(OpenAIModel).toHaveBeenCalledWith(options);
    expect(Pipeline).toHaveBeenCalledWith(raglite.model);
    expect(LibSQLStore).toHaveBeenCalledWith(options);
  });

  it("should load content into the store", async () => {
    const content = "test content";
    const metadata = { source: "test" };

    const docs = await raglite.load(content, metadata);

    expect(raglite.pipeline.load).toHaveBeenCalledWith({ content, metadata });
    expect(raglite.store.insert).toHaveBeenCalled();
    expect(docs).toBeDefined();
    expect(docs.length).toBe(1);
    expect(docs[0].content).toBe("test content");
    expect(docs[0].metadata).toEqual({ source: "test" });
  });

  it("should throw an error when no documents are found during load", async () => {
    // Override the mock for this specific test
    (raglite.pipeline.load as any).mockResolvedValueOnce(null);

    const content = "test content";
    const metadata = { source: "test" };

    await expect(raglite.load(content, metadata)).rejects.toThrow("No document found");
    expect(raglite.pipeline.load).toHaveBeenCalledWith({ content, metadata });
    expect(raglite.store.insert).not.toHaveBeenCalled();
  });

  it("should search for documents", async () => {
    const query = "test query";
    const results = 5;

    await raglite.search(query, results);

    expect(raglite.model.embed).toHaveBeenCalledWith(query);
    expect(raglite.store.search).toHaveBeenCalledWith([0.1, 0.2, 0.3], results);
  });

  it("should use default number of results when not specified", async () => {
    const query = "test query";

    await raglite.search(query);

    expect(raglite.model.embed).toHaveBeenCalledWith(query);
    expect(raglite.store.search).toHaveBeenCalledWith([0.1, 0.2, 0.3], 3); // Default is 3
  });
});
