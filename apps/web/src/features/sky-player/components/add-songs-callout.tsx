import { Card, CardContent } from '@pumni/ui';

import { ADD_SONGS_STEPS, SUPPORTED_FORMATS, SKY_PLAYER_LINKS } from '../content';

export function AddSongsCallout() {
  return (
    <div className="space-y-6">
      <Card variant="solid">
        <CardContent className="space-y-4 p-5">
          <h3 className="text-sm font-bold text-foreground">Adding songs to your library</h3>
          <ol className="space-y-2">
            {ADD_SONGS_STEPS.map((step, idx) => (
              <li key={idx} className="flex gap-3 text-sm text-muted-foreground">
                <span className="shrink-0 font-bold text-primary">{idx + 1}.</span>
                <span>
                  {idx === 0 ? (
                    <>
                      Visit{' '}
                      <a
                        href={SKY_PLAYER_LINKS.skyMusic}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary underline-offset-4 hover:underline"
                      >
                        Sky Music Nightly
                      </a>{' '}
                      and download a song in JSON, skysheet, or TXT format.
                    </>
                  ) : (
                    step
                  )}
                </span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        {SUPPORTED_FORMATS.map((format) => (
          <Card key={format.ext} variant="inset">
            <CardContent className="space-y-1 p-4">
              <code className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                {format.ext}
              </code>
              <p className="text-xs text-muted-foreground leading-relaxed">{format.note}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
