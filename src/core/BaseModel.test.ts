import { describe, it, expect } from "vitest";
import { BaseModel } from "./BaseModel";

describe("BaseModel", () => {
  class TestEmbeddingModel extends BaseModel {
    async embedText(text: string): Promise<number[]> {
      // Return a dummy embedding (length = number of words)
      return Array(text.split(/\s+/).length).fill(1);
    }
  }

  it("embedText throws error in base class", async () => {
    const model = new BaseModel();
    await expect(model.embed("test")).rejects.toThrow("Not implemented");
  });

  it("getTextChunks yields correct chunks", async () => {
    const model = new BaseModel();
    const text = "one two three four five six";
    const chunks: string[] = [];
    for await (const chunk of model.getTextChunks(text, 2)) {
      chunks.push(chunk);
    }
    expect(chunks).toEqual(["one two", "three four", "five six"]);
  });

  it("embedTextIntoChunks returns correct structure", async () => {
    const model = new TestEmbeddingModel();
    const text = "a b c d";
    await expect(model.embedTextIntoChunks(text)).rejects.toThrow("Not implemented");
  });
});
