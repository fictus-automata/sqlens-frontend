# SQLens Frontend — Implementation Plan

## Overview

Build an interactive lineage dashboard that consumes the Altimate backend API (`localhost:8000`) and visualizes table and column-level lineage as an interactive graph. The frontend also provides pages for browsing queries, submitting new queries, and managing the schema registry.

**Stack:** React 19 + Vite · React Flow · React Router · TanStack Query · Vanilla CSS

---

## Backend API Contract (consumed endpoints)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/queries` | List queries (with filters) |
| `POST` | `/queries` | Submit a new query |
| `GET` | `/queries/{id}` | Get query detail |
| `GET` | `/queries/{id}/lineage` | Get flat lineage for a query |
| `GET` | `/queries/{id}/graph` | **Graph**: nodes + column-level edges for one query |
| `GET` | `/graph` | **Global graph**: aggregated across all queries |
| `GET` | `/schemas` | List registered schemas |
| `POST` | `/schemas` | Register a table schema |
| `GET` | `/schemas/{id}` | Schema detail with columns |
| `DELETE` | `/schemas/{id}` | Remove a schema |
| `GET` | `/schemas/sources` | List distinct source names |
| `GET` | `/healthz` | Health check |

### Key response shapes

```ts
// GET /queries/{id}/graph  or  GET /graph
interface GraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
  query_ids: string[];
}

interface GraphNode {
  id: string;          // "source::orders", "cte::customer_orders", "target::my_query"
  node_name: string;
  node_type: "source" | "cte" | "target";
  columns: { name: string; data_type: string | null }[];
}

interface GraphEdge {
  id: string;
  source_node_id: string;
  source_column: string | null;
  target_node_id: string;
  target_column: string | null;
}
```

---

## Application Architecture

```
src/
├── main.jsx                  # Entry point
├── App.jsx                   # Router + layout shell
├── api/
│   └── client.js             # Fetch wrapper for all API calls
├── components/
│   ├── layout/
│   │   ├── AppShell.jsx      # Sidebar nav + main content area
│   │   └── Sidebar.jsx       # Navigation links
│   ├── graph/
│   │   ├── LineageGraph.jsx  # React Flow canvas + controls
│   │   ├── TableNode.jsx     # Custom node: table-level (compact box)
│   │   ├── ColumnNode.jsx    # Custom node: card with column list + handles
│   │   ├── ColumnEdge.jsx    # Custom edge: animated bezier with column highlight
│   │   └── graphUtils.js     # Layout algorithm (Dagre), data transforms
│   ├── queries/
│   │   ├── QueryList.jsx     # Filterable query table
│   │   ├── QueryDetail.jsx   # Single query view + graph
│   │   └── QueryForm.jsx     # Submit new query form
│   └── schemas/
│       ├── SchemaList.jsx    # Registry browser
│       ├── SchemaDetail.jsx  # Schema column viewer
│       └── SchemaForm.jsx    # Register/edit schema form
├── pages/
│   ├── LineagePage.jsx       # Global graph view  (GET /graph)
│   ├── QueryListPage.jsx     # /queries
│   ├── QueryDetailPage.jsx   # /queries/:id  (graph + detail)
│   └── SchemaPage.jsx        # /schemas
├── hooks/
│   └── useGraph.js           # TanStack Query hooks for graph data
├── styles/
│   ├── index.css             # Global design tokens + resets
│   ├── graph.css             # Graph-specific styles
│   ├── layout.css            # Shell, sidebar
│   └── components.css        # Forms, tables, cards
└── utils/
    └── constants.js          # API_BASE_URL, etc.
```

---

## Page & Feature Breakdown

### 1. Lineage Graph View (`/lineage`)

The hero feature. A full-screen React Flow canvas showing the lineage DAG.

**Controls:**
- **View toggle**: Table-level ↔ Column-level (top toolbar)
- **Zoom / pan / fit-to-view** (React Flow built-in)
- **Source filter**: dropdown to scope by `source_name`
- **Node filter**: text input to focus on a specific table/model

**Table-level mode:**
- Each node is a compact rounded box showing just the table/model name
- Edges connect nodes (no column specificity)
- Color-coded by `node_type`: source (blue), cte (purple), target (green)

**Column-level mode (default):**
- Each node is a card showing the table name as header + scrollable column list
- Each column row has a left handle (input) and right handle (output)
- Edges connect specific column handles, enabling per-column tracing
- Clicking a column highlights all connected edges (upstream + downstream)

**Layout:**
- Auto-layout via **dagre** (left-to-right DAG), recalculated when data changes
- Nodes are draggable post-layout

---

### 2. Query List (`/queries`)

A searchable, filterable list of all ingested queries.

- Table columns: query_name, user_id, source_name, lineage_status, created_at
- Filters: user_id text input, source_name dropdown, status badge filter
- Click a row → navigate to `/queries/:id`
- "New Query" button → opens QueryForm

---

### 3. Query Detail (`/queries/:id`)

Split view:
- **Left panel**: Query metadata (name, SQL text with syntax highlighting, status, timestamps)
- **Right panel**: That query's lineage graph (single-query view via `GET /queries/{id}/graph`)
- Same table/column toggle as the global view

---

### 4. Schema Registry (`/schemas`)

- List all registered schemas grouped by `source_name`
- Click a schema → expand inline to show columns (name, type, nullable, ordinal)
- "Register Schema" button → modal form with table name, source, and dynamic column rows
- Delete button per schema (with confirmation)

