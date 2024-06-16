export interface GetM3u8Response<HasKey extends boolean = true> {
  ts: string[];
  keyUrl: HasKey extends true ? string : undefined;
  m3u8Path?: string;
}

export interface DownloadsConfig {
  rootDownloadPath: string;
  limit?: number;
  deleteTemporaryFiles?: boolean;
  hasKey?: boolean;
  key?: Buffer | undefined;
  m3u8Path?: string;
}
