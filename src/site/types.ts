export interface DownloadData {
  url: string;
  name?: string;
  m3u8Path?: string;
}

export interface JsonData {
  downloadData: DownloadData[];
  hasKey: boolean;
  limit: number | null;
  rootDownloadPath: string;
}
