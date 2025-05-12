import { describe, it, expect } from "vitest";
import { ContentLoader } from "./ContentLoader";

describe("ContentLoader", () => {
  const loader = new ContentLoader();

  it("should detect string input in test()", () => {
    expect(loader.test("hello world")).toBe(true);
    expect(loader.test(Buffer.from("hello"))).toBe(false);
  });

  it("should transform string input into a document", async () => {
    const data = {
      input: "test content",
      metadata: { foo: "bar" },
      documents: [],
    };
    const result = await loader.transform(data);
    expect(result.documents).toHaveLength(1);
    expect(result.documents?.[0].content).toBe("test content");
    expect(result.documents?.[0].metadata).toEqual({ foo: "bar" });
  });
});
