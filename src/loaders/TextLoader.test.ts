import { describe, it, expect, vi } from "vitest";
import type { LoaderDocument } from "../types";
import { TextLoader } from "./TextLoader";
import { Buffer } from "buffer";
import type { Stats } from "fs";

const mockFilePath = "/mock/file.txt";
const mockFileContent = "file content";
const mockUrl = "http://example.com/file.txt";
const mockUrlContent = "url content";

// Mock fs at the top level
vi.mock("fs", () => ({
  readFileSync: (path: any) => {
    if (path === mockFilePath) return Buffer.from(mockFileContent);
    throw new Error("File not found");
  },
  existsSync: (path: any) => path === mockFilePath,
  statSync: (path: any) =>
    ({
      isFile: () => path === mockFilePath,
    } as Stats),
}));

// Mock fetch for URL
// @ts-ignore
global.fetch = vi.fn().mockResolvedValue({
  arrayBuffer: () => Promise.resolve(Buffer.from(mockUrlContent)),
});

describe("InputLoader", () => {
  it("should emit LoaderData when input is a Buffer", async () => {
    const content = Buffer.from("buffer content");
    const metadata = { foo: "bar" };

    const loader = new TextLoader({ content, metadata });

    const result: LoaderDocument = await new Promise((resolve) => {
      loader.on("data", (output) => resolve(output));
    });

    expect(result).toBeDefined();
    expect(result.content).toBe(content);
    expect(result.metadata).toEqual(metadata);
  });

  it("should emit LoaderData when input is a file path", async () => {
    const metadata = { foo: "bar" };
    const content = mockFilePath;

    const loader = new TextLoader({ content, metadata });

    const result: LoaderDocument = await new Promise((resolve) => {
      loader.on("data", (output) => resolve(output));
    });

    expect(result).toBeDefined();
    expect(Buffer.isBuffer(result.content)).toBe(true);
    expect(result.metadata).toEqual(metadata);
  });

  it("should emit LoaderData when input is a URL", async () => {
    const metadata = { foo: "bar" };
    const content = mockUrl;

    const loader = new TextLoader({ content, metadata });

    const result: LoaderDocument = await new Promise((resolve) => {
      loader.on("data", (output) => resolve(output));
    });

    expect(result).toBeDefined();
    expect(Buffer.isBuffer(result.content)).toBe(true);
    expect(result.metadata).toEqual(metadata);
  });

  it("should emit a document when input is a string (inline content)", async () => {
    const metadata = { foo: "bar" };
    const content = "inline content";

    const loader = new TextLoader({ content, metadata });

    const result: LoaderDocument = await new Promise((resolve) => {
      loader.on("data", (output) => resolve(output));
    });

    expect(result).toBeDefined();
    expect(result.content).toBe(content);
    expect(result.metadata).toEqual(metadata);
  });
});
