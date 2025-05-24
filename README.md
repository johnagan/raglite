# RAGLite

**RAGLite** is a minimal, TypeScript-first Retrieval-Augmented Generation (RAG) pipeline. It's designed for simplicity, extensibility, and performance, supporting PDF and DOCX ingestion, local embeddings, and fast vector search using SQLite/LibSQL.

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
records[0].content; // The content of the document chunk
records[0].metadata; // The metadata of the document chunk
records[0].vector; // The vector of the document chunk
records[0].id; // The database id of the document chunk

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

## Environment Variables

You can customize the pipeline by passing in your own components.

| Variable       | Default                                   | Description                                    |
| -------------- | ----------------------------------------- | ---------------------------------------------- |
| `DATABASE_URL` | `file:data/ragpipe.db`                    | The URL of the SQLite/LibSQL database          |
| `TABLE_NAME`   | `embeddings`                              | The name of the table to store the embeddings  |
| `DIMENSIONS`   | `384`                                     | The dimensions of the embeddings               |
| `MODEL`        | `sentence-transformers/all-MiniLM-L12-v2` | The model to use for embedding                 |
| `CHUNK_SIZE`   | `200`                                     | The maximum number of words to embed per chunk |
| `OVERLAP`      | `0`                                       | The number of words to overlap between chunks  |

## Advanced Usage

### Customizing the Pipeline

You can customize the pipeline by passing in your own components.

```ts
import {
  Pipeline,
  UrlLoader,
  FileLoader,
  PdfLoader,
  DocxLoader,
  EmbeddingLoader,
  DataStoreLoader,
} from "raglite";

// Create a writer pipeline
const writer = new Pipeline([
  new UrlLoader({
    headers: {
      Authorization: `Bearer ${process.env.TOKEN}`,
    },
  }), // add fetch request options
  new FileLoader(),
  new PdfLoader(),
  new DocxLoader(),
  new EmbeddingLoader({
    model: "sentence-transformers/all-MiniLM-L6-v2",
    chunkSize: 200,
    overlap: 10,
  }), // customize the embedding model
  new DataStoreLoader({
    databaseUrl: "path/to/database.db",
    tableName: "documents",
    dimensions: 384,
  }), // customize the data store
]);

const records = await writer.load("path/to/document.pdf");

// Create a reader pipeline
const reader = new Pipeline([
  new EmbeddingLoader(),
  new DataStoreLoader({ search: true }),
]);

const results = await reader.search("What is retrieval-augmented generation?");
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
