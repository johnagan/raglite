import { describe, beforeAll, beforeEach, it, expect } from "vitest";
import { type IDocument, LoaderEvent } from "../core/index.js";
import { PdfLoader } from "./PdfLoader.js";

export const TEST_FILE_URL =
  "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

describe("PdfLoader", () => {
  let pdfLoader: PdfLoader;
  let pdfBuffer: Buffer;

  beforeAll(async () => {
    // Download the DOCX file as a buffer
    const response = await fetch(TEST_FILE_URL);
    const arrayBuffer = await response.arrayBuffer();
    pdfBuffer = Buffer.from(arrayBuffer);
  });

  beforeEach(async () => {
    pdfLoader = new PdfLoader();
  });

  it("should ignore non-PDF files", async () => {
    const fakeBuffer = Buffer.from("not a pdf file");

    const result = await new Promise<IDocument>((resolve) => {
      pdfLoader.once(LoaderEvent.SKIPPED, (output) => resolve(output));
      pdfLoader.write({ content: fakeBuffer });
    });

    expect(result).toBeDefined();
    expect(Buffer.isBuffer(result.content)).toBe(true);
  });

  it("should load a PDF file without metadata", async () => {
    const result = await new Promise<IDocument>((resolve) => {
      pdfLoader.once(LoaderEvent.PROCESSED, (output) => resolve(output));
      pdfLoader.write({ content: pdfBuffer });
    });

    expect(result).toBeDefined();
    expect(result.content).toBe("Dummy PDF file");
    expect(result.metadata.Author).toBeDefined();
  });

  it("should attach metadata if provided", async () => {
    const metadata = { foo: "bar" };

    const result = await new Promise<IDocument>((resolve) => {
      pdfLoader.once(LoaderEvent.PROCESSED, (output) => resolve(output));
      pdfLoader.write({ content: pdfBuffer, metadata });
    });

    expect(result).toBeDefined();
    expect(result.content).toBe("Dummy PDF file");
    expect(result.metadata.foo).toEqual("bar");
    expect(result.metadata.pageNumber).toBeGreaterThan(0);
  });
});
