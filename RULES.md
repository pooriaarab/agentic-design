# agentic-design rules

These rules bind every change to agentic-design. They also bind agents that use
the package.

1. Use semantic tokens. A component reads `--ad-color-*`, never a hex value.
2. Test every color use. Each text and background pair needs an entry in
   `contrastPairs`, and `npm run check:contrast` must pass.
3. Never rely on color alone. Agents and people differ by label and shape too.
4. Make no remote request. Fonts and assets ship in the package.
5. Respect reduced motion. Motion tokens must fall to zero.
