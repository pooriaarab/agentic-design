# Changelog

All notable changes to this package are in this file. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the package uses
[Semantic Versioning](https://semver.org/).

## 0.3.0 - 2026-10-29

### Added

- `SidebarNav` takes `linkComponent`, a host link component such as a router link.
  It gets the props of an anchor, including `href`, `className` and `aria-current`.
  `renderLink` is a render prop for the same job, and it wins over `linkComponent`.
  Both types, `SidebarLinkProps` and `SidebarNavProps`, are exported.

### Changed

- The brand of `AppShell` is in the top bar, inside the banner landmark, not at the
  top of the sidebar. The brand has no padding now. A host that styled
  `.ad-shell__brand` may need to adjust it.

### Fixed

- When a person opens the sidebar, focus goes to the first link, including a host
  link that is not an `a` element but has an `href`.

## 0.2.0 - 2026-10-29

### Breaking

- `AppShellProps` is now a type alias, not an interface, because the new `panel`
  prop makes it a union. An interface that extends it no longer compiles. Write
  `type MyProps = AppShellProps & { ... }` instead. Code that only renders
  `AppShell` is not affected.
- The props of `FileList` are now a union, because `items` is a second form. Code
  that reads `ComponentProps<typeof FileList>["children"]` no longer compiles. Code
  that renders `FileList` with `label` and `children` is not affected.
- `ToolbarButton` is now a `forwardRef` component. It can no longer be called as a
  plain function. A call such as `ToolbarButton({ ... })` throws at run time, and
  TypeScript does not catch it. Render it as JSX, as before.

### Added

- App chrome. `AppShell` takes `title`, a slot at the start of the top bar, and
  `panel` with `panelLabel`, a side panel after the content. From 64rem the panel
  sits beside the content, and below that it sits under it. Pass
  `panel={false}` or leave it out to hide it. A blank `panelLabel` throws when a
  panel is passed, and so does a blank `ToolbarGroup` label.
- `DocumentTitle`, a title that renames in place. Enter, Space, or F2 opens a field,
  and Escape cancels. A stored title with a hidden character shows as "Untitled".
- `AgentBadge`, a visible marker for anything an agent made. By default it shows
  the words "Made by an agent", a square avatar, and who the agent acts for. Pass
  `label` to change the words, and make the label say that an agent made the
  item. `compact` keeps those facts in the avatar's accessible name.
- `ToolbarGroup`, a named group of buttons, and `ToolbarOverflow`, a "More tools"
  menu as the last stop of a `Toolbar`. `ToolbarButton` forwards its ref.
- `FileList` takes `items` and shows a sortable table. Pass `view="grid"` for the
  grid. The table has
  column headers with `aria-sort`. The grid has a "Sort by" select. The list sorts
  by name, A to Z, unless you pass `defaultSort` to choose the start sort. Pass
  `sort` with `onSortChange` to control the sort yourself. `loading` shows placeholders, and `empty` replaces the default empty state.
  `FileItem`, `FileSort`, and `FileSortKey` are exported. `FileList` with
  `FileRow` children works as before.
- The types `DocumentTitleProps`, `AgentBadgeProps`, and `FileListItemsProps` are
  exported from `agentic-design/react`.
- `size.panel` (20rem) in the scale tokens.
- A `/chrome` page in the demo site on the Worker.

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
