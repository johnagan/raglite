import { describe, it, expect, vi } from "vitest";
import { OpenAIModel } from "@root/models";
import { OpenAI } from "openai";

const apiKey = process.env.OPENAI_API_KEY!;

describe("OpenAIModel", async () => {
  it("should throw if apiKey is not provided", () => {
    expect(() => new OpenAIModel({ apiKey: "" })).toThrow();
  });

  it("should set options and create OpenAI instance", () => {
    const model = new OpenAIModel({ apiKey });
    expect(model.options.apiKey).toBe(apiKey);
    expect(model.client).toBeInstanceOf(OpenAI);
  });

  it("should call OpenAI embeddings.create with correct arguments", async () => {
    const model = new OpenAIModel({ apiKey });

    // Spy on embeddings.create
    model.client.embeddings.create = vi.fn().mockResolvedValue({ data: [{ embedding: [0.1, 0.2, 0.3] }] });

    await model.embed("hello world");
    expect(model.client.embeddings.create).toHaveBeenCalledWith({
      model: "text-embedding-3-small",
      input: "hello world",
    });
  });

  it("should default model to text-embedding-3-small", () => {
    const model = new OpenAIModel({ apiKey });
    expect(model.options.model).toBe("text-embedding-3-small");
  });

  it("embedText calls OpenAI embeddings.create and returns embedding", async () => {
    const model = new OpenAIModel({ apiKey });
    const result = await model.embed("hello world");
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });
});
