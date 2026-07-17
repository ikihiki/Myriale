# Agent Notes

- When asked to create a wireframe from a Markdown user-story file, add the wireframe to Storybook rather than embedding the wireframe back into the Markdown document.
- For `docs/user-stories/scenario-registration.md`, represent each user story as a Storybook story with a `play` function using `@storybook/test` steps. The steps should explain the user flow through interactions and expectations.
- Keep the Markdown user-story documents as requirements sources; do not append generated UI wireframes to them unless explicitly requested.

## AI development tools

- Run `.mux/init` before using project tools in a new workspace. It installs the project dependencies plus the Aspire CLI and `agent-browser` when they are not already available.
- Use `aspire run` to start the .NET Aspire AppHost from the repository root. Use `aspire --help` if the CLI syntax differs in the installed version.
- Use `agent-browser` for browser interaction and verification, for example `agent-browser open http://127.0.0.1:6006`, `agent-browser snapshot`, and `agent-browser screenshot /tmp/storybook.png`.
- Prefer browser-tool evidence (snapshot, screenshot, or an explicit assertion) over claiming that a UI works based only on source inspection.
- When an MCP server is available in Mux, use it for the matching task; otherwise use the installed CLIs through the terminal. Do not invent MCP tools or credentials.
- Project MCP defaults are in `.mux/mcp.jsonc`; local secrets and workspace-specific overrides belong outside Git or in `.mux/mcp.local.jsonc`.
