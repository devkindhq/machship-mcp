# Security Policy

## Supported versions

The latest release of `@devkind/machship-mcp` on npm and the tip of `main` are supported.

## Reporting a vulnerability

Email the maintainers via the Devkind GitHub organisation
(open a private security advisory on the repo if enabled, or contact an admin).

Please do not open public issues for suspected vulnerabilities. We aim to
respond within 5 business days.

## Scope notes

This project calls the Machship API with your API token. Tools can create,
edit and delete live Machship data, so use a token with only the permissions
your work needs. Report vulnerabilities in the Machship API itself to Machship.

## Hardening already in place

- The token goes only to `MACHSHIP_API_URL` (default `https://live.machship.com`).
- HTTP mode (`TRANSPORT=http`) has no authentication. It listens on `127.0.0.1`
  by default and rejects foreign `Host` headers. The Docker image sets
  `MCP_HOST=0.0.0.0`; put an authenticating proxy in front of any non-loopback address.
- The Claude Code plugin stores the token as a `sensitive` user setting.
