import 'server-only';
import { requireUser } from '@pumni/auth';
import { createSupabaseServiceRoleClient } from '@pumni/supabase/service-role';
import { cacheLife, cacheTag } from 'next/cache';
import type { Entitlements, Tier } from './types';


export async function getEntitlements(): Promise<Entitlements> {
  const user = await requireUser();
  return getEntitlementsForUser(user.id);
}

export async function getEntitlementsForUser(userId: string): Promise<Entitlements> {
  'use cache';
  cacheTag(`entitlements:${userId}`);
  cacheLife('minutes');

  try {
    const supabase = createSupabaseServiceRoleClient();
    const { data, error } = await supabase
      .rpc('get_user_entitlements', { p_user: userId });

    if (error || !data || data.length === 0) {
      if (error) {
        console.error(`Failed to fetch entitlements for user ${userId}:`, error);
      }
      return {
        tier: 'free',
        maxActiveRooms: 1,
        maxRoomMembers: 5,
      };
    }

    const row = data[0];
    if (!row) {
      return {
        tier: 'free',
        maxActiveRooms: 1,
        maxRoomMembers: 5,
      };
    }
    return {
      tier: (row.tier as Tier) || 'free',
      maxActiveRooms: row.max_active_rooms,
      maxRoomMembers: row.max_room_members,
    };
  } catch (err) {
    console.error(`Exception while fetching entitlements for user ${userId}:`, err);
    return {
      tier: 'free',
      maxActiveRooms: 1,
      maxRoomMembers: 5,
    };
  }
}

export async function getPlans() {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from('plans')
    .select('tier, max_active_rooms, max_room_members')
    .order('tier');

  if (error) {
    console.error('Failed to fetch plans:', error);
    throw error;
  }
  return data || [];
}
