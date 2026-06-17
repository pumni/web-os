import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

import { Button, Card } from '@pumni/ui';

import { quickActions } from './dashboard-meta';

/**
 * Quick actions strip — single-row nav beneath the Bento grid. Surfaces the
 * same destinations that already live in the sidebar + topbar so the
 * dashboard is honest about the routes the shell owns.
 */
export function QuickActions() {
  return (
    <nav aria-label="Quick actions">
      <Card variant="inset" className="px-4 py-4 sm:px-6">
        <ul className="flex flex-wrap items-center gap-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <li key={action.id}>
                <Button asChild variant="ghost" size="sm">
                  {action.external ? (
                    <a
                      href={action.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5"
                    >
                      <Icon className="size-4" />
                      <span>{action.label}</span>
                      <ArrowUpRight className="size-3.5 opacity-70" aria-hidden />
                    </a>
                  ) : (
                    <Link href={action.href} className="inline-flex items-center gap-1.5">
                      <Icon className="size-4" />
                      <span>{action.label}</span>
                    </Link>
                  )}
                </Button>
              </li>
            );
          })}
        </ul>
      </Card>
    </nav>
  );
}
