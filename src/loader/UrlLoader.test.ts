import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { type IDocument, type ILoaderError, LoaderEvents } from "../core";
import { UrlLoader } from "./UrlLoader";

describe("UrlLoader", () => {
  const TEST_URL = "https://example.com/test.txt";
  const TEST_BUFFER = Buffer.from("hello world");
  const TEST_TEXT = "hello text!";

  let urlLoader: UrlLoader;

  beforeEach(() => {
    urlLoader = new UrlLoader();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch a URL and save it in metadata", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: vi.fn().mockResolvedValue(TEST_BUFFER),
      headers: { get: vi.fn().mockReturnValue("application/octet-stream") },
    }) as any;

    const inputDoc: IDocument = { content: TEST_URL, metadata: {} };

    const result: IDocument = await new Promise((resolve) => {
      urlLoader.once(LoaderEvents.PROCESSED, (output) => resolve(output));
      urlLoader.write(inputDoc);
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(TEST_URL, undefined);
    expect(result).toBeDefined();

    const buffer = result.content as Buffer;
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.equals(TEST_BUFFER)).toBe(true);
    expect(result.metadata.url).toBe(TEST_URL);
  });

  it("should merge existing metadata with url", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: vi.fn().mockReturnValue("text/plain") },
      text: vi.fn().mockResolvedValue(TEST_TEXT),
    }) as any;

    const inputDoc: IDocument = { content: TEST_URL, metadata: { foo: "bar" } };

    const result: IDocument = await new Promise((resolve) => {
      urlLoader.once(LoaderEvents.PROCESSED, (output) => resolve(output));
      urlLoader.write(inputDoc);
    });

    expect(result.metadata.foo).toBe("bar");
    expect(result.metadata.url).toBe(TEST_URL);
  });

  it("should process text content-type and return a string", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: vi.fn().mockReturnValue("text/plain") },
      text: vi.fn().mockResolvedValue(TEST_TEXT),
    }) as any;

    const TEST_TEXT_URL = "https://example.com/text.txt";
    const inputDoc: IDocument = { content: TEST_TEXT_URL, metadata: {} };
    const result: IDocument = await new Promise((resolve) => {
      urlLoader.once(LoaderEvents.PROCESSED, (output) => resolve(output));
      urlLoader.write(inputDoc);
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(TEST_TEXT_URL, undefined);
    expect(typeof result.content).toBe("string");
    expect(result.content).toBe(TEST_TEXT);
  });

  it("should process binary content-type and return a Buffer", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: vi.fn().mockResolvedValue(TEST_BUFFER),
      headers: { get: vi.fn().mockReturnValue("application/octet-stream") },
    }) as any;

    const TEST_BINARY_URL = "https://example.com/binary.bin";
    const inputDoc: IDocument = { content: TEST_BINARY_URL, metadata: {} };
    const result: IDocument = await new Promise((resolve) => {
      urlLoader.once(LoaderEvents.PROCESSED, (output) => resolve(output));
      urlLoader.write(inputDoc);
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(TEST_BINARY_URL, undefined);
    expect(Buffer.isBuffer(result.content)).toBe(true);
    expect((result.content as Buffer).equals(TEST_BUFFER)).toBe(true);
  });

  it("should handle errors and emit error event", async () => {
    const errorMessage = "Network error";
    globalThis.fetch = vi.fn().mockRejectedValue(new Error(errorMessage));

    const TEST_ERROR_URL = "https://example.com/error";
    const inputDoc: IDocument = { content: TEST_ERROR_URL, metadata: {} };

    const result: ILoaderError = await new Promise((resolve) => {
      urlLoader.once(LoaderEvents.ERROR, (output) => resolve(output));
      urlLoader.write(inputDoc);
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(TEST_ERROR_URL, undefined);
    expect(result.doc).toEqual(inputDoc);
    expect(result.error).toEqual(new Error(errorMessage));
  });

  it("should handle non-ok responses and emit error event", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    }) as any;

    const TEST_404_URL = "https://example.com/notfound";
    const inputDoc: IDocument = { content: TEST_404_URL, metadata: {} };

    const result: ILoaderError = await new Promise((resolve) => {
      urlLoader.once(LoaderEvents.ERROR, (output) => resolve(output));
      urlLoader.write(inputDoc);
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(TEST_404_URL, undefined);
    expect(result.doc).toEqual(inputDoc);
    expect(result.error).toEqual(
      new Error(`Failed to fetch URL: ${TEST_404_URL}`),
    );
  });
});
