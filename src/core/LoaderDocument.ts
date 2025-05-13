import { z } from "zod";

export const LoaderContentSchema = z.union([z.string(), z.instanceof(Buffer)]).describe("The content of the document");
export type LoaderContent = z.infer<typeof LoaderContentSchema>;

export const LoaderMetadataSchema = z.record(z.string(), z.any()).default({}).describe("The metadata of the document");
export type LoaderMetadata = z.infer<typeof LoaderMetadataSchema>;

export const LoaderVectorSchema = z.number().array().optional().describe("The vector of the document");
export type LoaderVector = z.infer<typeof LoaderVectorSchema>;

/**
 * The schema of the loader document record
 */
export const LoaderDocumentSchema = z.object({
  content: LoaderContentSchema,
  metadata: LoaderMetadataSchema,
  vector: LoaderVectorSchema,
});

export type LoaderDocument = z.infer<typeof LoaderDocumentSchema>;
