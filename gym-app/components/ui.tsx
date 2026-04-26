import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary:
    "bg-indigo-500 hover:bg-indigo-400 text-white focus-visible:ring-indigo-400",
  secondary:
    "bg-white/5 hover:bg-white/10 text-neutral-100 ring-1 ring-inset ring-white/10 focus-visible:ring-white/30",
  ghost:
    "hover:bg-white/5 text-neutral-300 focus-visible:ring-white/20",
  danger:
    "bg-red-500/15 hover:bg-red-500/25 text-red-300 ring-1 ring-inset ring-red-500/30 focus-visible:ring-red-400",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={[
        "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition focus:outline-none focus-visible:ring-2 disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        className,
      ].join(" ")}
    />
  );
}

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={[
        "rounded-xl bg-[var(--surface)] ring-1 ring-inset ring-[var(--border)] p-5",
        className,
      ].join(" ")}
    />
  );
}

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "w-full px-3 py-2 rounded-md bg-[var(--surface-2)] ring-1 ring-inset ring-[var(--border)] text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500",
        className,
      ].join(" ")}
    />
  );
}

export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={[
        "w-full px-3 py-2 rounded-md bg-[var(--surface-2)] ring-1 ring-inset ring-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500",
        className,
      ].join(" ")}
    />
  );
}

export function Label({ className = "", ...props }: HTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      {...props}
      className={["block text-xs font-medium text-neutral-400 mb-1.5", className].join(" ")}
    />
  );
}
