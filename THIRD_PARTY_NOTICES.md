# Third-party notices

## Fonts

Both font families are variable fonts under the SIL Open Font License 1.1.
The license texts are in `src/fonts/` and ship in `dist/fonts/`.

| Font | Source | License |
| --- | --- | --- |
| Inter | https://github.com/rsms/inter, packaged by `@fontsource-variable/inter` 5.3.0 | SIL OFL 1.1 |
| JetBrains Mono | https://github.com/JetBrains/JetBrainsMono, packaged by `@fontsource-variable/jetbrains-mono` 5.3.0 | SIL OFL 1.1 |

Only the Latin and Latin Extended subsets are included.

## Test tools under MPL-2.0

`axe-core` and `@axe-core/playwright` are dev dependencies under the MPL-2.0 license.
The tests use them to find accessibility problems. They are not changed, they are not built into
the package, and they are not published with it.

## Design reference

The calm look in 0.5.0 (quiet neutral palette, soft borders, generous spacing, restrained type, subtle focus)
follows the public design of Tiny Little Office, https://github.com/aboard-io/tinylittleoffice, MIT License.
The package does not copy its code or assets. It adapts the idea and sets its own values. The MIT notice of
that project is kept here: "Permission is hereby granted, free of charge, to any person obtaining a copy of this
software and associated documentation files, to deal in the software without restriction, subject to the
inclusion of the copyright and permission notice in all copies or substantial portions of the software."
