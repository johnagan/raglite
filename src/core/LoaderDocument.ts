import { z } from "zod";

const ContentSchema = z.union([z.string(), z.instanceof(Buffer)]).describe("The content of the document");
export type Content = z.infer<typeof ContentSchema>;

const MetadataSchema = z.record(z.string(), z.any()).default({}).describe("The metadata of the document");
export type Metadata = z.infer<typeof MetadataSchema>;

const VectorSchema = z.number().array().optional().describe("The vector of the document");
export type Vector = z.infer<typeof VectorSchema>;

/**
 * The schema of the loader document record
 */
export const LoaderDocumentSchema = z.object({
  content: ContentSchema,
  metadata: MetadataSchema,
  vector: VectorSchema,
});

export type LoaderDocument = z.infer<typeof LoaderDocumentSchema>;
