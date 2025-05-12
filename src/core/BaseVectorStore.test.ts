import { describe, it, expect, vi } from "vitest";
import { BaseVectorStore, BaseVectorStoreArgs } from "./BaseVectorStore";
import { BaseModel, Document } from "./index";

// Mock BaseEmbeddingModel for testing
class DummyEmbeddingModel extends BaseModel {}

describe("BaseVectorStore", () => {
  const dummyModel = new DummyEmbeddingModel();

  it("should set the model in the constructor", () => {
    const store = new BaseVectorStore({ model: dummyModel } as BaseVectorStoreArgs);
    expect(store.model).toBe(dummyModel);
  });

  it("reset should throw 'Not implemented'", async () => {
    const store = new BaseVectorStore({ model: dummyModel } as BaseVectorStoreArgs);
    await expect(store.reset()).rejects.toThrow("Not implemented");
  });

  it("getOne should throw 'Not implemented'", async () => {
    const store = new BaseVectorStore({ model: dummyModel } as BaseVectorStoreArgs);
    await expect(store.getOne(1)).rejects.toThrow("Not implemented");
  });

  it("addDocument should throw 'Not implemented'", async () => {
    const store = new BaseVectorStore({ model: dummyModel } as BaseVectorStoreArgs);
    await expect(store.addDocument({} as Document)).rejects.toThrow("Not implemented");
  });

  it("search should throw 'Not implemented'", async () => {
    const store = new BaseVectorStore({ model: dummyModel } as BaseVectorStoreArgs);
    await expect(store.search("query")).rejects.toThrow("Not implemented");
  });

  it("addDocuments should call addDocument for each document", async () => {
    // Subclass to mock addDocument
    class TestStore extends BaseVectorStore {
      addDocument = vi.fn().mockResolvedValue({});
    }
    const store = new TestStore({ model: dummyModel } as BaseVectorStoreArgs);
    const docs = [{}, {}, {}] as Document[];
    await store.addDocuments(docs);
    expect(store.addDocument).toHaveBeenCalledTimes(docs.length);
  });
});
