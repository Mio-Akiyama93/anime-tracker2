import { Anime, WatchlistItem, WatchStatus, User } from '../types';

const ANILIST_API_URL = 'https://graphql.anilist.co';

// --- Status Mapping Utilities ---

/**
 * Maps AniList API status strings to the app's internal WatchStatus enum.
 * @param apiStatus The status string from the AniList API (e.g., "CURRENT").
 * @returns The corresponding WatchStatus enum member, or null if unmappable.
 */
const mapApiStatusToWatchStatus = (apiStatus: string | null): WatchStatus | null => {
    if (!apiStatus) return null;
    switch(apiStatus) {
        case 'CURRENT':
        case 'REPEATING':
            return WatchStatus.Watching;
        case 'PLANNING':
            return WatchStatus.PlanToWatch;
        case 'COMPLETED':
            return WatchStatus.Completed;
        case 'DROPPED':
            return WatchStatus.Dropped;
        case 'PAUSED':
            return WatchStatus.Paused;
        default:
            return null; // Ignore unknown statuses
    }
};

/**
 * Maps the app's internal WatchStatus enum to AniList API status strings.
 * @param status The internal WatchStatus enum member.
 * @returns The corresponding AniList API status string.
 */
const mapWatchStatusToApiStatus = (status: WatchStatus): string => {
    switch (status) {
        case WatchStatus.Watching: return 'CURRENT';
        case WatchStatus.PlanToWatch: return 'PLANNING';
        case WatchStatus.Completed: return 'COMPLETED';
        case WatchStatus.Dropped: return 'DROPPED';
        case WatchStatus.Paused: return 'PAUSED';
    }
};


// Reusable fetch function
async function fetchAniListAPI(query: string, variables: object, token?: string) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method: 'POST',
    headers,
    mode: 'cors' as RequestMode,
    body: JSON.stringify({
      query,
      variables,
    }),
  };

  const response = await fetch(ANILIST_API_URL, options);

  if (response.status === 429) {
      console.error("AniList API Error: Rate limited (429)");
      throw new Error("Too many requests to AniList. Please wait a moment and try again.");
  }

  const json = await response.json().catch(() => ({})); // Attempt to parse JSON, default to empty object on failure

  if (!response.ok || json.errors) {
      const errorMessages = json.errors?.map((e: any) => e.message).join(', ') || `HTTP ${response.status}: ${response.statusText}`;
      
      console.error("AniList API Error:", {
          status: response.status,
          errors: json.errors || "No GraphQL error details provided.",
      });

      // Prefer the GraphQL error message if it exists
      throw new Error(`AniList API error: ${errorMessages}`);
  }
  
  return json.data;
}

// --- Queries ---

const ANIME_SEARCH_QUERY = `
query ($search: String, $page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    media(search: $search, type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
      id
      title { romaji english native }
      coverImage { extraLarge color }
      bannerImage
      description(asHtml: false)
      episodes
      status
      averageScore
      genres
      type
      duration
      startDate { year month day }
      endDate { year month day }
      season
      seasonYear
      studios(isMain: true) { nodes { name } }
      externalLinks { site url }
    }
  }
}
`;

const ANIME_DETAIL_QUERY = `
query ($id: Int) {
  Media(id: $id, type: ANIME) {
    id
    title { romaji english native }
    coverImage { extraLarge color }
    bannerImage
    description(asHtml: false)
    episodes
    status
    averageScore
    genres
    type
    duration
    startDate { year month day }
    endDate { year month day }
    season
    seasonYear
    studios(isMain: true) { nodes { name } }
    externalLinks { site url }
    relations {
      edges {
        relationType(version: 2)
        node { id title { romaji english } coverImage { extraLarge color } type status }
      }
    }
    recommendations(sort: RATING_DESC, perPage: 12) {
      nodes {
        rating
        mediaRecommendation { id title { romaji english } coverImage { extraLarge color } type status }
      }
    }
  }
}
`;

const GET_VIEWER_PROFILE_QUERY = `
query {
  Viewer {
    id
    name
    avatar {
      large
    }
    statistics {
      anime {
        count
        episodesWatched
        minutesWatched
        statuses {
          status
          count
        }
      }
    }
  }
}
`;

const GET_WATCHLIST_COLLECTION_QUERY = `
query ($userId: Int) {
  MediaListCollection(userId: $userId, type: ANIME) {
    lists {
      name
      isCustomList
      status
      entries {
        id
        status
        progress
        media {
          id
          title { romaji english native }
          coverImage { extraLarge color }
          bannerImage
          description(asHtml: false)
          episodes
          status
          averageScore
          genres
          type
          duration
          startDate { year month day }
          endDate { year month day }
          season
          seasonYear
          studios(isMain: true) { nodes { name } }
          externalLinks { site url }
        }
      }
    }
  }
}
`;


