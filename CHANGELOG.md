# Changelog

All notable changes to this package are in this file. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the package uses
[Semantic Versioning](https://semver.org/).

## 0.9.0 - 2026-10-29

### Added

- `DataTableToolbar`, `TableSearch`, `FilterChips`, `DisplayPopover`, `filterMenuItems`, `applyDataView`, `emptyDataView`, `fieldText`, `sameDisplay`, and the icons `SearchIcon` and `SlidersIcon`. They add search, filters, grouping, ordering, and hidden columns to a `DataTable`. `DataTable` takes the new `groupBy` and `hiddenColumns` props.
- `AppSidebar`, a left sidebar with a toggle button. It saves its state on the device, shares it between tabs, and starts collapsed on a narrow screen. It also adds `SIDEBAR_STORAGE_KEY`, `PanelLeftIcon`, and the size token `sidebar-rail`.

## 0.8.0 - 2026-10-29

### Added

- `DataTable`, a virtualized table for large row sets. It keeps one tab stop, moves focus with the arrow keys, and announces its status and position.

## 0.7.1 - 2026-10-29

### Fixed

- `agentic-design-mcp mcp --help` and `agentic-design-mcp mcp --version` no longer start the MCP server and hang. They print the usage or the version and exit 0, as `agentic-design mcp --help` already did.
- After the `mcp` word, the bin reads `--help`, `-h`, `--version` and `-V` anywhere in the arguments, as the package CLI does. When both `--help` and `--version` are given, the usage wins. Other arguments are still ignored, so `agentic-design-mcp mcp --verbose` starts the server. The package CLI rejects that argument instead. Without the `mcp` word, the bin reads only its first argument, as before.

## 0.7.0 - 2026-10-29

### Added

- `AppShell` takes a `secondary` prop for less used actions. Below 48rem they fold behind a "More options" button under the top bar. The button has `aria-expanded`, and Escape closes it and returns focus to it. On a wide screen they stay in the top bar.
- An end-to-end test loads every demo page at 320px, 360px, and 390px, in both text directions for the editor, and checks that the page and the top bar are not wider than the screen.

### Fixed

- The top bar no longer makes the page scroll sideways on a 360px to 390px screen. The product name shortens with an ellipsis, the title wraps, and the actions wrap. A focus ring on the name is not clipped, and the title is not clipped at all, so a `DocumentTitle` keeps its focus ring and its error text.
- A remote cursor name tag (`PresenceCursor`) moves back inside the screen when it would be cut off at either edge, so the name and the word Agent stay readable. Its text does not clip, and a chip note wraps and does not widen the page.

## 0.6.0 - 2026-10-29

### Changed

- `Tabs` uses a roving tab index. The active tab is the only tab stop, and the arrow keys move between tabs. The tab list is no longer a tab stop, so one Tab press no longer lands on a focus ring that does nothing (WCAG 2.2 focus order).

## 0.5.0 - 2026-10-29

### Changed

- A calmer look in light and dark. The neutrals are cooler and quieter, and the accent is indigo. Borders on cards, menus, and buttons are soft. Shadows are lighter. Controls are 2.25rem high. The large radius is 1rem, and the heading sizes are smaller. Dialogs and menus have more padding.
- A text field, a select, and a checkbox keep a strong edge (3:1) so people can find them. A button has a soft edge because its label names it. The danger button keeps its red label and no longer has a red edge.
- The focus ring keeps its 2px width and 2px gap. Its color follows the new indigo accent.
- A disabled button has a dashed edge, so it differs from an enabled one by shape as well as color.
- The token names and the `agd-` prefix do not change. Only values change, so apps that read semantic tokens need no edit.

### Added

- An end-to-end test reads the shipped `tokens.css` and checks text, control edge, focus, and accent pairs against WCAG 2.2 AA in both themes, with its own contrast math.

### Notice

- The look follows Tiny Little Office (https://github.com/aboard-io/tinylittleoffice, MIT; site https://tinylittleoffice.com): quiet neutrals, soft borders, and a restrained type scale. No code is copied. See `THIRD_PARTY_NOTICES.md`.

## 0.4.0 - 2026-10-29

### Changed

- **BREAKING:** the class prefix `ad-` is now `agd-`. The custom property prefix `--ad-` is now `--agd-`. Ad blockers hide elements with `ad-*` classes through EasyList rules, so buttons and other parts vanished for some people. No rule matches `agd-`. There are no aliases for the old names. Rename each `ad-*` class, `--ad-*` variable, and `data-ad-*` attribute in your own CSS and code.

### Added

- An end-to-end guard loads the demo pages with EasyList cosmetic filters applied. It checks that buttons, inputs, the skip link, and dialogs stay visible. It fails on the old prefix.

## 0.3.3 - 2026-10-29

### Security

- The `zod` dependency is `^4.6.7`. zod 3.25.76 was below the fixed version for
  GHSA-mrhx-c7xc-m3w5, which allows memory exhaustion when validating oversized
  constrained collections. The package API is unchanged.

### Fixed

- `agentic-design mcp --help` and `-h` print the usage and exit 0. `mcp --version`
  and `-V` print the version. Before, these flags exited 2 with an error.

### Changed

- The field components have a spec for the controlled value. It checks a user change
  and a parent change, both ways, for each field.
- The publish workflow runs one publish at a time for each ref, so two runs cannot
  publish at once.

## 0.3.2 - 2026-10-29

### Changed

- `Checkbox` and `Switch` show a star after the label when you pass `required`. The
  star is hidden from assistive technology, so the accessible name does not change.
- The README tells you to install the package from npm. It documents the
  `agentic-design/tokens.css` subpath, for an app that needs only the custom properties.
- The field components have an end-to-end spec. It covers labels, hints, errors and
  `required`.

## 0.3.1 - 2026-10-29

### Fixed

- `agentic-design-mcp --help` and `-h` print the usage and exit 0. `--version` and `-V`
  print the version. Before, the bin started the stdio server, so these flags hung.

## 0.3.0 - 2026-10-29

### Added

- `SidebarNav` takes `linkComponent`, a host link component such as a router link.
  It gets the props of an anchor, including `href`, `className` and `aria-current`.
  `renderLink` is a render prop for the same job, and it wins over `linkComponent`.
  Both types, `SidebarLinkProps` and `SidebarNavProps`, are exported.

### Changed

- The brand of `AppShell` is in the top bar, inside the banner landmark, not at the
  top of the sidebar. The brand has no padding now. A host that styled
  the shell brand class may need to adjust it.

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
