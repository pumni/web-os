import type { Story } from '@ladle/react';
import { Badge } from '@pumni/ui/feedback';
import { Button } from '@pumni/ui/form';
import { ACCENTS, DENSITIES, GLASS_LEVELS, usePersonalization } from '@pumni/ui/identity';

export default { title: 'Identity / Personalization' };

function Row({
  label,
  active,
  options,
  onPick,
}: {
  label: string;
  active: string;
  options: readonly string[];
  onPick: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 type-label text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={option}
            size="sm"
            variant={active === option ? 'default' : 'outline'}
            onClick={() => onPick(option)}
          >
            {option}
          </Button>
        ))}
      </div>
    </div>
  );
}

export const Playground: Story = () => {
  const p = usePersonalization();

  return (
    <div className="flex flex-col gap-6">
      <Row
        label="Accent"
        active={p.accent}
        options={ACCENTS}
        onPick={(v) => p.setAccent(v as never)}
      />
      <Row
        label="Glass"
        active={p.glass}
        options={GLASS_LEVELS}
        onPick={(v) => p.setGlass(v as never)}
      />
      <Row
        label="Density"
        active={p.density}
        options={DENSITIES}
        onPick={(v) => p.setDensity(v as never)}
      />
      <div className="flex items-center gap-3 pt-2">
        <Badge tone="primary" pulse>
          primary tracks accent
        </Badge>
        <Button>Primary action</Button>
      </div>
      <p className="type-caption text-muted-foreground">
        Theme (light/dark) lives in the Ladle toolbar; accent / glass / density are driven by
        PersonalizationProvider here.
      </p>
    </div>
  );
};
