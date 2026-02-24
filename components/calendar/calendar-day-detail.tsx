'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { CalendarProject } from '@/types/calendar';
import { getThresholdBadge } from '@/types/calendar';

interface CalendarDayDetailProps {
  date: Date;
  projects: CalendarProject[];
}

export function CalendarDayDetail({ date, projects }: CalendarDayDetailProps) {
  const dateStr = date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const sortedProjects = [...projects].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <Card className="p-4 min-h-[400px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">{dateStr}</h2>
          <p className="text-sm text-muted-foreground">
            {projects.length} project{projects.length !== 1 ? 's' : ''} due
          </p>
        </div>
      </div>

      {/* Projects list */}
      <div className="space-y-3">
        {sortedProjects.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No projects due on this date
          </div>
        ) : (
          sortedProjects.map(project => {
            const badge = getThresholdBadge(project.thresholdState);
            return (
              <Card
                key={project.id}
                className="p-4 cursor-pointer hover:border-primary transition-colors"
                style={badge.label ? { borderLeft: `3px solid ${badge.color}` } : undefined}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{project.title}</h3>
                      {badge.label && (
                        <Badge
                          variant="outline"
                          style={{ borderColor: badge.color, color: badge.color }}
                        >
                          {badge.icon} {badge.label}
                        </Badge>
                      )}
                    </div>
                    {project.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs capitalize">
                        {project.priority}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {project.column.replace('-', ' ')}
                      </Badge>
                      {project.assignee && (
                        <span className="text-xs text-muted-foreground">
                          @{project.assignee}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </Card>
  );
}
