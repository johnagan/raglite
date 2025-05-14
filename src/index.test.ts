import { describe, it, expect, beforeEach, vi } from "vitest";
import { Pipeline, LibSQLStore, OpenAIModel } from ".";

import {
  DocxLoader,
  UrlLoader,
  FileLoader,
  PdfLoader,
  StoreLoader,
  EmbeddingLoader,
} from "./loader";

const apiKey = process.env.OPENAI_API_KEY!;
const databaseUrl = process.env.DATABASE_URL;

const PDF_URL =
  "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

const DOCX_URL = "https://calibre-ebook.com/downloads/demos/demo.docx";

describe("Ragpipe", { timeout: 10000 }, () => {
  let model: OpenAIModel;
  let store: LibSQLStore;
  let pipeline: Pipeline;

  beforeEach(() => {
    model = new OpenAIModel({ apiKey });
    store = new LibSQLStore({ databaseUrl });

    pipeline = new Pipeline({
      loaders: [
        new UrlLoader(),
        new FileLoader(),
        new DocxLoader(),
        new PdfLoader(),
        new EmbeddingLoader(model),
        new StoreLoader(store),
      ],
    });
  });

  it("should load a PDF from url", async () => {
    const result = await pipeline.load(PDF_URL);
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].id).toBeDefined();
    expect(result[0].content).toBeDefined();
    expect(result[0].vector).toBeDefined();
    expect(result[0].metadata).toBeDefined();
  });

  it("should load a PDF from url with metadata", async () => {
    const result = await pipeline.load(PDF_URL, {
      title: "Test Document",
    });
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].id).toBeDefined();
    expect(result[0].content).toBeDefined();
    expect(result[0].vector).toBeDefined();
    expect(result[0].metadata).toBeDefined();
    expect(result[0].metadata.title).toBe("Test Document");
  });

  it("should load a DOCX from url", async () => {
    const result = await pipeline.load(DOCX_URL);
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].id).toBeDefined();
    expect(result[0].content).toBeDefined();
  });

  it("should load a DOCX from url with metadata", async () => {
    const result = await pipeline.load(DOCX_URL, {
      title: "Test Document",
    });
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].id).toBeDefined();
    expect(result[0].content).toBeDefined();
    expect(result[0].metadata).toBeDefined();
    expect(result[0].metadata.title).toBe("Test Document");
  });
});
