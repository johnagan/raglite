# RAGLite

**RAGLite** is a minimal, TypeScript-first Retrieval-Augmented Generation (RAG) pipeline. It's designed for simplicity, extensibility, and performance, supporting PDF and DOCX ingestion, OpenAI embeddings, and fast vector search using SQLite/LibSQL.

## Features

- **Simple API**: One main class (`RAGLite`) for most use cases.
- **Document Ingestion**: Load PDFs and DOCX files out of the box.
- **OpenAI Embeddings**: Uses OpenAI's embedding models.
- **Fast Vector Search**: Backed by SQLite/LibSQL for efficient similarity search.
- **Extensible**: Advanced users can use or extend individual components.

---

## Installation

```bash
npm install raglite
```

---

## Quick Start

### Basic Usage

```ts
import { RAGLite } from "raglite";

// Initialize RAGLite
const rag = new RAGLite({
  // All options are optional if you use environment variables
  apiKey: process.env.OPENAI_API_KEY, // or omit if set in .env
  url: process.env.DATABASE_URL, // or omit if set in .env
  tableName: "my_embeddings", // optional, default: "embeddings"
  model: "text-embedding-3-small", // optional, default: "text-embedding-3-small"
  dimensions: 1536, // optional, default: 1536
});

// Load a document from a URL, file path, Buffer, or plain text
await rag.load("path/to/document.pdf");

// Search for relevant chunks
const results = await rag.search("What is retrieval-augmented generation?", 5);

console.log(results);
```

---

## API

### `new RAGLite(options)`

| Option     | Type   | Default                  | Description                |
| ---------- | ------ | ------------------------ | -------------------------- |
| apiKey     | string | `OPENAI_API_KEY` env var | OpenAI API key             |
| url        | string | `DATABASE_URL` env var   | SQLite/LibSQL database URL |
| tableName  | string | `embeddings`             | Table name for embeddings  |
| model      | string | `text-embedding-3-small` | OpenAI embedding model     |
| dimensions | number | `1536`                   | Embedding vector size      |

### `await rag.load(file)`

- `file` (`string | Buffer`): URL, file path, Buffer, or plain text. Supports loading from remote URLs, local file paths, raw Buffers, or direct text content.
- Loads and embeds the document into the vector store.

### `await rag.search(query, results = 3)`

- `query` (`string`): The search query.
- `results` (`number`): Number of top results to return (default: 3).
- Returns: Array of relevant document chunks.

---

## Advanced Usage

RAGLite is modular. You can use or extend its components directly:

- **Vector Store**: `LibSQLStore` (`raglite/stores/LibSQLStore`)
- **Embedding Model**: `OpenAIModel` (`raglite/models/OpenAIModel`)
- **Document Loaders**: PDF, DOCX, and text loaders in `raglite/loaders/`
- **Base Classes**: For custom stores, models, or loaders.

**Example (using components directly):**

```ts
import { LibSQLStore } from "raglite/stores/LibSQLStore";
import { OpenAIModel } from "raglite/models/OpenAIModel";

const model = new OpenAIModel({ apiKey: "..." });
const store = new LibSQLStore({ url: "...", model });

await store.addDocument({ content: "Hello world", metadata: {} });
const results = await store.search("Hello");
```

---

## Requirements

- Node.js >= 18 (recommended: >= 20)
- OpenAI API key
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
