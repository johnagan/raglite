import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { UrlLoader } from "./UrlLoader";

describe("UrlLoader", () => {
  let loader: UrlLoader;

  beforeEach(() => {
    loader = new UrlLoader();
  });

  describe("test", () => {
    it("returns true for valid http/https URLs", () => {
      expect(loader.test("http://example.com")).toBe(true);
      expect(loader.test("https://example.com")).toBe(true);
    });

    it("returns false for non-URL strings", () => {
      expect(loader.test("ftp://example.com")).toBe(false);
      expect(loader.test("/local/path")).toBe(false);
      expect(loader.test(123 as any)).toBe(false);
      expect(loader.test({} as any)).toBe(false);
    });
  });

  describe("transform", () => {
    const mockBuffer = Buffer.from("test data");

    beforeEach(() => {
      // @ts-ignore
      global.fetch = vi.fn().mockResolvedValue({
        arrayBuffer: vi.fn().mockResolvedValue(mockBuffer),
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("fetches the URL and sets data.input to a Buffer", async () => {
      const data = { input: "https://example.com" };
      const result = await loader.transform(data);
      expect(global.fetch).toHaveBeenCalledWith("https://example.com");
      expect(result.input).toEqual(mockBuffer);
    });
  });
});
