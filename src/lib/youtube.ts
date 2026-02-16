import { XMLParser } from "fast-xml-parser";

export interface VideoEntry {
  videoId: string;
  title: string;
  link: string;
  thumbnail: string;
  channelName: string;
  channelId: string;
  publishedAt: string;
  description: string;
}

export interface ChannelInfo {
  channelId: string;
  name: string;
  handle: string | null;
  thumbnailUrl: string | null;
}

/**
 * Resolves a YouTube channel URL to a channel ID and metadata.
 * Supports formats:
 *   - https://www.youtube.com/@handle
 *   - https://www.youtube.com/channel/UC...
 *   - https://www.youtube.com/c/name
 */
export async function resolveChannel(url: string): Promise<ChannelInfo> {
  const parsed = new URL(url);

  if (
    !parsed.hostname.includes("youtube.com") &&
    !parsed.hostname.includes("youtu.be")
  ) {
    throw new Error("Invalid URL: not a YouTube link");
  }

  const pathParts = parsed.pathname.split("/").filter(Boolean);

  // Direct channel ID format: /channel/UC...
  if (pathParts[0] === "channel" && pathParts[1]?.startsWith("UC")) {
    const channelId = pathParts[1];
    const info = await fetchChannelInfoFromRSS(channelId);
    return {
      channelId,
      name: info.name,
      handle: info.handle,
      thumbnailUrl: info.thumbnailUrl,
    };
  }

  // Handle format: /@handle or /c/name or /user/name
  // We need to fetch the page to get the channel ID
  const channelId = await scrapeChannelId(url);
  if (!channelId) {
    throw new Error(
      "Could not find the channel. Check the URL and try again."
    );
  }

  const info = await fetchChannelInfoFromRSS(channelId);
  return {
    channelId,
    name: info.name,
    handle: extractHandle(url),
    thumbnailUrl: info.thumbnailUrl,
  };
}

/**
 * Scrapes the YouTube channel page HTML to extract the channel ID.
 *
 * Patterns are ordered by reliability. Generic patterns like "channelId"
 * appear everywhere in the page (recommendations, featured channels, etc.)
 * and can match the wrong channel. The RSS link and meta tags are specific
 * to the page owner.
 */
async function scrapeChannelId(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    // 1. RSS feed link -- most reliable, always points to the page's own channel
    const rssMatch = html.match(
      /<link[^>]+type="application\/rss\+xml"[^>]+href="[^"]*channel_id=(UC[a-zA-Z0-9_-]{22})"/ 
    );
    if (rssMatch) return rssMatch[1];

    // 2. Meta itemprop channelId -- specific to the page owner
    const metaMatch = html.match(
      /<meta\s+itemprop="channelId"\s+content="(UC[a-zA-Z0-9_-]{22})"/
    );
    if (metaMatch) return metaMatch[1];

    // 3. Canonical link with /channel/ path
    const canonicalMatch = html.match(
      /<link\s+rel="canonical"\s+href="https:\/\/www\.youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{22})"/
    );
    if (canonicalMatch) return canonicalMatch[1];

    // 4. externalId in the page's initial data header
    const externalIdMatch = html.match(
      /"externalId":"(UC[a-zA-Z0-9_-]{22})"/
    );
    if (externalIdMatch) return externalIdMatch[1];

    // 5. Header renderer channelId -- specific to the channel page header
    const headerMatch = html.match(
      /"c4TabbedHeaderRenderer":\{[^}]*"channelId":"(UC[a-zA-Z0-9_-]{22})"/
    );
    if (headerMatch) return headerMatch[1];

    // 6. Last resort: browse endpoint tied to the channel's own canonical URL
    const handlePath = new URL(url).pathname;
    const browsePattern = new RegExp(
      `"browseId":"(UC[a-zA-Z0-9_-]{22})"[^}]*"canonicalBaseUrl":"${handlePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`
    );
    const browseMatch = html.match(browsePattern);
    if (browseMatch) return browseMatch[1];

    return null;
  } catch {
    return null;
  }
}

function extractHandle(url: string): string | null {
  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    if (pathParts[0]?.startsWith("@")) {
      return pathParts[0];
    }
    if (pathParts[0] === "c" && pathParts[1]) {
      return pathParts[1];
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetches basic channel info from the RSS feed (name).
 * Also fetches the channel page for the thumbnail.
 */
async function fetchChannelInfoFromRSS(
  channelId: string
): Promise<{ name: string; handle: string | null; thumbnailUrl: string | null }> {
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  const response = await fetch(rssUrl);

  if (!response.ok) {
    throw new Error("Channel not found on YouTube");
  }

  const xml = await response.text();
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });
  const data = parser.parse(xml);

  const feed = data.feed;
  const name = feed?.author?.name || feed?.title || "Unknown channel";

  // Try to get thumbnail from the channel page
  let thumbnailUrl: string | null = null;
  try {
    const pageResponse = await fetch(
      `https://www.youtube.com/channel/${channelId}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      }
    );
    const html = await pageResponse.text();
    const thumbMatch = html.match(
      /"avatar":\{"thumbnails":\[.*?\{"url":"(https:\/\/yt3\.googleusercontent\.com\/[^"]+)"/
    );
    if (thumbMatch) {
      thumbnailUrl = thumbMatch[1];
    }
  } catch {
    // Thumbnail is optional
  }

  return { name, handle: null, thumbnailUrl };
}

/**
 * Fetches the RSS feed for a channel and returns parsed video entries.
 */
export async function fetchChannelFeed(
  channelId: string
): Promise<VideoEntry[]> {
  try {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const response = await fetch(rssUrl);

    if (!response.ok) {
      console.error(`Failed to fetch RSS for ${channelId}: ${response.status}`);
      return [];
    }

    const xml = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    });
    const data = parser.parse(xml);

    const feed = data.feed;
    if (!feed || !feed.entry) {
      return [];
    }

    const entries = Array.isArray(feed.entry) ? feed.entry : [feed.entry];
    const channelName = feed.author?.name || feed.title || "Unknown";

    return entries.map((entry: Record<string, unknown>) => {
      const videoId = (entry["yt:videoId"] as string) || "";
      const mediaGroup = entry["media:group"] as Record<string, unknown> | undefined;
      const mediaThumbnail = mediaGroup?.["media:thumbnail"] as Record<string, string> | undefined;

      return {
        videoId,
        title: (mediaGroup?.["media:title"] as string) || (entry.title as string) || "",
        link: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnail:
          mediaThumbnail?.["@_url"] ||
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        channelName,
        channelId,
        publishedAt: (entry.published as string) || "",
        description: (mediaGroup?.["media:description"] as string) || "",
      };
    });
  } catch (error) {
    console.error(`Error fetching feed for ${channelId}:`, error);
    return [];
  }
}
