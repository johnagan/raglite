vi.mock("node:fs", () => ({
  default: {
    readFileSync: vi.fn(() => Buffer.from("file content")),
  },
}));

import { describe, it, expect, vi, beforeEach } from "vitest";
import { BaseLoader, LoaderInput } from "./BaseLoader";
import { Document } from "./index";
import fs from "node:fs";

// Minimal subclass for testing
class TestLoader extends BaseLoader {
  test(input: LoaderInput): boolean {
    return true;
  }
  async loadDocuments(buffer: Buffer, metadata: Record<string, any>): Promise<Document[]> {
    return [{ content: buffer.toString(), metadata }];
  }
}

describe("BaseLoader", () => {
  it("throws on test and loadDocuments if not implemented", async () => {
    const loader = new BaseLoader();
    expect(() => loader.test(Buffer.from("test"))).toThrow("Not implemented");
    await expect(loader.loadDocuments(Buffer.from("test"))).rejects.toThrow("Not implemented");
  });

  describe("load", () => {
    let loader: TestLoader;

    beforeEach(() => {
      loader = new TestLoader();
    });

    it("routes to loadFromPath for string path", async () => {
      const spy = vi.spyOn(loader, "loadFromPath").mockResolvedValue([{ content: "ok", metadata: {} }]);
      await loader.load("some/path.txt");
      expect(spy).toHaveBeenCalledWith("some/path.txt", {});
      spy.mockRestore();
    });

    it("routes to loadFromUrl for string url", async () => {
      const spy = vi.spyOn(loader, "loadFromUrl").mockResolvedValue([{ content: "ok", metadata: {} }]);
      await loader.load("http://example.com/file.txt");
      expect(spy).toHaveBeenCalledWith("http://example.com/file.txt", {});
      spy.mockRestore();
    });

    it("routes to loadFromBuffer for Buffer", async () => {
      const spy = vi.spyOn(loader, "loadFromBuffer").mockResolvedValue([{ content: "ok", metadata: {} }]);
      await loader.load(Buffer.from("test"));
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe("loadFromPath", () => {
    it("reads file and calls loadFromBuffer", async () => {
      const loader = new TestLoader();
      const loadFromBufferSpy = vi.spyOn(loader, "loadFromBuffer").mockResolvedValue([{ content: "ok", metadata: {} }]);
      await loader.loadFromPath("some/path.txt");
      expect(fs.readFileSync).toHaveBeenCalledWith("some/path.txt");
      expect(loadFromBufferSpy).toHaveBeenCalled();
      loadFromBufferSpy.mockRestore();
    });
  });

  describe("loadFromUrl", () => {
    it("fetches url and calls loadFromBuffer", async () => {
      const loader = new TestLoader();
      const fakeBuffer = Buffer.from("url content");
      // @ts-ignore
      global.fetch = vi.fn().mockResolvedValue({
        arrayBuffer: () => Promise.resolve(fakeBuffer),
      });
      const loadFromBufferSpy = vi.spyOn(loader, "loadFromBuffer").mockResolvedValue([{ content: "ok", metadata: {} }]);
      await loader.loadFromUrl("http://example.com/file.txt");
      expect(global.fetch).toHaveBeenCalledWith("http://example.com/file.txt");
      expect(loadFromBufferSpy).toHaveBeenCalled();
      // @ts-ignore
      delete global.fetch;
      loadFromBufferSpy.mockRestore();
    });
  });
});
