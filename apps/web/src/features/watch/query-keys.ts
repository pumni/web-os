export const watchKeys = {
  all: ['watch'] as const,
  rooms: () => [...watchKeys.all, 'room'] as const,
  room: (roomId: string) => [...watchKeys.rooms(), roomId] as const,
  queues: () => [...watchKeys.all, 'queue'] as const,
  queue: (roomId: string) => [...watchKeys.queues(), roomId] as const,
};
