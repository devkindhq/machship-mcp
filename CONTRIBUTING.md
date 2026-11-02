# Contributing to machship-mcp

Thanks for your interest in improving the Machship MCP server.

## Ways to contribute

- Bug reports and feature ideas: open an issue with steps to reproduce.
- Tool bugs: include the tool name, the arguments, and the error text. Redact IDs, addresses and tokens.
- Documentation: wording, examples, and client setup notes all count.

## Development setup

You need Node.js 22.14 or later (or 24.10 or later), because the release tooling needs it. This repo uses Yarn 1 (`yarn.lock`). Do not use `npm install`.

```bash
git clone https://github.com/devkindhq/machship-mcp.git
cd machship-mcp
yarn install
yarn build
MACHSHIP_API_TOKEN=your-token yarn start
```

Use `yarn dev` for watch mode, and `TRANSPORT=http` for the HTTP transport.

## Checks to run

Run these before you open a pull request. CI runs the same checks on every pull request.

```bash
yarn install --frozen-lockfile
yarn lint
yarn build
node scripts/sync-manifest-tools.js
git diff --exit-code -- manifest.json
```

The last two commands start the built server and write its tool list into `manifest.json`. If you add, rename or remove a tool, commit the updated `manifest.json`.

## Ground rules

- Keep changes small and focused. One concern per pull request.
- Never commit client names, API keys, tokens, or customer data. This includes consignment IDs, addresses and screenshots. Use made-up values in every example.
- Keep the token out of any `.mcp.json` that you commit.

## Commit style

Use [Conventional Commits](https://www.conventionalcommits.org/), for example `fix: handle empty route lists`. The commit type sets the release:

- `feat:` publishes a minor release.
- `fix:` publishes a patch release.
- `chore:`, `ci:`, `docs:` and `refactor:` publish no release.
- A `BREAKING CHANGE:` footer publishes a major release.

Dependabot uses `fix:` for runtime dependencies, `chore:` for dev dependencies, and `ci:` for GitHub Actions.

## Releases

Every push to `main` runs `.github/workflows/ci-semantic-release.yml`. The workflow:

1. Installs, builds, and runs `semantic-release`.
2. semantic-release reads the commits since the last tag and picks the next version. With no `feat:` or `fix:` commit, it stops here.
3. `scripts/update-version.js` writes the version into `package.json`, `src/utils/constants.ts`, `server.json` and `manifest.json` in the CI checkout. Then `yarn bundle` builds `machship-mcp.mcpb`.
4. semantic-release publishes `@devkind/machship-mcp` to npm with trusted publishing (GitHub OIDC). It creates a GitHub release with the `.mcpb` bundle and a `vX.Y.Z` tag.
5. The workflow publishes `server.json` to the Official MCP Registry with GitHub OIDC.

In the pull request that will release version `X.Y.Z`, set that version in the Claude Code plugin files:

- `.claude-plugin/plugin.json`: `version`.
- `.mcp.json`: the npx pin `@devkind/machship-mcp@X.Y.Z`.

semantic-release does not update these files, and CI does not commit the new version back to git. The Claude plugin directory reads the git copy, so the git copy must equal the released version.

## License

By contributing, you agree that your work is released under the ISC License.
