# Coolify MCP

## What it does
Creates applications, sets environment variables, and triggers deployments on
your Coolify instance — the final step of the /build-website skill.

## Authentication
Generate an API token at your Coolify dashboard → Keys & Tokens → API Tokens.

## Configuration (.mcp.json)
```json
{
  "mcpServers": {
    "coolify": {
      "command": "npx",
      "args": ["-y", "@coolify/mcp-server"],
      "env": {
        "COOLIFY_BASE_URL": "https://your-coolify-instance.com",
        "COOLIFY_API_TOKEN": "${COOLIFY_API_TOKEN}"
      }
    }
  }
}
```

## Key tools used in this project

| Tool | Used for |
|---|---|
| `list_servers` | Get server ID for new application |
| `create_application` | Create new app pointing to GitHub repo |
| `set_environment_variables` | Inject GHL_API_KEY, SUPABASE_*, etc. |
| `deploy_application` | Trigger initial deployment after setup |
| `get_application_logs` | Debug failed builds |

## Common patterns

**Deploy a new client site:**
```
1. list_servers → get server_id
2. create_application {
     server_id,
     name: "hawc-general-contracting",
     git_repository: "https://github.com/Clvrwrk/hawc-general-contracting",
     git_branch: "main",
     build_pack: "nixpacks",
     port: 4321
   }
3. set_environment_variables { app_id, variables: { GHL_API_KEY: "...", ... } }
4. deploy_application { app_id }
```

## Troubleshooting
- **Build fails with "Cannot find module":** Run `npm install` step missing in nixpacks config. Verify `nixpacks.toml` has `[phases.install]`.
- **App starts but returns 502:** Check PORT env var matches nixpacks.toml start command port.
