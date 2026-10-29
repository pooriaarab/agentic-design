import { contrastPairs, contrastRatio, scale, shadows, themes, type ColorName } from "../tokens/index.js";
import { useTheme } from "../theme.js";
import { DemoShell } from "./demo-shell.js";

const colorGroups: [string, ColorName[]][] = [
  ["Surface", ["bg", "surface", "surface-raised", "surface-sunken", "surface-hover"]],
  ["Text", ["text", "text-muted", "text-on-accent"]],
  ["Border and focus", ["border", "border-strong", "focus"]],
  ["Accent", ["accent", "accent-hover", "accent-subtle", "accent-text"]],
  ["Agent", ["agent", "agent-subtle", "agent-text"]],
  ["Status", ["danger", "danger-subtle", "danger-text", "warning", "warning-subtle", "warning-text", "success", "success-subtle", "success-text"]],
];

export function TokensPage() {
  const { theme } = useTheme();
  const colors = themes[theme];

  return (
    <DemoShell title="Design tokens" description="Semantic tokens for light and dark. Every pair meets WCAG 2.2 AA.">
      <section aria-labelledby="color">
        <h2 id="color">Color</h2>
        {colorGroups.map(([group, names]) => (
          <div key={group} className="demo-group">
            <h3>{group}</h3>
            <ul className="demo-swatches">
              {names.map((name) => (
                <li key={name}>
                  <span className="demo-swatch" style={{ background: `var(--agd-color-${name})` }} aria-hidden="true" />
                  <code>{name}</code>
                  <span className="demo-muted">{colors[name]}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <details className="demo-group">
          <summary>All {contrastPairs.length} text and background pairs in this theme</summary>
          <table className="demo-table">
            <caption className="agd-sr-only">Contrast ratio of each color pair</caption>
            <thead>
              <tr>
                <th scope="col">Foreground</th>
                <th scope="col">Background</th>
                <th scope="col">Ratio</th>
                <th scope="col">Needs</th>
              </tr>
            </thead>
            <tbody>
              {contrastPairs.map((pair) => (
                <tr key={`${pair.fg}-${pair.bg}`}>
                  <td><code>{pair.fg}</code></td>
                  <td><code>{pair.bg}</code></td>
                  <td>{contrastRatio(colors[pair.fg], colors[pair.bg]).toFixed(2)}:1</td>
                  <td>{pair.min}:1</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </section>

      <section aria-labelledby="type">
        <h2 id="type">Type</h2>
        <ul className="demo-list">
          {Object.entries(scale["font-size"]).map(([step, size]) => (
            <li key={step} style={{ fontSize: `var(--agd-font-size-${step})` }}>
              Calm tools for people and agents <code className="demo-muted">{step} · {size}</code>
            </li>
          ))}
        </ul>
        <p className="demo-mono">Mono: const agent = &#123; kind: "agent" &#125;;</p>
      </section>

      <section aria-labelledby="shape">
        <h2 id="shape">Space, radius, and shadow</h2>
        <ul className="demo-row">
          {Object.entries(scale.space).map(([step, size]) => (
            <li key={step}>
              <span className="demo-bar" style={{ width: `var(--agd-space-${step})` }} aria-hidden="true" />
              <code>{step}</code>
              <span className="demo-muted">{size}</span>
            </li>
          ))}
        </ul>
        <ul className="demo-row">
          {Object.keys(scale.radius).map((step) => (
            <li key={step}>
              <span className="demo-tile" style={{ borderRadius: `var(--agd-radius-${step})` }} aria-hidden="true" />
              <code>radius-{step}</code>
            </li>
          ))}
          {Object.keys(shadows[theme]).map((level) => (
            <li key={level}>
              <span className="demo-tile" style={{ boxShadow: `var(--agd-shadow-${level})`, borderColor: "transparent" }} aria-hidden="true" />
              <code>shadow-{level}</code>
            </li>
          ))}
        </ul>
      </section>
    </DemoShell>
  );
}
