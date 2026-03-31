# Supabase MCP

## What it does
Manages Supabase projects, runs SQL migrations, lists tables, retrieves project
URLs and publishable keys, and creates storage buckets — all via Claude Code MCP tools.

## Authentication
Set `SUPABASE_ACCESS_TOKEN` in your environment (your personal access token from
app.supabase.com/account/tokens).

## Configuration (.mcp.json)
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase@latest",
               "--access-token", "${SUPABASE_ACCESS_TOKEN}"]
    }
  }
}
```

## Key tools used in this project

| Tool | Used for |
|---|---|
| `list_organizations` | Get org_id before creating a project |
| `get_cost` + `confirm_cost` | Approve new project billing |
| `create_project` | Provision a new Supabase project per client |
| `get_project` | Poll until status = ACTIVE_HEALTHY |
| `apply_migration` | Run 001_initial_schema.sql on new project |
| `list_tables` | Verify contacts + projects tables exist |
| `get_project_url` | Get SUPABASE_URL for .env |
| `get_publishable_keys` | Get anon key (PUBLIC_SUPABASE_ANON_KEY) |
| `execute_sql` | Ad-hoc queries during debugging |

## Common patterns

**Create a project and wait for it to be ready:**
```
1. list_organizations → note org_id
2. get_cost { type: "project" }
3. confirm_cost { type: "project" }
4. create_project { name: "hawc-general-contracting", region: "us-east-1", org_id }
5. Poll get_project every 30s until status = "ACTIVE_HEALTHY"
```

**Apply migration:**
```
apply_migration {
  project_id: "<from create_project>",
  name: "initial_schema",
  query: "<contents of supabase/migrations/001_initial_schema.sql>"
}
```

## Troubleshooting
- **Project stuck in BUILDING:** Normal — can take 2–3 minutes. Keep polling.
- **apply_migration fails with "already exists":** Migration was already applied. Run `list_tables` to confirm tables exist.
- **service_role key not returned by MCP:** Correct — retrieve it manually from Supabase dashboard → Project Settings → API.
