import { describe, it, expect, beforeEach, vi } from "vitest";
import { LoaderEvent, type IDocument, type IModel } from "../core";
import { EmbeddingLoader } from "./EmbeddingLoader";

describe("EmbeddingLoader", () => {
  let embeddingLoader: EmbeddingLoader;
  let mockModel: IModel;

  beforeEach(() => {
    // Mock the IModel implementation
    mockModel = {
      embed: vi.fn().mockImplementation(async (text: string) => {
        return [0.1, 0.2, 0.3]; // Mock embedding vector
      }),
      chunks: vi.fn().mockImplementation(async function* (text: string) {
        // Split text into chunks of 10 characters for testing
        for (let i = 0; i < text.length; i += 10) {
          yield text.slice(i, i + 10);
        }
      }),
    };

    embeddingLoader = new EmbeddingLoader(mockModel);
  });

  it("should process string content and generate embeddings for each chunk", async () => {
    const inputDoc: IDocument = {
      content: "This is a test document for embedding processing",
      metadata: { source: "test" },
    };

    const processedDocs: IDocument[] = [];
    
    embeddingLoader.on(LoaderEvent.PROCESSED, (doc) => {
      processedDocs.push(doc);
    });

    await new Promise<void>((resolve) => {
      embeddingLoader.on(LoaderEvent.COMPLETED, () => {
        resolve();
      });
      
      embeddingLoader.write(inputDoc);
      embeddingLoader.end();
    });

    // Should have processed multiple chunks
    expect(processedDocs.length).toBeGreaterThan(0);
    
    // Verify each processed document
    for (const doc of processedDocs) {
      expect(doc.content).toBeTypeOf("string");
      expect(doc.metadata).toEqual({ source: "test" });
      expect(doc.vector).toEqual([0.1, 0.2, 0.3]);
    }

    // Verify model.chunks was called with the input content
    expect(mockModel.chunks).toHaveBeenCalledWith(inputDoc.content);
    
    // Verify model.embed was called for each chunk
    expect(mockModel.embed).toHaveBeenCalledTimes(processedDocs.length);
  });

  it("should skip documents with non-string content", async () => {
    const inputDoc: IDocument = {
      content: { some: "object" } as any,
      metadata: { source: "test" },
    };

    const skippedDoc = await new Promise<IDocument>((resolve) => {
      embeddingLoader.once(LoaderEvent.SKIPPED, (doc) => resolve(doc));
      embeddingLoader.write(inputDoc);
    });

    expect(skippedDoc).toBe(inputDoc);
    expect(mockModel.chunks).not.toHaveBeenCalled();
    expect(mockModel.embed).not.toHaveBeenCalled();
  });

  it("should handle empty string content", async () => {
    const inputDoc: IDocument = {
      content: "",
      metadata: { source: "test" },
    };

    await new Promise<void>((resolve) => {
      embeddingLoader.on(LoaderEvent.COMPLETED, () => {
        resolve();
      });
      
      embeddingLoader.write(inputDoc);
      embeddingLoader.end();
    });

    // Should have called chunks but not necessarily embed if no chunks were produced
    expect(mockModel.chunks).toHaveBeenCalledWith("");
  });

  it("should handle errors during embedding", async () => {
    // Mock embed to throw an error
    mockModel.embed = vi.fn().mockRejectedValue(new Error("Embedding failed"));
    
    const inputDoc: IDocument = {
      content: "This will fail to embed",
      metadata: { source: "test" },
    };

    const errorEvent = await new Promise<any>((resolve) => {
      embeddingLoader.once(LoaderEvent.ERROR, (error) => resolve(error));
      embeddingLoader.write(inputDoc);
    });

    expect(errorEvent).toBeDefined();
    expect(errorEvent.doc).toBeDefined();
    expect(errorEvent.error).toBeDefined();
    expect(errorEvent.error.message).toContain("Embedding failed");
  });

  it("should emit received and completed events", async () => {
    const inputDoc: IDocument = {
      content: "Test document",
      metadata: { source: "test" },
    };

    const events: string[] = [];
    
    embeddingLoader.on(LoaderEvent.RECEIVED, () => events.push("received"));
    embeddingLoader.on(LoaderEvent.PROCESSED, () => events.push("processed"));
    embeddingLoader.on(LoaderEvent.COMPLETED, () => events.push("completed"));

    await new Promise<void>((resolve) => {
      embeddingLoader.on(LoaderEvent.COMPLETED, () => {
        resolve();
      });
      
      embeddingLoader.write(inputDoc);
      embeddingLoader.end();
    });

    expect(events).toContain("received");
    expect(events).toContain("processed");
    expect(events).toContain("completed");
  });
});
