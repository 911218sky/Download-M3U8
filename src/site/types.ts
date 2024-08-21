export interface DownloadData {
  url?: string;
  name?: string;
  m3u8Path?: string;
  m3u8Prefix?: string;
}

export interface JsonData {
  downloadData: DownloadData[];
  hasKey: boolean;
  limit: number | null;
  rootDownloadPath: string;
  deleteTemporaryFiles: boolean;
}

export const DownloadDataKey = ["url", "name", "m3u8Path", "m3u8Prefix"];