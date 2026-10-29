import type { SVGProps } from "react";

// Icons are decorative. The control that holds one carries the accessible name.
function Icon(props: SVGProps<SVGSVGElement> & { d: string }) {
  const { d, ...rest } = props;
  return (
    <svg
      viewBox="0 0 20 20"
      width="1.25em"
      height="1.25em"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d={d} />
    </svg>
  );
}

export const CloseIcon = (p: SVGProps<SVGSVGElement>) => <Icon d="M5 5l10 10M15 5L5 15" {...p} />;
export const AlertIcon = (p: SVGProps<SVGSVGElement>) => <Icon d="M10 6v5M10 14h.01M10 2.5l8 14H2z" {...p} />;
export const CheckIcon = (p: SVGProps<SVGSVGElement>) => <Icon d="M4 10.5l4 4 8-9" {...p} />;
export const PlusIcon = (p: SVGProps<SVGSVGElement>) => <Icon d="M10 4v12M4 10h12" {...p} />;
export const MoreIcon = (p: SVGProps<SVGSVGElement>) => <Icon d="M4.5 10h.01M10 10h.01M15.5 10h.01" strokeWidth="3" {...p} />;
export const InfoIcon = (p: SVGProps<SVGSVGElement>) => <Icon d="M10 9v5M10 6h.01M10 2.5a7.5 7.5 0 100 15 7.5 7.5 0 000-15z" {...p} />;
export const ErrorIcon = (p: SVGProps<SVGSVGElement>) => <Icon d="M7.5 7.5l5 5M12.5 7.5l-5 5M10 2.5a7.5 7.5 0 100 15 7.5 7.5 0 000-15z" {...p} />;
