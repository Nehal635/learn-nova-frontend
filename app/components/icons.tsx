import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function IconBase({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const Icons = {
  spark: (props: IconProps) => (
    <IconBase {...props}><path d="m12 3 1.5 5.2L19 10l-5.5 1.8L12 17l-1.5-5.2L5 10l5.5-1.8L12 3Z"/><path d="m19 16 .6 2.1L22 19l-2.4.9L19 22l-.6-2.1L16 19l2.4-.9L19 16Z"/></IconBase>
  ),
  home: (props: IconProps) => (
    <IconBase {...props}><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/></IconBase>
  ),
  quiz: (props: IconProps) => (
    <IconBase {...props}><path d="M8 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M4 7H2M4 12H2M4 17H2M10 8h6M10 12h6M10 16h4"/></IconBase>
  ),
  history: (props: IconProps) => (
    <IconBase {...props}><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></IconBase>
  ),
  users: (props: IconProps) => (
    <IconBase {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></IconBase>
  ),
  settings: (props: IconProps) => (
    <IconBase {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></IconBase>
  ),
  logout: (props: IconProps) => (
    <IconBase {...props}><path d="M10 17l5-5-5-5M15 12H3M15 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/></IconBase>
  ),
  arrow: (props: IconProps) => (
    <IconBase {...props}><path d="M5 12h14M13 6l6 6-6 6"/></IconBase>
  ),
  chart: (props: IconProps) => (
    <IconBase {...props}><path d="M4 19V9M10 19V5M16 19v-7M22 19V3"/></IconBase>
  ),
  clock: (props: IconProps) => (
    <IconBase {...props}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></IconBase>
  ),
  check: (props: IconProps) => (
    <IconBase {...props}><path d="m5 12 4 4L19 6"/></IconBase>
  ),
  plus: (props: IconProps) => (
    <IconBase {...props}><path d="M12 5v14M5 12h14"/></IconBase>
  ),
  book: (props: IconProps) => (
    <IconBase {...props}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></IconBase>
  ),
  menu: (props: IconProps) => (
    <IconBase {...props}><path d="M4 7h16M4 12h16M4 17h16"/></IconBase>
  ),
  close: (props: IconProps) => (
    <IconBase {...props}><path d="m6 6 12 12M18 6 6 18"/></IconBase>
  ),
};
