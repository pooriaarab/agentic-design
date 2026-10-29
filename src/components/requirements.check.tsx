// Type-only checks. `npm run typecheck` fails if a rule below stops holding.
import { IconButton } from "./button.js";
import { Input } from "./fields.js";

// @ts-expect-error An icon button needs an accessible label.
export const noLabel = <IconButton icon={null} />;

// @ts-expect-error A field needs a visible label. A placeholder is not enough.
export const noFieldLabel = <Input placeholder="Name" />;

// @ts-expect-error A label that is present but undefined is still no label.
export const undefinedLabel = <Input label={undefined} />;
