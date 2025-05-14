import { z } from "zod";

export const IContentSchema = z
  .union([z.string(), z.instanceof(Buffer)])
  .describe("The content of the document");
export type IContent = z.infer<typeof IContentSchema>;

export const IMetadataSchema = z
  .record(z.string(), z.any())
  .default({})
  .describe("The metadata of the document");
export type IMetadata = z.infer<typeof IMetadataSchema>;

export const IVectorSchema = z
  .number()
  .array()
  .optional()
  .describe("The vector of the document");
export type IVector = z.infer<typeof IVectorSchema>;

/**
 * The schema of the loader document record
 */
export const IDocumentSchema = z.object({
  content: IContentSchema,
  metadata: IMetadataSchema,
  vector: IVectorSchema,
});

export type IDocument = z.infer<typeof IDocumentSchema>;

/**
 * The schema of the store record
 */
export const IRecordSchema = IDocumentSchema.extend({
  id: z.number().describe("The id of the document"),
});

export type IRecord = z.infer<typeof IRecordSchema>;
