Onebox Email Aggregator (Backend + UI)

Overview
- Real-time IMAP sync (IDLE), search via Elasticsearch, AI categorization, Slack/webhook notifications, and optional RAG suggested replies.
- Tech: Node.js + TypeScript (Express), Elasticsearch (Docker), MongoDB (Atlas Vector Search), OpenAI.

Quick Start
1) Copy `server/.env.example` to `server/.env` and fill values.
2) Start Elasticsearch locally:
   - `docker compose up -d` (Elasticsearch + Kibana)
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

