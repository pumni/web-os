'use client';

import { Download, Monitor, Terminal } from 'lucide-react';
import * as React from 'react';

import { Card } from '@pumni/ui';

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
      <ol className="relative border-s border-border ms-3.5 space-y-6">
        {ADD_SONGS_STEPS.map((step, idx) => {
          const Icon = STEP_ICONS[idx] ?? Download;
          return (
            <li key={idx} className="ms-6">
              <span className="absolute -inset-s-3.5 flex size-7 items-center justify-center rounded-full border border-border bg-card text-primary shadow-sm">
                <Icon className="size-3.5" />
              </span>
              <div className="space-y-1 pt-0.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  Step {idx + 1}
                </p>
                <p className="type-label text-foreground leading-relaxed">
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
            <Card
              key={format.ext}
              variant="inset"
              className="p-3 gap-0 rounded-lg flex flex-col justify-between"
            >
              <div>
                <code className="inline-block rounded-md border border-primary/20 bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary mb-1.5">
                  {format.ext}
                </code>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{format.note}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
