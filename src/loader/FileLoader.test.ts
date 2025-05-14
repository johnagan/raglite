import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { LoaderEvent, type IDocument, type ILoaderError } from "../core";
import { writeFileSync, unlinkSync, existsSync } from "fs";
import { FileLoader } from "./FileLoader";
import { join } from "path";

describe("FileLoader", () => {
  const TEST_FILE_NAME = "test-fileloader.txt";
  const TEST_FILE_PATH = join(__dirname, TEST_FILE_NAME);
  const TEST_CONTENT = "hello fileloader!";

  let fileLoader: FileLoader;

  beforeEach(() => {
    writeFileSync(TEST_FILE_PATH, TEST_CONTENT);
    fileLoader = new FileLoader();
  });

  afterEach(() => {
    if (existsSync(TEST_FILE_PATH)) {
      unlinkSync(TEST_FILE_PATH);
    }
    vi.restoreAllMocks();
  });

  it("should load file content as Buffer and add fileName to metadata", async () => {
    const inputDoc: IDocument = {
      content: TEST_FILE_PATH,
      metadata: { foo: "bar" },
    };

    const result: IDocument = await new Promise((resolve) => {
      fileLoader.once(LoaderEvent.PROCESSED, (output) => resolve(output));
      fileLoader.write(inputDoc);
    });

    expect(result).toBeDefined();
    expect(Buffer.isBuffer(result.content)).toBe(true);
    expect(result.content.toString()).toBe(TEST_CONTENT);
    expect(result.metadata.foo).toBe("bar");
    expect(result.metadata.fileName).toBe(TEST_FILE_NAME);
  });

  it("should skip when file doesn't exist", async () => {
    const nonExistentPath = join(__dirname, "non-existent-file.txt");
    const inputDoc: IDocument = {
      content: nonExistentPath,
      metadata: {},
    };

    const result: IDocument = await new Promise((resolve) => {
      fileLoader.once(LoaderEvent.SKIPPED, (output) => resolve(output));
      fileLoader.write(inputDoc);
    });

    expect(result).toBeDefined();
    expect(result).toBe(inputDoc);
  });
});
