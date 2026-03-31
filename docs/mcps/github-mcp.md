# GitHub MCP

## What it does
Creates repositories, pushes files, reads file contents, and searches code
across the Clvrwrk org — all via Claude Code MCP tools.

## Authentication
Set `GITHUB_PERSONAL_ACCESS_TOKEN` in your environment with `repo` + `org:read` scopes.

## Configuration (.mcp.json)
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}" }
    }
  }
}
```

## Key tools used in this project

| Tool | Used for |
|---|---|
| `create_repository` | Create new private client repo under Clvrwrk org |
| `push_files` | Push multiple files in one commit to client repo |
| `get_file_contents` | Read template files before pushing to client repo |
| `search_code` | Security scan — verify no secrets in pushed files |

## Common patterns

**Create and populate a client repo:**
```
1. create_repository { name: "hawc-general-contracting", private: true, owner: "Clvrwrk" }
2. push_files {
     owner: "Clvrwrk",
     repo: "hawc-general-contracting",
     branch: "main",
     files: [
       { path: "src/config/site.ts", content: "<populated site.ts>" },
       { path: "src/data/services.ts", content: "<generated content>" }
     ],
     message: "feat: populate HAWC brand and content"
   }
```

## Troubleshooting
- **create_repository 422:** Repo already exists. Use get_file_contents to check state.
- **push_files to non-existent branch:** Create the repo first; main branch is created automatically.
