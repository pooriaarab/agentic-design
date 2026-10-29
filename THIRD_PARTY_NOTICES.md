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
The package does not copy its code or assets. It adapts the idea and sets its own values. The license of that
project follows.

    MIT License

    Copyright (c) 2026 Paul Ford

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
