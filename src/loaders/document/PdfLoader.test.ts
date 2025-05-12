import { describe, beforeAll, it, expect } from "vitest";
import { PdfLoader } from "@root/loaders/document/PdfLoader";

export const TEST_FILE_URL = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

describe("PdfLoader", () => {
  let pdfLoader: PdfLoader;
  let pdfBuffer: Buffer;

  beforeAll(async () => {
    pdfLoader = new PdfLoader();
    // Download the DOCX file as a buffer
    const response = await fetch(TEST_FILE_URL);
    const arrayBuffer = await response.arrayBuffer();
    pdfBuffer = Buffer.from(arrayBuffer);
  });

  it("should detect a PDF file with test()", async () => {
    expect(await pdfLoader.test(pdfBuffer)).toBe(true);
  });

  it("should not detect a non-PDF file with test()", async () => {
    const fakeBuffer = Buffer.from("not a pdf file");
    expect(await pdfLoader.test(fakeBuffer)).toBe(false);
  });

  it("should extract text content from a PDF file", async () => {
    const docs = await pdfLoader.loadDocuments(pdfBuffer);
    expect(Array.isArray(docs)).toBe(true);
    expect(docs.length).toBe(1);
    expect(typeof docs[0].content).toBe("string");
    expect(docs[0].content.length).toBeGreaterThan(0);
  });

  it("should attach metadata if provided", async () => {
    const metadata = { foo: "bar" };
    const docs = await pdfLoader.loadDocuments(pdfBuffer, metadata);
    expect(docs[0].metadata).toMatchObject(metadata);
  });
});
