import { describe, it, expect, beforeEach, vi } from "vitest";
import { Loader, LoaderEvent, type ILoaderCallback } from "./Loader";
import { type IDocument, DocumentSchema } from "../core";

describe("Loader", () => {
  let loader: Loader;

  beforeEach(() => {
    loader = new Loader();
    loader._transform = (
      doc: IDocument,
      encoding: BufferEncoding,
      callback: ILoaderCallback,
    ) => {
      callback();
    };
  });

  describe("Base functionality", () => {
    it("should initialize with empty arrays", () => {
      expect(loader.processed).toEqual([]);
      expect(loader.received).toEqual([]);
      expect(loader.skipped).toEqual([]);
      expect(loader.errors).toEqual([]);
    });

    it("should accept options in constructor", () => {
      const testFn = vi.fn();
      const transformFn = vi.fn();
      const flushFn = vi.fn();

      const customLoader = new Loader({
        test: testFn,
        transform: transformFn,
        flush: flushFn,
        objectMode: true,
      });

      expect(customLoader).toBeDefined();
      // We can't directly test private options, but we can test their effects later
    });
  });

  describe("_write", () => {
    it("should add document to received array and emit received event", async () => {
      const doc: IDocument = { content: "test", metadata: {} };
      const receivedSpy = vi.fn();

      const parseSpy = vi
        .spyOn(DocumentSchema, "parse")
        .mockImplementation(() => {
          return doc;
        });

      loader.on(LoaderEvent.RECEIVED, receivedSpy);

      await new Promise<void>((resolve) => {
        loader._write(doc, "utf-8", () => resolve());
      });

      expect(loader.received).toContain(doc);
      expect(receivedSpy).toHaveBeenCalledWith(doc);

      parseSpy.mockRestore();
    });

    it("should skip document if _test returns false", async () => {
      const doc: IDocument = { content: "test", metadata: {} };
      const skipSpy = vi.fn();

      // Override _test to return false
      vi.spyOn(loader, "_test").mockReturnValue(false);
      loader.on(LoaderEvent.SKIPPED, skipSpy);

      await new Promise<void>((resolve) => {
        loader._write(doc, "utf-8", () => resolve());
      });

      expect(loader.skipped).toContain(doc);
      expect(skipSpy).toHaveBeenCalledWith(doc);
    });

    it("should handle errors and emit error event", async () => {
      const doc: IDocument = { content: "test", metadata: {} };
      const errorSpy = vi.fn();
      const error = new Error("Test error");

      // Force an error by making DocumentSchema.parse throw
      const parseSpy = vi
        .spyOn(DocumentSchema, "parse")
        .mockImplementation(() => {
          throw error;
        });

      loader.on(LoaderEvent.ERROR, errorSpy);

      await new Promise<void>((resolve) => {
        loader._write(doc, "utf-8", () => resolve());
      });

      expect(loader.errors).toContain(doc);
      expect(errorSpy).toHaveBeenCalledWith({ doc, error });

      parseSpy.mockRestore();
    });
  });

  describe("process", () => {
    it("should add document to processed array and emit processed event", () => {
      const doc: IDocument = { content: "test", metadata: {} };
      const processedSpy = vi.fn();

      loader.on(LoaderEvent.PROCESSED, processedSpy);
      const result = loader.process(doc);

      expect(loader.processed).toContain(doc);
      expect(processedSpy).toHaveBeenCalledWith(doc);
      expect(result).toBeTruthy(); // Should return result of this.push(doc)
    });

    it("should handle null document", () => {
      const pushSpy = vi.spyOn(loader, "push");
      const result = loader.process(null as any);

      expect(result).toBeUndefined();
      expect(pushSpy).not.toHaveBeenCalled();
    });
  });

  describe("skip", () => {
    it("should add document to skipped array and emit skipped event", () => {
      const doc: IDocument = { content: "test", metadata: {} };
      const skippedSpy = vi.fn();

      loader.on(LoaderEvent.SKIPPED, skippedSpy);
      const result = loader.skip(doc);

      expect(loader.skipped).toContain(doc);
      expect(skippedSpy).toHaveBeenCalledWith(doc);
      expect(result).toBeTruthy(); // Should return result of this.push(doc)
    });
  });

  describe("error", () => {
    it("should add document to errors array and emit error event", () => {
      const doc: IDocument = { content: "test", metadata: {} };
      const error = new Error("Test error");
      const errorSpy = vi.fn();

      // Mock console.error to avoid test output noise
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      loader.on(LoaderEvent.ERROR, errorSpy);
      const result = loader.error(doc, error);

      expect(loader.errors).toContain(doc);
      expect(errorSpy).toHaveBeenCalledWith({ doc, error });
      expect(result).toBeTruthy(); // Should return result of this.push(doc)
      expect(consoleErrorSpy).toHaveBeenCalledWith(error);

      consoleErrorSpy.mockRestore();
    });
  });

  describe("_final", () => {
    it("should emit completed event with processed documents", () => {
      const doc1: IDocument = { content: "test1", metadata: {} };
      const doc2: IDocument = { content: "test2", metadata: {} };

      loader.processed = [doc1, doc2];

      const completedSpy = vi.fn();
      loader.on(LoaderEvent.COMPLETED, completedSpy);

      const callback = vi.fn();
      loader._final(callback);

      expect(completedSpy).toHaveBeenCalledWith([doc1, doc2]);
      expect(callback).toHaveBeenCalled();
    });
  });

  describe("_test", () => {
    it("should return true by default", () => {
      const doc: IDocument = { content: "test", metadata: {} };
      expect(loader._test(doc)).toBe(true);
    });

    it("should use test function from options if provided", () => {
      const testFn = vi.fn().mockReturnValue(false);
      const customLoader = new Loader({ test: testFn });

      const doc: IDocument = { content: "test", metadata: {} };
      const result = customLoader._test(doc);

      expect(testFn).toHaveBeenCalledWith(doc);
      expect(result).toBe(false);
    });
  });

  describe("Event handling", () => {
    it("should properly handle on, once, and emit methods", () => {
      const listener = vi.fn();
      const onceListener = vi.fn();

      loader.on("test-event", listener);
      loader.once("test-event", onceListener);

      loader.emit("test-event", "arg1", "arg2");
      loader.emit("test-event", "arg3", "arg4");

      expect(listener).toHaveBeenCalledTimes(2);
      expect(listener).toHaveBeenNthCalledWith(1, "arg1", "arg2");
      expect(listener).toHaveBeenNthCalledWith(2, "arg3", "arg4");

      expect(onceListener).toHaveBeenCalledTimes(1);
      expect(onceListener).toHaveBeenCalledWith("arg1", "arg2");
    });
  });

  describe("Custom transform", () => {
    it("should use custom transform function from options", async () => {
      const transformFn = vi.fn().mockImplementation(function (
        this: Loader,
        doc: IDocument,
        encoding: BufferEncoding,
        callback: ILoaderCallback,
      ) {
        this.process({ ...doc, content: "transformed" });
        callback();
      });

      const customLoader = new Loader({ transform: transformFn });
      const doc: IDocument = { content: "test", metadata: {} };

      const processedDoc = await new Promise<IDocument>((resolve) => {
        customLoader.on(LoaderEvent.PROCESSED, (doc) => resolve(doc));
        customLoader.write(doc);
      });

      expect(transformFn).toHaveBeenCalled();
      expect(processedDoc.content).toBe("transformed");
    });
  });

  describe("Integration tests", () => {
    it("should handle a complete document flow", async () => {
      const doc: IDocument = { content: "test", metadata: { source: "test" } };
      const events: string[] = [];

      loader.on(LoaderEvent.RECEIVED, () => events.push("received"));
      loader.on(LoaderEvent.PROCESSED, () => events.push("processed"));
      loader.on(LoaderEvent.COMPLETED, () => events.push("completed"));

      loader._transform = (
        doc: IDocument,
        encoding: BufferEncoding,
        callback: ILoaderCallback,
      ) => {
        loader.process(doc);
        callback();
      };

      await new Promise<void>((resolve) => {
        loader.on(LoaderEvent.COMPLETED, () => resolve());

        loader.write(doc);
        loader.end();
      });

      expect(events).toEqual(["received", "processed", "completed"]);
      expect(loader.received).toContain(doc);
      expect(loader.processed).toHaveLength(1);
      expect(loader.processed[0].content).toEqual(doc.content);
      expect(loader.processed[0].metadata).toEqual(doc.metadata);
    });

    it("should handle multiple documents", async () => {
      const doc1: IDocument = { content: "test1", metadata: { id: 1 } };
      const doc2: IDocument = { content: "test2", metadata: { id: 2 } };

      loader._transform = (
        doc: IDocument,
        encoding: BufferEncoding,
        callback: ILoaderCallback,
      ) => {
        loader.process(doc);
        callback();
      };

      await new Promise<void>((resolve) => {
        loader.on(LoaderEvent.COMPLETED, () => resolve());

        loader.write(doc1);
        loader.write(doc2);
        loader.end();
      });

      expect(loader.processed).toHaveLength(2);
      expect(loader.processed[0].content).toEqual(doc1.content);
      expect(loader.processed[0].metadata).toEqual(doc1.metadata);
      expect(loader.processed[1].content).toEqual(doc2.content);
      expect(loader.processed[1].metadata).toEqual(doc2.metadata);
    });
  });
});
