type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'left',
}: SectionHeaderProps) {
  const alignClass = align === 'center' ? 'text-center mx-auto' : '';

  return (
    <div className={`space-y-2 max-w-2xl ${alignClass}`}>
      <span className="text-xs font-bold tracking-widest text-primary uppercase">{eyebrow}</span>
      <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">{title}</h2>
      {description ? (
        <p className={`text-muted-foreground text-sm ${align === 'center' ? 'mx-auto' : ''}`}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
