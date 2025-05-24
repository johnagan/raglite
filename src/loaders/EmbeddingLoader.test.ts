import { describe, it, expect, beforeEach, afterEach, vi, Mock } from "vitest";
import { LoaderEvent, type IDocument } from "../core/index.js";
import { EmbeddingLoader } from "./EmbeddingLoader.js";

describe(
  "EmbeddingLoader",
  {
    timeout: 10000,
  },
  async () => {
    const metadata = { title: "Test Document" };
    const content = "Hello, world!";
    const doc: IDocument = { content, metadata };

    let loader: EmbeddingLoader;
    let completedSpy: Mock;
    let processedSpy: Mock;
    let receivedSpy: Mock;
    let skippedSpy: Mock;
    let errorSpy: Mock;

    beforeEach(async () => {
      completedSpy = vi.fn();
      processedSpy = vi.fn();
      receivedSpy = vi.fn();
      skippedSpy = vi.fn();
      errorSpy = vi.fn();

      loader = new EmbeddingLoader();
      loader.on(LoaderEvent.PROCESSED, processedSpy);
      loader.on(LoaderEvent.COMPLETED, completedSpy);
      loader.on(LoaderEvent.RECEIVED, receivedSpy);
      loader.on(LoaderEvent.SKIPPED, skippedSpy);
      loader.on(LoaderEvent.ERROR, errorSpy);
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it("should skip if content isn't a string", async () => {
      const binaryDoc: IDocument = {
        content: Buffer.from("not a string"),
        metadata,
      };

      await new Promise<void>((resolve) => {
        loader.write(binaryDoc, () => resolve());
      });

      expect(skippedSpy).toHaveBeenCalledWith(binaryDoc);
      expect(processedSpy).not.toHaveBeenCalled();
    });

    it("should embed a document", async () => {
      const processed = await new Promise<IDocument>((resolve) => {
        loader.on(LoaderEvent.PROCESSED, (doc) => resolve(doc));
        loader.write(doc);
      });

      expect(receivedSpy).toHaveBeenCalledWith(doc);
      expect(processedSpy).toHaveBeenCalledWith(processed);
      expect(processed.vector).toBeDefined();
    });
  }
);
