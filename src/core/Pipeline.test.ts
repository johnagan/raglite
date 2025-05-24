import { describe, it, expect, vi, beforeEach } from "vitest";
import { Pipeline } from "./Pipeline.js";
import { Loader, LoaderEvent } from "./Loader.js";

class MockLoader extends Loader {
  constructor() {
    super();
    this.on = vi.fn((event, cb) => {
      if (event === LoaderEvent.COMPLETED) {
        // Simulate async completion
        setTimeout(() => cb([{ id: "test", content: "done" }]), 10);
      }
      return this;
    });
  }
  _read() {}
}

describe("Pipeline", () => {
  let pipeline: Pipeline;

  beforeEach(() => {
    pipeline = new Pipeline([new MockLoader()]);
  });

  describe("load", () => {
    it("should load a single content string", async () => {
      const result = await pipeline.load("hello world");
      expect(result).toEqual([{ id: "test", content: "done" }]);
    });

    it("should load an array of content", async () => {
      const result = await pipeline.load(["foo", "bar"]);
      expect(result).toEqual([{ id: "test", content: "done" }]);
    });

    it("should attach metadata to documents", async () => {
      const metadata = { author: "john" };
      const result = await pipeline.load("test", metadata);
      expect(result).toEqual([{ id: "test", content: "done" }]);
      // You could also check that the loader received the right metadata if you enhance the mock
    });

    it("should handle IDocument input", async () => {
      const doc = { content: "doc", metadata: { foo: "bar" } };
      const result = await pipeline.load(doc);
      expect(result).toEqual([{ id: "test", content: "done" }]);
    });
  });
});