// --- Mutations ---

const SAVE_MEDIA_LIST_ENTRY = `
mutation ($mediaId: Int, $status: MediaListStatus, $progress: Int) {
  SaveMediaListEntry(mediaId: $mediaId, status: $status, progress: $progress) {
    id
    status
    progress
  }
}
`;

const DELETE_MEDIA_LIST_ENTRY = `
mutation ($id: Int) {
    DeleteMediaListEntry(id: $id) {
        deleted
    }
}
`;

// --- Public Functions ---

export async function searchAnime(query: string): Promise<Anime[]> {
  const data = await fetchAniListAPI(ANIME_SEARCH_QUERY, { search: query, page: 1, perPage: 24 });
  return data.Page.media;
}

export async function getAnimeDetails(id: number): Promise<Anime> {
  const data = await fetchAniListAPI(ANIME_DETAIL_QUERY, { id });
  return data.Media;
}

export async function getViewerProfile(token: string): Promise<User> {
    const data = await fetchAniListAPI(GET_VIEWER_PROFILE_QUERY, {}, token);
    const viewer = data.Viewer;

    // Map the status enums from API values to our internal WatchStatus values
    if (viewer.statistics?.anime?.statuses) {
        viewer.statistics.anime.statuses = viewer.statistics.anime.statuses
            .map((s: { status: string; count: number }) => {
                const mappedStatus = mapApiStatusToWatchStatus(s.status);
                return mappedStatus ? { count: s.count, status: mappedStatus } : null;
            })
            .filter((s: any): s is { status: WatchStatus; count: number } => s !== null);
    }
    
    return viewer as User;
}

export async function getWatchlist(userId: number, token: string): Promise<WatchlistItem[]> {
    const variables = { userId };
    const data = await fetchAniListAPI(GET_WATCHLIST_COLLECTION_QUERY, variables, token);

    const allWatchlistItems: WatchlistItem[] = [];
    // This global set prevents the same anime from appearing on multiple lists (e.g., Watching and Completed), which would cause UI duplication.
    const seenAnimeIds = new Set<number>();
    
    const lists = data.MediaListCollection?.lists || [];

    // Define a priority order for statuses. If an anime appears in multiple lists due to an API bug,
    // this ensures we pick the most "active" status.
    const statusPriority: Record<string, number> = {
        'CURRENT': 1,
        'REPEATING': 2,
        'PAUSED': 3,
        'PLANNING': 4,
        'COMPLETED': 5,
        'DROPPED': 6,
    };

    // Sort lists by our defined priority to handle duplicates predictably.
    lists.sort((a: any, b: any) => {
        if (!a.status || !b.status) return 0;
        return (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99);
    });

    for (const list of lists) {
        // We only care about main, non-custom lists which have a status.
        if (list.isCustomList || !list.status) {
            continue;
        }

        const mappedStatus = mapApiStatusToWatchStatus(list.status);
        if (!mappedStatus) {
            continue;
        }

        const entries = list.entries || [];
        for (const entry of entries) {
            if (!entry.media) {
                continue; // Skip malformed entries
            }

            // If we've already added this anime from a higher-priority list, skip it.
            if (seenAnimeIds.has(entry.media.id)) {
                continue;
            }

            seenAnimeIds.add(entry.media.id);
            allWatchlistItems.push({
                mediaListId: entry.id,
                anime: entry.media,
                status: mappedStatus, // Use the status of the list itself for consistency
                watchedEpisodes: entry.progress,
            });
        }
    }

    return allWatchlistItems;
}

export async function saveWatchlistItem(
    animeId: number,
    status: WatchStatus,
    watchedEpisodes: number,
    token: string
): Promise<{id: number, status: WatchStatus, progress: number}> {
    const variables = {
        mediaId: animeId,
        status: mapWatchStatusToApiStatus(status),
        progress: watchedEpisodes,
    };
    const data = await fetchAniListAPI(SAVE_MEDIA_LIST_ENTRY, variables, token);
    const savedEntry = data.SaveMediaListEntry;
    const mappedStatus = mapApiStatusToWatchStatus(savedEntry.status);

    if (!mappedStatus) {
        throw new Error(`Received unmappable status '${savedEntry.status}' from API after saving.`);
    }

    return {
        id: savedEntry.id,
        status: mappedStatus,
        progress: savedEntry.progress,
    };
}

export async function deleteWatchlistItem(mediaListId: number, token: string): Promise<boolean> {
    const data = await fetchAniListAPI(DELETE_MEDIA_LIST_ENTRY, { id: mediaListId }, token);
    return data.DeleteMediaListEntry.deleted;
}