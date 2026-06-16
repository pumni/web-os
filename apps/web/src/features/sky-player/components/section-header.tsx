import type { LucideIcon } from 'lucide-react';

type SectionHeaderProps = {
  id?: string;
  eyebrow: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
};

export function SectionHeader({
  id,
  eyebrow,
  title,
  description,
  icon: Icon,
}: SectionHeaderProps) {
  return (
    <header id={id} className="space-y-3">
      <div className="flex items-center gap-2">
        {Icon ? (
          <div className="flex size-5 shrink-0 items-center justify-center text-primary">
            <Icon className="size-4" aria-hidden />
          </div>
        ) : null}
        <span className="type-caption font-bold tracking-widest text-primary uppercase">
          {eyebrow}
        </span>
      </div>

      <h2 className="type-title text-balance text-foreground">
        {title}
      </h2>

      {description ? (
        <p className="type-body max-w-2xl text-pretty text-muted-foreground">
          {description}
        </p>
      ) : null}
    </header>
  );
}
