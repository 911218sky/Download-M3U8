export interface GetM3u8Response<HasKey extends boolean = true> {
  ts: string[];
  keyUrl: HasKey extends true ? string : undefined;
}

export interface DownloadsConfig {
  dir: string;
  limit?: number;
  deleteTemporaryFiles?: boolean;
  hasKey?: boolean;
  key?: Buffer | undefined;
}