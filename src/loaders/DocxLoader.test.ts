import { describe, beforeAll, beforeEach, it, expect, vi } from "vitest";
import {
  type IDocument,
  LoaderEvent,
  type ILoaderErrorEvent,
} from "../core/index.js";
import { DocxLoader } from "./DocxLoader.js";

export const TEST_FILE_URL =
  "https://calibre-ebook.com/downloads/demos/demo.docx";

describe("DocxLoader", () => {
  let docxLoader: DocxLoader;
  let docxBuffer: Buffer;

  // a fake DOCX buffer that has the correct magic bytes but is invalid
  const invalidBuffer = Buffer.concat([
    Buffer.from("504b0304", "hex"), // DOCX magic bytes
    Buffer.from("invalid docx content"),
  ]);

  beforeAll(async () => {
    const response = await fetch(TEST_FILE_URL);
    const arrayBuffer = await response.arrayBuffer();
    docxBuffer = Buffer.from(arrayBuffer);
  });

  beforeEach(async () => {
    docxLoader = new DocxLoader();
  });

  it("should ignore non-PDF files", async () => {
    const fakeBuffer = Buffer.from("not a docx file");

    const result = await new Promise<IDocument>((resolve) => {
      docxLoader.once(LoaderEvent.SKIPPED, (output) => resolve(output));
      docxLoader.write({ content: fakeBuffer });
    });

    expect(result).toBeDefined();
    expect(Buffer.isBuffer(result.content)).toBe(true);
  });

  it("should load a PDF file without metadata", async () => {
    const result = await new Promise<IDocument>((resolve) => {
      docxLoader.once(LoaderEvent.PROCESSED, (output) => resolve(output));
      docxLoader.write({ content: docxBuffer });
    });

    expect(result).toBeDefined();
    expect(result.content).toContain("Demonstration of DOCX support");
    expect(result.metadata).toBeDefined();
  });

  it("should attach metadata if provided", async () => {
    const metadata = { foo: "bar" };

    const result = await new Promise<IDocument>((resolve) => {
      docxLoader.once(LoaderEvent.PROCESSED, (output) => resolve(output));
      docxLoader.write({ content: docxBuffer, metadata });
    });

    expect(result).toBeDefined();
    expect(result.content).toContain("Demonstration of DOCX support");
    expect(result.metadata.foo).toEqual("bar");
  });

  it("should handle errors", async () => {
    console.error = vi.fn(); // Suppress error output

    const result: ILoaderErrorEvent = await new Promise((resolve) => {
      docxLoader.once(LoaderEvent.ERROR, (output) => resolve(output));
      docxLoader.write({ content: invalidBuffer });
    });

    expect(result).toBeDefined();
  });
});
