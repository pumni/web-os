export type Tier = 'free' | 'pro' | 'max';

export type Interval = 'monthly' | 'yearly';

export type Entitlements = {
  tier: Tier;
  maxActiveRooms: number | null;
  maxRoomMembers: number | null;
};
