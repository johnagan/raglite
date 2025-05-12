import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { FileLoader } from "./FileLoader";
import { writeFileSync, unlinkSync, existsSync } from "fs";
import path from "path";

const testFilePath = path.join(__dirname, "testfile.txt");
const testContent = "Hello, FileLoader!";

describe("FileLoader", () => {
  beforeAll(() => {
    writeFileSync(testFilePath, testContent);
  });

  afterAll(() => {
    if (existsSync(testFilePath)) {
      unlinkSync(testFilePath);
    }
  });

  it("should detect an existing file path with test()", () => {
    const loader = new FileLoader();
    expect(loader.test(testFilePath)).toBe(true);
    expect(loader.test("nonexistent.txt")).toBe(false);
    expect(loader.test(Buffer.from("not a path"))).toBe(false);
  });

  it("should load file content as Buffer with transform()", async () => {
    const loader = new FileLoader();
    const data = { input: testFilePath };
    const result = await loader.transform(data);
    expect(Buffer.isBuffer(result.input)).toBe(true);
    expect(result.input.toString()).toBe(testContent);
  });
});
