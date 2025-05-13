import { describe, beforeAll, it, expect } from "vitest";
import { DocxLoader } from "./DocxLoader";
import { LoaderDocument } from "../core/LoaderDocument.ts";

export const TEST_FILE_URL = "https://calibre-ebook.com/downloads/demos/demo.docx";

describe("DocxLoader", () => {
  let docxLoader: DocxLoader;
  let docxBuffer: Buffer;

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

    const result: LoaderDocument = await new Promise((resolve) => {
      docxLoader.once("data", (output) => resolve(output));
      docxLoader.write({ content: fakeBuffer });
    });

    expect(result).toBeDefined();
    expect(Buffer.isBuffer(result.content)).toBe(true);
  });

  it("should load a PDF file without metadata", async () => {
    const result: LoaderDocument = await new Promise((resolve) => {
      docxLoader.once("data", (output) => resolve(output));
      docxLoader.write({ content: docxBuffer });
    });

    expect(result).toBeDefined();
    expect(result.content).toContain("Demonstration of DOCX support");
    expect(result.metadata).toBeDefined();
  });

  it("should attach metadata if provided", async () => {
    const metadata = { foo: "bar" };

    const result: LoaderDocument = await new Promise((resolve) => {
      docxLoader.once("data", (output) => resolve(output));
      docxLoader.write({ content: docxBuffer, metadata });
    });

    expect(result).toBeDefined();
    expect(result.content).toContain("Demonstration of DOCX support");
    expect(result.metadata.foo).toEqual("bar");
  });
});
