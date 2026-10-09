import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 font-semibold tracking-tight">
      <span className="logo-mark grid size-8 place-items-center rounded-xl bg-accent-soft text-accent-strong">
        ♥
      </span>
      <span>Couple</span>
    </Link>
  );
}
