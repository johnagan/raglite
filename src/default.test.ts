import { describe, it, beforeAll, expect } from "vitest";
import { load, search } from "./default.js";

export const PDF_URL =
  "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
export const DOCX_URL = "https://calibre-ebook.com/downloads/demos/demo.docx";

let pdfBuffer: Buffer;
let docxBuffer: Buffer;

beforeAll(async () => {
  // Download PDF and DOCX files as buffers
  const pdfResponse = await fetch(PDF_URL);
  const pdfArrayBuffer = await pdfResponse.arrayBuffer();
  pdfBuffer = Buffer.from(pdfArrayBuffer);

  const docxResponse = await fetch(DOCX_URL);
  const docxArrayBuffer = await docxResponse.arrayBuffer();
  docxBuffer = Buffer.from(docxArrayBuffer);
});

describe("default pipeline", () => {
  it("should load a PDF from URL", async () => {
    const results = await load(PDF_URL);
    expect(results).toBeDefined();
    expect(results.length).toBe(1);
    expect(results[0].content).not.toBe(PDF_URL);
    expect(results[0].content).toContain("Dummy PDF file");
    expect(results[0].metadata).toBeDefined();
    expect(results[0].metadata.url).toBe(PDF_URL);
    expect(results[0].vector).toBeDefined();
  });

  it("should load a DOCX from URL", async () => {
    const results = await load(DOCX_URL);
    expect(results).toBeDefined();
    expect(results.length).toBeGreaterThan(1);
    expect(results[0].content).toBeDefined();
    expect(results[0].content).not.toBe(DOCX_URL);
    expect(results[0].metadata).toBeDefined();
    expect(results[0].metadata.url).toBe(DOCX_URL);
    expect(results[0].vector).toBeDefined();
  });

  it("should load a PDF from buffer", async () => {
    const results = await load(pdfBuffer);
    expect(results).toBeDefined();
    expect(results.length).toBe(1);
    expect(results[0].content).not.toBe(pdfBuffer);
    expect(results[0].content).toContain("Dummy PDF file");
    expect(results[0].metadata).toBeDefined();
    expect(results[0].vector).toBeDefined();
  });

  it("should load a DOCX from buffer", async () => {
    const results = await load(docxBuffer);
    expect(results).toBeDefined();
    expect(results.length).toBeGreaterThan(1);
    expect(results[0].content).toBeDefined();
    expect(results[0].content).not.toBe(docxBuffer);
    expect(results[0].metadata).toBeDefined();
    expect(results[0].vector).toBeDefined();
  });

  it("should perform a search", async () => {
    const record = await load(pdfBuffer);
    const results = await search("dummy");

    expect(results).toBeDefined();
    expect(results.length).toBeGreaterThan(0);
  });
});
