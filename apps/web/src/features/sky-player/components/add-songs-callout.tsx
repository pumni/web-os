import { Download, Monitor, Terminal } from 'lucide-react';

import { CardWell } from '@pumni/ui';

import { ADD_SONGS_STEPS, SKY_PLAYER_LINKS, SUPPORTED_FORMATS } from '../content';

const STEP_ICONS = [Download, Terminal, Monitor] as const;

export function AddSongsCallout() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h4 className="type-heading text-sm font-semibold text-foreground">
          Importing Song Sheets
        </h4>
        <p className="type-caption text-muted-foreground">
          Follow these steps to add custom songs to your library.
        </p>
      </div>

      {/* Steps List - Vertical Timeline */}
      <ol className="relative ms-3.5 space-y-6 border-s border-border">
        {ADD_SONGS_STEPS.map((step, idx) => {
          const Icon = STEP_ICONS[idx] ?? Download;
          return (
            <li key={idx} className="ms-6">
              <span className="absolute -inset-s-3.5 flex size-7 items-center justify-center rounded-full border border-border bg-card text-primary shadow-sm">
                <Icon className="size-3.5" />
              </span>
              <div className="space-y-1 pt-0.5">
                <p className="text-xs font-bold tracking-widest text-primary uppercase">
                  Step {idx + 1}
                </p>
                <p className="type-label leading-relaxed text-foreground">
                  {idx === 0 ? (
                    <>
                      Visit{' '}
                      <a
                        href={SKY_PLAYER_LINKS.skyMusic}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-primary underline underline-offset-4 hover:text-primary/80"
                      >
                        Sky Music Nightly
                      </a>{' '}
                      and download a song in JSON, skysheet, or TXT format.
                    </>
                  ) : (
                    step
                  )}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Supported formats */}
      <div className="space-y-3 pt-2">
        <p className="type-label font-semibold text-foreground">Supported File Types</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {SUPPORTED_FORMATS.map((format) => (
            <CardWell
              key={format.ext}
              radius="lg"
              padding="sm"
              className="flex flex-col justify-between gap-0"
            >
              <div>
                <code className="mb-1.5 inline-block rounded-md border border-primary/20 bg-primary/10 px-1.5 py-0.5 font-mono text-xs font-bold text-primary">
                  {format.ext}
                </code>
                <p className="text-xs leading-relaxed text-muted-foreground">{format.note}</p>
              </div>
            </CardWell>
          ))}
        </div>
      </div>
    </div>
  );
}
