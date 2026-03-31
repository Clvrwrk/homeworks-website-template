# GoHighLevel MCP

## What it does
Reads GHL location data, contacts, opportunities, and conversations — used during
the /build-website skill to verify location config and look up pipeline IDs.

## Authentication
Requires a GHL Private Integration Token (starts with `pit-`).
Create one at: GoHighLevel → Settings → Integrations → Private Integrations.

## Configuration (.mcp.json)
```json
{
  "mcpServers": {
    "ghl": {
      "command": "npx",
      "args": ["-y", "@ghl/mcp-server"],
      "env": { "GHL_API_KEY": "${GHL_API_KEY}", "GHL_LOCATION_ID": "${GHL_LOCATION_ID}" }
    }
  }
}
```

## Key tools used in this project

| Tool | Used for |
|---|---|
| `locations_get-location` | Verify location config; get pipeline IDs |
| `opportunities_get-pipelines` | Find GHL_PIPELINE_ID + GHL_STAGE_ID for site.ts |
| `contacts_get-contact` | Verify contact sync after /build-website |
| `conversations_search-conversation` | Debug failed sync alerts |

## Common patterns

**Get pipeline and stage IDs for a new location:**
```
1. locations_get-location { locationId: "XD3jIMHfJ2DCK1vaEhM2" }
2. opportunities_get-pipelines { locationId: "XD3jIMHfJ2DCK1vaEhM2" }
   → Find the pipeline named "Website Leads" → note id
   → Find stage named "New Lead" → note id
3. Add both to src/config/site.ts: GHL_PIPELINE_ID + GHL_STAGE_ID
```

## Troubleshooting
- **401 Unauthorized:** Token expired or wrong scope. Regenerate at GHL → Integrations.
- **"location does not allow duplicated contacts":** Contact already exists. Use contacts upsert (PUT) instead of POST.
