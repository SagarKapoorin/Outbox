Onebox Email Aggregator (Backend + UI)

Overview
- Real-time IMAP sync (IDLE), search via Elasticsearch, AI categorization, Slack/webhook notifications, and optional RAG suggested replies.
- Tech: Node.js + TypeScript (Express), Elasticsearch (Docker), MongoDB (Atlas Vector Search), OpenAI, Redis (optional).

Quick Start
1) Copy `server/.env.example` to `server/.env` and fill values.
2) Start Elasticsearch locally:
   - `docker compose up -d` (Elasticsearch + Kibana)
   - Optional: Start Redis locally: `docker run -p 6379:6379 redis`
3) Install server deps and run dev:
   - `cd server && npm i && npm run dev`
4) Import Postman collection: `server/postman/Onebox.postman_collection.json`.

Environment Variables (server/.env)
- OPENAI_API_KEY=
- MONGODB_URI=
- ELASTICSEARCH_NODE=http://localhost:9200
- SLACK_WEBHOOK_URL=
- INTERESTED_WEBHOOK_URL=
- FRONTEND_ORIGIN=http://localhost:5173
- IMAP_ACCOUNTS_JSON=[{"id":"acc1","host":"imap.example.com","port":993,"secure":true,"user":"user","pass":"pass"}]
 - REDIS_URL=redis://localhost:6379
 - RATE_LIMIT_WINDOW_SEC=60
 - RATE_LIMIT_MAX=300

NPM Scripts (server)
- `dev`: Run server in watch mode
- `build`: Type-check and build
- `start`: Start built server
- `create:es-index`: Create/update Elasticsearch index mappings
- `seed:kb`: Seed vector KB from `server/seed/kb.txt`

Notes
- Use App Passwords for Gmail IMAP or OAuth2 if needed.
- First sync fetches last 30 days of emails; new mail arrives via IDLE events.
- RAG suggested replies need MongoDB Atlas Vector Search enabled.

Caching, Rate Limit, and Debounce
- Redis cache and rate limit (optional): If `REDIS_URL` is set, the server initializes Redis and enables:
  - Simple JSON cache helpers in `server/src/utils/redis.ts:18` (`cacheGet`, `cacheSet`, `cacheDel`).
  - IP + route key rate limiting via `server/src/utils/redis.ts:38` and middleware in `server/src/index.ts:19` using `RATE_LIMIT_WINDOW_SEC` and `RATE_LIMIT_MAX`.
- UI debouncing: The client exposes a `useDebounce` hook to reduce chatty requests and keystroke-triggered queries (`client/src/hooks/useDebounce.ts:3`).

Best Practices and Optimizations
- Typed config + schema validation via Zod (`server/src/utils/config.ts:1`) prevents invalid env setups.
- Structured logging with Pino (`server/src/index.ts:14`) for consistent, production-friendly logs.
- Rate limiting at the edge reduces abuse and protects Elasticsearch and MongoDB.
- Optional Redis caching helps avoid redundant downstream queries and smooths burst traffic.
- Debounced client interactions reduce unnecessary network calls and server load.
- Bounded JSON body size and CORS configured explicitly (`server/src/index.ts:16`).

MongoDB Vector Search Index
- Create the Atlas Vector Search index for the `kbs` collection before using RAG. In the MongoDB shell, run:

```
db.kbs.createSearchIndex(
  "kb_embedding_index",
  "vectorSearch",
  {
    fields: [
      {
        type: "vector",
        path: "embedding",
        numDimensions: 1536,
        similarity: "cosine"
      }
    ]
  }
)
```

Note: You can override the index name via `KB_VECTOR_INDEX` (defaults to `kb_embedding_index`).
