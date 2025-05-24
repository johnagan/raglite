import { describe, it, expect, beforeEach, vi, afterEach, Mock } from "vitest";
import { LoaderEvent, type IDocument } from "../core/index.js";
import { FileLoader } from "./FileLoader.js";
import * as fs from "node:fs";

vi.mock("node:fs", () => ({
  existsSync: vi.fn(),
  statSync: vi.fn(),
  readFileSync: vi.fn(),
}));

describe("FileLoader", () => {
  const metadata = { title: "Test Document" };
  const filePath = "/tmp/test.txt";
  const fileName = filePath.split("/").pop();
  const content = "Hello, world!";

  let loader: FileLoader;
  let completedSpy: Mock;
  let processedSpy: Mock;
  let receivedSpy: Mock;
  let skippedSpy: Mock;
  let errorSpy: Mock;

  beforeEach(() => {
    // Mock fs
    vi.spyOn(fs, "existsSync").mockImplementation((v) => v === filePath);
    vi.spyOn(fs, "readFileSync").mockReturnValue(content);
    vi.spyOn(fs, "statSync").mockReturnValue({
      isFile: () => true,
      isDirectory: () => false,
    } as any);

    completedSpy = vi.fn();
    processedSpy = vi.fn();
    receivedSpy = vi.fn();
    skippedSpy = vi.fn();
    errorSpy = vi.fn();

    loader = new FileLoader();
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
    it("should process a file path", async () => {
      const fileDoc: IDocument = { content: filePath, metadata };

      await new Promise<void>((resolve) => {
        loader.write(fileDoc, () => resolve());
      });

      expect(processedSpy).toHaveBeenCalledWith({
        content: content,
        metadata: { fileName, ...metadata },
      });
    });

    it("should skip if content isn't a file path", async () => {
      const textDoc: IDocument = { content: "not a file path", metadata };

      await new Promise<void>((resolve) => {
        loader.write(textDoc, () => resolve());
      });

      expect(skippedSpy).toHaveBeenCalledWith(textDoc);
      expect(processedSpy).not.toHaveBeenCalled();
    });

    it("should skip if file doesn't exist", async () => {
      const nonExistentDoc: IDocument = {
        content: "/tmp/non-existent.txt",
        metadata,
      };

      await new Promise<void>((resolve) => {
        loader.write(nonExistentDoc, () => resolve());
      });

      expect(skippedSpy).toHaveBeenCalledWith(nonExistentDoc);
      expect(processedSpy).not.toHaveBeenCalled();
    });

    it("should skip if file is a directory", async () => {
      const directoryDoc: IDocument = { content: "/tmp", metadata };

      await new Promise<void>((resolve) => {
        loader.write(directoryDoc, () => resolve());
      });

      expect(skippedSpy).toHaveBeenCalledWith(directoryDoc);
      expect(processedSpy).not.toHaveBeenCalled();
    });

    it("should handle errors and emit error event", async () => {
      const errorDoc: IDocument = { content: filePath, metadata };

      // Mock console.error to avoid test output noise
      vi.spyOn(console, "error").mockImplementation(() => {});

      // Mock readFileSync to throw an error
      vi.spyOn(fs, "readFileSync").mockImplementation(() => {
        throw new Error("Test error");
      });

      await new Promise<void>((resolve) => {
        loader.write(errorDoc, () => resolve());
      });

      expect(errorSpy).toHaveBeenCalledWith({
        doc: errorDoc,
        error: new Error("Test error"),
      });
    });
  });
});
