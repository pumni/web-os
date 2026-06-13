import "server-only";

export interface JellyfinUserData {
  PlaybackPositionTicks: number;
  PlayCount: number;
  IsFavorite: boolean;
  LastPlayedDate?: string;
  Played: boolean;
  Key?: string;
}

export interface JellyfinImageTags {
  Primary?: string;
  Backdrop?: string;
  Thumb?: string;
  Logo?: string;
}

export interface JellyfinItem {
  Id: string;
  Name: string;
  Overview?: string;
  Type: "Movie" | "Series" | "Season" | "Episode";
  ImageTags?: JellyfinImageTags;
  UserData?: JellyfinUserData;
  RunTimeTicks?: number;
  Genres?: string[];
  CommunityRating?: number;
  ProductionYear?: number;
  Path?: string;
}

export interface JellyfinLibraryResult {
  Items: JellyfinItem[];
  TotalRecordCount: number;
  StartIndex: number;
}

export interface JellyfinMediaStream {
  Type: "Video" | "Audio" | "Subtitle" | "EmbeddedImage" | "Data";
  Codec?: string;
  Index: number;
  Language?: string;
  DisplayTitle?: string;
  Width?: number;
  Height?: number;
  AverageFrameRate?: number;
  RealFrameRate?: number;
  IsExternal?: boolean;
}

export interface JellyfinMediaSource {
  Id: string;
  Container?: string;
  Bitrate?: number;
  MediaStreams?: JellyfinMediaStream[];
  SupportsDirectPlay?: boolean;
  SupportsDirectStream?: boolean;
  SupportsTranscoding?: boolean;
}

export interface JellyfinPlaybackInfo {
  MediaSources?: JellyfinMediaSource[];
  PlaySessionId?: string;
}

/** Result of `POST /Users/AuthenticateByName`. */
export interface JellyfinAuthResult {
  AccessToken: string;
  User: { Id: string; Name: string };
}

/** Scoped credential handed to the browser player (never the admin API key). */
export interface JellyfinStreamingToken {
  accessToken: string;
  userId: string;
}
