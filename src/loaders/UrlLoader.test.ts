import { describe, it, expect, beforeEach, vi, afterEach, Mock } from "vitest";
import { LoaderEvent, type IDocument } from "../core/index.js";
import { UrlLoader } from "./UrlLoader.js";

describe("UrlLoader", () => {
  const metadata = { title: "Test Document" };
  const url = "https://example.com";
  const content = "Hello, world!";
  const headers = {
    "content-type": "text/plain",
  };
  const inputDoc = { content: url, metadata };

  let loader: UrlLoader;
  let completedSpy: Mock;
  let processedSpy: Mock;
  let receivedSpy: Mock;
  let skippedSpy: Mock;
  let errorSpy: Mock;

  beforeEach(() => {
    // Mock fetch
    vi.spyOn(global, "fetch").mockResolvedValue({
      text: () => Promise.resolve(content),
      headers: new Headers(headers),
      ok: true,
    } as Response);

    completedSpy = vi.fn();
    processedSpy = vi.fn();
    receivedSpy = vi.fn();
    skippedSpy = vi.fn();
    errorSpy = vi.fn();

    loader = new UrlLoader();
    loader.on(LoaderEvent.PROCESSED, processedSpy);
    loader.on(LoaderEvent.COMPLETED, completedSpy);
    loader.on(LoaderEvent.RECEIVED, receivedSpy);
    loader.on(LoaderEvent.SKIPPED, skippedSpy);
    loader.on(LoaderEvent.ERROR, errorSpy);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("transform", () => {
    it("should load a URL string", async () => {
      await new Promise<void>((resolve) => {
        loader.write(inputDoc, () => resolve());
      });

      expect(processedSpy).toHaveBeenCalledWith({
        content,
        metadata: { url, headers, ...metadata },
      });
    });

    it("should append the url and headers to the metadata", async () => {
      const customMetadata = { customField: "value" };
      const docWithMetadata = { content: url, metadata: customMetadata };

      await new Promise<void>((resolve) => {
        loader.write(docWithMetadata, () => resolve());
      });

      expect(processedSpy).toHaveBeenCalledWith({
        content,
        metadata: {
          ...customMetadata,
          url,
          headers,
        },
      });
    });

    it("should skip non-URL strings", async () => {
      const nonUrlDoc = { content: "not a url", metadata: {} };

      await new Promise<void>((resolve) => {
        loader.write(nonUrlDoc, () => resolve());
      });

      expect(skippedSpy).toHaveBeenCalledWith(nonUrlDoc);
      expect(processedSpy).not.toHaveBeenCalled();
    });

    it("should skip buffer content", async () => {
      const bufferDoc = { content: Buffer.from("test data"), metadata: {} };

      await new Promise<void>((resolve) => {
        loader.write(bufferDoc, () => resolve());
      });

      expect(skippedSpy).toHaveBeenCalledWith(bufferDoc);
      expect(processedSpy).not.toHaveBeenCalled();
    });

    it("should handle errors and emit error event", async () => {
      const errorDoc: IDocument = { content: url, metadata };

      console.error = vi.fn(); // Suppress error output

      // Mock fetch to throw an error
      vi.spyOn(global, "fetch").mockResolvedValue({
        text: () => Promise.resolve(content),
        headers: new Headers(headers),
        ok: false,
      } as Response);

      await new Promise<void>((resolve) => {
        loader.write(errorDoc, () => resolve());
      });

      expect(errorSpy).toHaveBeenCalled();
      expect(processedSpy).not.toHaveBeenCalled();
    });
  });
});
