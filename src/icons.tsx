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
export const MenuIcon = (p: SVGProps<SVGSVGElement>) => <Icon d="M3.5 5.5h13M3.5 10h13M3.5 14.5h13" {...p} />;
export const FileIcon = (p: SVGProps<SVGSVGElement>) => <Icon d="M5 2.5h6l4 4v11H5zM11 2.5v4h4" {...p} />;
export const FolderIcon = (p: SVGProps<SVGSVGElement>) => <Icon d="M2.5 5.5h5l1.5 2h8.5v8h-15z" {...p} />;
export const BotIcon = (p: SVGProps<SVGSVGElement>) => <Icon d="M4 7.5h12v8a1 1 0 01-1 1H5a1 1 0 01-1-1zM10 7.5v-3M7.5 11.5h.01M12.5 11.5h.01" {...p} />;
export const ErrorIcon = (p: SVGProps<SVGSVGElement>) => <Icon d="M7.5 7.5l5 5M12.5 7.5l-5 5M10 2.5a7.5 7.5 0 100 15 7.5 7.5 0 000-15z" {...p} />;
export const SearchIcon = (p: SVGProps<SVGSVGElement>) => <Icon d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM13 13l3.5 3.5" {...p} />;
export const SlidersIcon = (p: SVGProps<SVGSVGElement>) => <Icon d="M3.5 6h8M15 6h1.5M3.5 14h1.5M8.5 14h8M13 4v4M7 12v4" {...p} />;
export const PanelLeftIcon = (p: SVGProps<SVGSVGElement>) => <Icon d="M3.5 4.5h13v11h-13zM8 4.5v11" {...p} />;
