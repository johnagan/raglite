import { describe, it, expect, vi, beforeEach } from "vitest";
import { load } from "./pipeline";
import { writeFile } from "fs/promises";

const TEST_INLINE_CONTENT = "Hello world";
const TEST_DOCX_URL = "https://calibre-ebook.com/downloads/demos/demo.docx";
const TEST_PDF_URL = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

const TEST_FILE_DIR = "/tmp";

describe("load", () => {
  it("should load a docx file from a URL", async () => {
    const docs = await load(TEST_DOCX_URL, { foo: "bar" });
    expect(docs).toBeDefined();
    expect(docs?.length).toBeGreaterThan(0);
    expect(docs?.[0].content).toBeDefined();
    expect(docs?.[0].metadata).toMatchObject({ foo: "bar" });
  });

  it("should load a pdf file from a URL", async () => {
    const docs = await load(TEST_PDF_URL, { foo: "bar" });
    expect(docs).toBeDefined();
    expect(docs?.length).toBeGreaterThan(0);
    expect(docs?.[0].content).toBeDefined();
    expect(docs?.[0].metadata).toMatchObject({ foo: "bar" });
  });

  it("should load inline text", async () => {
    const docs = await load(TEST_INLINE_CONTENT, { foo: "bar" });
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

    const docs = await load(buffer, { foo: "bar" });
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

    const docs = await load(filePath, { foo: "bar" });
    expect(docs).toBeDefined();
    expect(docs?.length).toBeGreaterThan(0);
    expect(docs?.[0].content).toBeDefined();
    expect(docs?.[0].metadata).toMatchObject({ foo: "bar" });
  });
});
