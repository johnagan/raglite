import { describe, beforeAll, it, expect } from "vitest";
import { type IDocument, type ILoaderError, LoaderEvents } from "../core";
import { DocxLoader } from "./DocxLoader";

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

    const result: IDocument = await new Promise((resolve) => {
      docxLoader.once(LoaderEvents.SKIPPED, (output) => resolve(output));
      docxLoader.write({ content: fakeBuffer });
    });

    expect(result).toBeDefined();
    expect(Buffer.isBuffer(result.content)).toBe(true);
  });

  it("should load a PDF file without metadata", async () => {
    const result: IDocument = await new Promise((resolve) => {
      docxLoader.once(LoaderEvents.PROCESSED, (output) => resolve(output));
      docxLoader.write({ content: docxBuffer });
    });

    expect(result).toBeDefined();
    expect(result.content).toContain("Demonstration of DOCX support");
    expect(result.metadata).toBeDefined();
  });

  it("should attach metadata if provided", async () => {
    const metadata = { foo: "bar" };

    const result: IDocument = await new Promise((resolve) => {
      docxLoader.once(LoaderEvents.PROCESSED, (output) => resolve(output));
      docxLoader.write({ content: docxBuffer, metadata });
    });

    expect(result).toBeDefined();
    expect(result.content).toContain("Demonstration of DOCX support");
    expect(result.metadata.foo).toEqual("bar");
  });

  it("should handle errors", async () => {
    const result: ILoaderError = await new Promise((resolve) => {
      docxLoader.once(LoaderEvents.ERROR, (output) => resolve(output));
      docxLoader.write({ content: invalidBuffer });
    });

    expect(result).toBeDefined();
  });
});
