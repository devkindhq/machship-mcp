# Security Policy

## Supported versions

Only the latest release is supported.

## Reporting a vulnerability

Email security@devkind.com.au.

Please do not open public issues for suspected vulnerabilities. We aim to
respond within 5 business days.

## Scope notes

- The server sends your Machship API token only to the Machship API base URL
  (`MACHSHIP_API_URL`). Set that variable only to a Machship host you trust.
- The HTTP transport (`TRANSPORT=http`) has no authentication. By default it
  listens on `127.0.0.1` and rejects foreign `Host` headers (DNS rebinding
  protection). If you set `MCP_HOST` to a non-loopback address, put an
  authenticating proxy in front of the server. The Docker image sets
  `MCP_HOST=0.0.0.0`.
- Tools can create, edit and delete live Machship data. Use a token with the
  smallest permissions that your work needs.
