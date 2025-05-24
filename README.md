# RAGLite

**RAGLite** is a minimal, TypeScript-first Retrieval-Augmented Generation (RAG) pipeline. It's designed for simplicity, extensibility, and performance, supporting PDF and DOCX ingestion, OpenAI embeddings, and fast vector search using SQLite/LibSQL.

## Features

- **Simple API**: to load and search for documents.
- **Document Ingestion**: Load PDFs and DOCX files out of the box.
- **Local Embeddings**: Uses local embedding model from Hugging Face.
- **Fast Vector Search**: Backed by SQLite/LibSQL for efficient similarity search.
- **Extensible**: Advanced users can use or extend individual components.

---

## Installation

```bash
npm install raglite
```

## Quick Start

### Basic Usage

Add documents to the data store:

```ts
import { load, search } from "raglite";

// Load a document from a file path
const records = await load("path/to/document.pdf");
records; // The chunked records created from the document
records[0].content; // The content of the document
records[0].metadata; // The metadata of the document
records[0].vector; // The vector of the document
records[0].id; // The database id of the document

// Load a document from a URL
await load("https://example.com/path/to/document.docx");

// Load a document from text
await load("Hello, world!");

// Include metadata with the document
await load("Hello, world!", {
  source: "https://example.com/path/to/document.docx",
});
```

Search for relevant documents:

```ts
const results = await search("What is retrieval-augmented generation?");

console.log(results); // [{ content: "...", metadata: { source: "..." } }, ...]
```

---

## Requirements

- Node.js >= 18 (recommended: >= 20)
- SQLite/LibSQL database (local file or remote)

---

## Development & Testing

- Run tests: `pnpm test` or `npm test`
- Build: `pnpm build` or `npm run build`

---

## License

MIT

---

## Contributing

Contributions, issues, and feature requests are welcome! Please open an issue or PR.
