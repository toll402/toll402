# Installing Toll402 (for AI coding agents such as Cline)

Toll402 is a remote MCP server: nothing to clone or build.

## Option A — remote server with OAuth (recommended)

Add this to the MCP settings (`cline_mcp_settings.json` for Cline):

```json
{
  "mcpServers": {
    "toll402": {
      "type": "streamableHttp",
      "url": "https://toll402.dev/connector/mcp"
    }
  }
}
```

The first request opens a browser window where the user signs in to Toll402 (or creates an account with an email) and sets a daily spending limit. Tools: find_tools, get_tool, run_tool, do_task, read_webpage, search_trusted_sources, find_businesses, verify_business, check_task, account_status, call_history, rate_call.

## Option B — local server with an API key

Requires Node.js 18+. Ask the user for their Toll402 key (`tk_…`, from https://toll402.dev/credits) and add:

```json
{
  "mcpServers": {
    "toll402": {
      "command": "npx",
      "args": ["-y", "toll402-mcp"],
      "env": { "TOLL402_API_KEY": "tk_..." }
    }
  }
}
```

## Verify

Call `find_tools` with `{"need": "exchange rate"}` (free). A paid call such as `run_tool {"tool": "fx_rate", "input": {"base": "USD", "quote": "MXN"}}` costs $0.001 and needs credits; if the account has none, the tool answers with a top-up link (https://toll402.dev/account).
