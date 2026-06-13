import { notFound } from "next/navigation";
import { requireUser } from "@pumni/auth";
import { getRoom } from "@/features/watch/queries";
import { WatchRoom } from "@/features/watch/components/watch-room";

interface WatchRoomPageProps {
  params: Promise<{
    roomId: string;
  }>;
}

export default async function WatchRoomPage({ params }: WatchRoomPageProps) {
  const user = await requireUser();
  const { roomId } = await params;
  const room = await getRoom(roomId);

  if (!room) {
    notFound();
  }

  return (
    <WatchRoom room={room} userId={user.id} />
  );
}
