import { z } from "zod";

export const ContentSchema = z
  .union([z.string(), z.instanceof(Buffer)])
  .describe("The content of the document");
export type IContent = z.infer<typeof ContentSchema>;

export const MetadataSchema = z
  .record(z.string(), z.any())
  .default({})
  .describe("The metadata of the document");
export type IMetadata = z.infer<typeof MetadataSchema>;

export const VectorSchema = z
  .number()
  .array()
  .optional()
  .describe("The vector of the document");
export type IVector = z.infer<typeof VectorSchema>;

/**
 * The schema of the loader document record
 */
export const DocumentSchema = z.object({
  content: ContentSchema,
  metadata: MetadataSchema,
  vector: VectorSchema,
});

export type IDocument = z.infer<typeof DocumentSchema>;

/**
 * The schema of the store record
 */
export const RecordSchema = DocumentSchema.extend({
  id: z.union([z.number(), z.string()]).describe("The id of the record"),
  createdAt: z.date().describe("The date the record was created"),
});

export type IRecord = z.infer<typeof RecordSchema>;
