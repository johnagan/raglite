import { describe, it, expect, beforeEach, vi } from "vitest";
import { LoaderEvent, type IDocument, type IStore, type IRecord } from "../core";
import { StoreLoader } from "./StoreLoader";

describe("StoreLoader", () => {
  let storeLoader: StoreLoader;
  let mockStore: IStore;

  beforeEach(() => {
    // Mock the IStore implementation
    mockStore = {
      options: {},
      insert: vi.fn().mockImplementation(async (doc: IDocument): Promise<IRecord> => {
        return {
          ...doc,
          id: 123, // Mock ID assigned by store
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }),
      getOne: vi.fn(),
      search: vi.fn(),
    };

    storeLoader = new StoreLoader(mockStore);
  });

  it("should insert document into store and process the result", async () => {
    const inputDoc: IDocument = {
      content: "Test document",
      metadata: { source: "test" },
      vector: [0.1, 0.2, 0.3],
    };

    const processedDoc = await new Promise<IDocument>((resolve) => {
      storeLoader.once(LoaderEvent.PROCESSED, (doc) => resolve(doc));
      storeLoader.write(inputDoc);
    });

    expect(processedDoc).toBeDefined();
    expect(processedDoc.id).toBe(123);
    expect(processedDoc.content).toBe("Test document");
    expect(processedDoc.metadata).toEqual({ source: "test" });
    expect(processedDoc.vector).toEqual([0.1, 0.2, 0.3]);
    expect(processedDoc.createdAt).toBeInstanceOf(Date);
    expect(processedDoc.updatedAt).toBeInstanceOf(Date);

    // Verify store.insert was called with the input document
    expect(mockStore.insert).toHaveBeenCalledWith(inputDoc);
  });

  it("should skip documents without string content", async () => {
    const inputDoc: IDocument = {
      content: { some: "object" } as any,
      metadata: { source: "test" },
      vector: [0.1, 0.2, 0.3],
    };

    const skippedDoc = await new Promise<IDocument>((resolve) => {
      storeLoader.once(LoaderEvent.SKIPPED, (doc) => resolve(doc));
      storeLoader.write(inputDoc);
    });

    expect(skippedDoc).toBe(inputDoc);
    expect(mockStore.insert).not.toHaveBeenCalled();
  });

  it("should skip documents without vector", async () => {
    const inputDoc: IDocument = {
      content: "Test document",
      metadata: { source: "test" },
    };

    const skippedDoc = await new Promise<IDocument>((resolve) => {
      storeLoader.once(LoaderEvent.SKIPPED, (doc) => resolve(doc));
      storeLoader.write(inputDoc);
    });

    expect(skippedDoc).toBe(inputDoc);
    expect(mockStore.insert).not.toHaveBeenCalled();
  });

  it("should skip documents with non-array vector", async () => {
    const inputDoc: IDocument = {
      content: "Test document",
      metadata: { source: "test" },
      vector: "not an array" as any,
    };

    const skippedDoc = await new Promise<IDocument>((resolve) => {
      storeLoader.once(LoaderEvent.SKIPPED, (doc) => resolve(doc));
      storeLoader.write(inputDoc);
    });

    expect(skippedDoc).toBe(inputDoc);
    expect(mockStore.insert).not.toHaveBeenCalled();
  });

  it("should handle errors from store.insert", async () => {
    // Mock insert to throw an error
    mockStore.insert = vi.fn().mockRejectedValue(new Error("Insert failed"));
    
    const inputDoc: IDocument = {
      content: "Test document",
      metadata: { source: "test" },
      vector: [0.1, 0.2, 0.3],
    };

    const errorEvent = await new Promise<any>((resolve) => {
      storeLoader.once(LoaderEvent.ERROR, (error) => resolve(error));
      storeLoader.write(inputDoc);
    });

    expect(errorEvent).toBeDefined();
    expect(errorEvent.doc).toBeDefined();
    expect(errorEvent.error).toBeDefined();
    expect(errorEvent.error.message).toContain("Insert failed");
  });

  it("should emit received and completed events", async () => {
    const inputDoc: IDocument = {
      content: "Test document",
      metadata: { source: "test" },
      vector: [0.1, 0.2, 0.3],
    };

    const events: string[] = [];
    
    storeLoader.on(LoaderEvent.RECEIVED, () => events.push("received"));
    storeLoader.on(LoaderEvent.PROCESSED, () => events.push("processed"));
    storeLoader.on(LoaderEvent.COMPLETED, () => events.push("completed"));

    await new Promise<void>((resolve) => {
      storeLoader.on(LoaderEvent.COMPLETED, () => {
        resolve();
      });
      
      storeLoader.write(inputDoc);
      storeLoader.end();
    });

    expect(events).toContain("received");
    expect(events).toContain("processed");
    expect(events).toContain("completed");
  });
});
