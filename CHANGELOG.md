# Changelog

All notable changes to this package are in this file. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the package uses
[Semantic Versioning](https://semver.org/).

## 0.1.0 - 2026-10-29

First release.

### Added

- Semantic color tokens for light and dark themes, and scales for type, space,
  radius, shadow, and motion. Motion tokens drop to zero when the user asks for
  reduced motion.
- A contrast check, `npm run check:contrast`, for every text and background pair
  against WCAG 2.2 AA.
- Self-hosted Inter and JetBrains Mono fonts under SIL OFL 1.1. The package
  makes no remote request.
- React form controls: `Button`, `IconButton`, `Input`, `Textarea`, `Select`,
  `Checkbox`, and `Switch`.
- React overlays on Radix UI: `Dialog`, `Menu`, `Tooltip`, `Tabs`, and a toast.
- React app patterns: `AppShell`, `SidebarNav`, `Toolbar`, `EmptyState`,
  `FileList`, `FileRow`, `PresenceChip`, and `PresenceStack`.
- `ShareDialog`, `PresenceCursor`, `ThemeProvider`, `useTheme`, and
  `themeInitScript()`.
- A CLI (`agentic-design tokens`, `contrast`, `mcp`) and an MCP server.
- An HTTP route, `GET /api/v1/tokens`, from a Cloudflare Worker.

### Known limits

- `ShareDialog` is a view. It calls your handlers and stores nothing.
- The snapshot link is not compressed or encrypted, and it holds text only.
- Fonts cover Latin and Latin Extended only, and only upright faces ship.
- `Checkbox` and `Switch` have no error state yet.
