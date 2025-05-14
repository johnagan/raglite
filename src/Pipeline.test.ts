import { describe, it, expect, beforeEach } from "vitest";
import { OpenAIModel } from "./models/OpenAIModel";
import { LibSQLStore } from "./stores/LibSQLStore";
import type { IModel, IStore } from "./core";
import { writeFile } from "fs/promises";
import { Pipeline } from "./Pipeline";
const TEST_INLINE_CONTENT = "Hello world";
const TEST_DOCX_URL = "https://calibre-ebook.com/downloads/demos/demo.docx";
const TEST_PDF_URL = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

const TEST_FILE_DIR = "/tmp";

const apiKey = process.env.OPENAI_API_KEY!;

describe("Pipeline", { timeout: 10000 }, () => {
  let pipeline: Pipeline;
  let model: IModel;
  let store: IStore;

  beforeEach(() => {
    store = new LibSQLStore();
    model = new OpenAIModel({ apiKey });
    pipeline = new Pipeline(model, store);
  });

  it("should load a docx file from a URL", async () => {
    const docs = await pipeline.load({ content: TEST_DOCX_URL, metadata: { foo: "bar" } });
    expect(docs).toBeDefined();
    expect(docs?.length).toBeGreaterThan(0);
    expect(docs?.[0].content).toBeDefined();
    expect(docs?.[0].metadata).toMatchObject({ foo: "bar" });
  });

  it("should load a pdf file from a URL", async () => {
    const docs = await pipeline.load({ content: TEST_PDF_URL, metadata: { foo: "bar" } });
    expect(docs).toBeDefined();
    expect(docs?.length).toBeGreaterThan(0);
    expect(docs?.[0].content).toBeDefined();
    expect(docs?.[0].metadata).toMatchObject({ foo: "bar" });
  });

  it("should load inline text", async () => {
    const docs = await pipeline.load({ content: TEST_INLINE_CONTENT, metadata: { foo: "bar" } });
    expect(docs).toBeDefined();
    expect(docs?.length).toBeGreaterThan(0);
    expect(docs?.[0].content).toBeDefined();
    expect(docs?.[0].content).toBe(TEST_INLINE_CONTENT);
    expect(docs?.[0].metadata).toMatchObject({ foo: "bar" });
  });

  it("should load a docx file from a buffer", async () => {
    const response = await fetch(TEST_DOCX_URL);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const docs = await pipeline.load({ content: buffer, metadata: { foo: "bar" } });
    expect(docs).toBeDefined();
    expect(docs?.length).toBeGreaterThan(0);
    expect(docs?.[0].content).toBeDefined();
    expect(docs?.[0].metadata).toMatchObject({ foo: "bar" });
  });

  it("should load a pdf from file", async () => {
    const response = await fetch(TEST_PDF_URL);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const filePath = `${TEST_FILE_DIR}/test.pdf`;
    await writeFile(filePath, buffer);

    const docs = await pipeline.load({ content: filePath, metadata: { foo: "bar" } });
    expect(docs).toBeDefined();
    expect(docs?.length).toBeGreaterThan(0);
    expect(docs?.[0].content).toBeDefined();
    expect(docs?.[0].metadata).toMatchObject({ foo: "bar" });
  });
});
