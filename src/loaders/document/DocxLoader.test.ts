import { describe, beforeAll, it, expect } from "vitest";
import { DocxLoader } from "@root/loaders/document/DocxLoader";

export const TEST_FILE_URL = "https://calibre-ebook.com/downloads/demos/demo.docx";

describe("DocxLoader", () => {
  let docxBuffer: Buffer;
  let docxLoader: DocxLoader;

  beforeAll(async () => {
    docxLoader = new DocxLoader();

    // Download the DOCX file as a buffer
    const response = await fetch(TEST_FILE_URL);
    const arrayBuffer = await response.arrayBuffer();
    docxBuffer = Buffer.from(arrayBuffer);
  });

  it("should detect a DOCX file with test()", async () => {
    expect(await docxLoader.test(docxBuffer)).toBe(true);
  });

  it("should not detect a non-DOCX file with test()", async () => {
    const fakeBuffer = Buffer.from("not a docx file");
    expect(await docxLoader.test(fakeBuffer)).toBe(false);
  });

  it("should extract text content from a DOCX file", async () => {
    const docs = await docxLoader.loadDocuments(docxBuffer);
    expect(Array.isArray(docs)).toBe(true);
    expect(docs.length).toBe(1);
    expect(typeof docs[0].content).toBe("string");
    expect(docs[0].content.length).toBeGreaterThan(0);
  });

  it("should attach metadata if provided", async () => {
    const metadata = { foo: "bar" };
    const docs = await docxLoader.loadDocuments(docxBuffer, metadata);
    expect(docs[0].metadata).toMatchObject(metadata);
  });
});