---

## Proposed Changes (Step-by-Step)

### Step 1: Project Scaffolding

> [!IMPORTANT]
> Must be done first — everything depends on it.

- Initialize Vite + React project in `/Users/chirag/Codebase/sqlens-frontend`
- Install dependencies: `react-router-dom`, `@xyflow/react`, `@tanstack/react-query`, `dagre`
- Set up `vite.config.js` with API proxy to `localhost:8000`
- Create design system in `index.css` (colors, typography, spacing tokens)

---

### Step 2: API Client + Layout Shell

- **`api/client.js`**: Typed fetch functions for every backend endpoint
- **`AppShell.jsx`**: Fixed sidebar (Lineage, Queries, Schemas nav links) + `<Outlet />` for page content
- **Router setup** in `App.jsx`: `/lineage`, `/queries`, `/queries/:id`, `/schemas`
- Wire TanStack Query provider

---

### Step 3: Lineage Graph — Core

The most complex step. Build the React Flow graph with custom nodes.

#### [NEW] `components/graph/ColumnNode.jsx`
- Custom React Flow node rendering a card
- Header bar with table name + node_type badge
- Column list with individual source/target handles per column
- Hide/show column toggle (collapsible)

#### [NEW] `components/graph/TableNode.jsx`
- Compact node for table-level view (just name + type badge)
- Single source/target handle

#### [NEW] `components/graph/graphUtils.js`
- `transformGraphData(apiResponse, viewMode)` — converts API response into React Flow nodes + edges
- In column-level mode: creates a handle per column, edges connect specific handles
- In table-level mode: collapses to single handles, deduplicates edges
- `layoutGraph(nodes, edges)` — runs dagre left-to-right layout

#### [NEW] `components/graph/LineageGraph.jsx`
- React Flow canvas with custom node types registered
- Toolbar: view mode toggle, source filter, fit-to-view
- Column click highlighting (dim unrelated edges)

#### [NEW] `pages/LineagePage.jsx`
- Fetches `GET /graph` via TanStack Query
- Passes data to `<LineageGraph />`
- Source name filter (fetched from `GET /schemas/sources`)

---

### Step 4: Query List + Detail Pages

#### [NEW] `pages/QueryListPage.jsx`
- Fetches `GET /queries` with pagination
- Renders `<QueryList />` table
- "New Query" button → inline `<QueryForm />`

#### [NEW] `components/queries/QueryForm.jsx`
- Fields: query_name (required), query_text (textarea), user_id, source_name (optional)
- POST /queries on submit, invalidate query list cache
- Success → navigate to `/queries/:id`

#### [NEW] `pages/QueryDetailPage.jsx`
- Fetches query detail + `GET /queries/{id}/graph`
- Left: query metadata + SQL text
- Right: `<LineageGraph />` scoped to this query

---

### Step 5: Schema Registry

#### [NEW] `pages/SchemaPage.jsx`
- Fetches `GET /schemas` grouped by source_name
- Expandable rows showing column definitions
- Delete with confirmation modal

#### [NEW] `components/schemas/SchemaForm.jsx`
- Dynamic form: add/remove column rows
- Fields per column: column_name, data_type, is_nullable, ordinal_position
- POST /schemas on submit

---

### Step 6: Polish & Edge Cases

- Loading skeletons for graph and list views
- Error boundaries with retry buttons
- Empty states (no queries yet, no schemas, graph has no data)
- Responsive adjustments (minimum viable — sidebar collapses on narrow screens)
- CORS: add `CORSMiddleware` to Altimate backend if not already present

---

## Design Tokens (Light Mode)

```css
:root {
  /* Surfaces */
  --bg-primary: #FAFBFC;
  --bg-card: #FFFFFF;
  --bg-sidebar: #F3F4F6;
  
  /* Text */
  --text-primary: #1F2937;
  --text-secondary: #6B7280;
  --text-muted: #9CA3AF;
  
  /* Accents — node type colors */
  --color-source: #3B82F6;     /* blue — physical tables */
  --color-cte: #8B5CF6;        /* purple — CTEs */
  --color-target: #10B981;     /* green — query result models */
  
  /* Edges */
  --edge-default: #CBD5E1;
  --edge-highlight: #3B82F6;
  
  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  
  /* Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  
  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}
```

---

## Verification Plan

### Automated
```bash
npm run build   # Ensure production build succeeds with no errors
npm run lint    # ESLint clean
```

### Manual
1. Start backend: `cd ../Altimate && uvicorn app.main:app --reload`
2. Start frontend: `npm run dev`
3. Register schemas via Schema page → verify they appear in list
4. Submit a CTE query via Query page → verify it appears in query list with `completed` status
5. Open query detail → verify graph shows correct nodes (source, CTE, target) and column edges
6. Open global lineage → verify all queries' graphs are aggregated
7. Toggle table-level ↔ column-level → verify nodes collapse/expand correctly
8. Click a column → verify edge highlighting works

---

## Open Questions

> [!NOTE]
> **SQL syntax highlighting in Query Detail**
> Should we add a lightweight syntax highlighter (e.g., Prism.js or highlight.js) for the SQL text display? I'll add it if desired — it's a small dependency.

> [!NOTE]  
> **Backend CORS**
> The Altimate backend currently has no CORS middleware. We'll need to add `CORSMiddleware` with `allow_origins=["http://localhost:5173"]` for the Vite dev server to call the API directly. Alternatively, Vite's proxy config can bypass this entirely in dev mode.
