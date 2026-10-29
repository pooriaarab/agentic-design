# Changelog

All notable changes to this package are in this file. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the package uses
[Semantic Versioning](https://semver.org/).

## 0.2.0 - 2026-10-29

App chrome for editors.

### Added

- `DocumentTitle`: a title that renames in place with Enter, Space, F2, and Escape. It refuses a
  blank, a too long, or a hidden-character title with a message that says what to fix.
- `AgentBadge`: the words "Made by an agent", a square avatar, and who the agent acts for. A
  `compact` badge keeps the same facts in its accessible name.
- `ToolbarGroup` and `ToolbarOverflow`. The overflow menu is part of the toolbar's one tab stop.
- `AppShell` takes `title` for the top bar, and `panel` with `panelLabel` for a side panel. The panel
  is an `aside` landmark and sits under the content below 64rem.
- `FileList` takes `items` and shows a sortable table or a grid, with `aria-sort`, a polite sort
  message, loading placeholders, and an empty state. Placeholders stop under reduced motion. The
  status says how many files arrived when loading ends.
- A `panel` width in the size tokens, `--ad-size-panel`.
- A `/chrome` page in the demo site, an axe WCAG 2.2 AA check for each part in light and dark, and a
  screenshot set in `docs/screenshots`.
- README and llms.txt document each part with an example. A test type-checks the examples.

### Changed

- `AppShellProps` is a type alias, not an interface, because `panel` and `panelLabel` go together. An
  interface that extends it must become a type with `&`.
- `FileList` accepts either `children` (the plain list) or `items`. Existing code is unchanged.
- `ToolbarButton` forwards its ref.
- The tests read `UI_PORT` and `WORKER_TEST_PORT`, so workers can share a host.

### Known limits

- `ToolbarOverflow` is a menu you fill. The toolbar does not measure itself.
- `FileList` has no paging, selection, or drag and drop. A long file name is cut with an ellipsis, and
  the full name is in its `title`.
- A `DocumentTitle` in a dialog closes the dialog when Escape cancels a rename.
- The toolbar reads the page direction when it renders.

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
- The demo snapshot link is not compressed or encrypted, and it holds text only.
- `parseInvitee` accepts printable ASCII only.
- A toast raised while a modal dialog is open stays out of reach until the dialog closes.
- Fonts cover Latin and Latin Extended only, and only upright faces ship.
- `Checkbox` and `Switch` have no error state yet.
