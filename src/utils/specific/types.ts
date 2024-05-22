export interface M3u8Response {
  src?: string;
  error?: {
    code: number;
    message: string;
    state: string;
    details: string[];
  };
}

export interface VideoQuality {
  "360p": string | null;
  "540p": string | null;
  "720p": string | null;
  "1080p": string | null;
}

export interface GetM3u8Config {
  videoQuality?: keyof VideoQuality;
}
