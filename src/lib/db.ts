import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface Channel {
  id: number;
  channel_id: string;
  name: string;
  handle: string | null;
  thumbnail_url: string | null;
  added_at: string;
}

export async function getDB(): Promise<D1Database> {
  const { env } = await getCloudflareContext();
  return env.DB;
}

export async function getAllChannels(): Promise<Channel[]> {
  const db = await getDB();
  const result = await db
    .prepare("SELECT * FROM channels ORDER BY added_at DESC")
    .all<Channel>();
  return result.results;
}

export async function getChannelById(id: number): Promise<Channel | null> {
  const db = await getDB();
  const result = await db
    .prepare("SELECT * FROM channels WHERE id = ?")
    .bind(id)
    .first<Channel>();
  return result;
}

export async function addChannel(
  channelId: string,
  name: string,
  handle: string | null,
  thumbnailUrl: string | null
): Promise<Channel> {
  const db = await getDB();
  const result = await db
    .prepare(
      "INSERT INTO channels (channel_id, name, handle, thumbnail_url) VALUES (?, ?, ?, ?) RETURNING *"
    )
    .bind(channelId, name, handle, thumbnailUrl)
    .first<Channel>();
  return result!;
}

export async function deleteChannel(id: number): Promise<boolean> {
  const db = await getDB();
  const result = await db
    .prepare("DELETE FROM channels WHERE id = ?")
    .bind(id)
    .run();
  return result.meta.changes > 0;
}

export async function channelExists(channelId: string): Promise<boolean> {
  const db = await getDB();
  const result = await db
    .prepare("SELECT 1 FROM channels WHERE channel_id = ?")
    .bind(channelId)
    .first();
  return result !== null;
}

// -- Watched videos --

export async function getWatchedVideoIds(): Promise<Set<string>> {
  const db = await getDB();
  const result = await db
    .prepare("SELECT video_id FROM watched_videos")
    .all<{ video_id: string }>();
  return new Set(result.results.map((r) => r.video_id));
}

export async function markVideoWatched(videoId: string): Promise<void> {
  const db = await getDB();
  await db
    .prepare(
      "INSERT OR IGNORE INTO watched_videos (video_id) VALUES (?)"
    )
    .bind(videoId)
    .run();
}

export async function unmarkVideoWatched(videoId: string): Promise<void> {
  const db = await getDB();
  await db
    .prepare("DELETE FROM watched_videos WHERE video_id = ?")
    .bind(videoId)
    .run();
}
