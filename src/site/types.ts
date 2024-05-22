export interface DownloadData {
  url: string;
  name?: string;
}

export interface JsonData {
  downloadData: DownloadData[];
  hasKey: boolean;
  limit: number | null;
}