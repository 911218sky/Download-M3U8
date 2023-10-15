import { AxiosRequestConfig } from "axios";
import path from "path";
import { readDownloadData } from "../utils/core/download";

export interface DownloadData {
  url: string;
  name: string | undefined;
}

export interface JsonData {
  downloadData: DownloadData[];
  hasKey: boolean;
  limit: number | null;
}

export const options: AxiosRequestConfig = {
  headers: {
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
    // 動漫風
    origin: "https://ani.gamer.com.tw",
    referer: "https://ani.gamer.com.tw/animeVideo.php?sn=33944",
    // missav
    // origin: "https://missav.com",
    // referer: "https://missav.com/rki-613",
  },
};

export function getJsonData(): JsonData {
  const jsonData = readDownloadData(
    path.resolve(__dirname, "..", "..", "downloadData.json")
  );
  if (!isJsonData(jsonData)) {
    throw new Error("jsonData is not equal to DownloadData");
  }
  return jsonData;
}

export function isDownloadData(data: any): data is DownloadData {
  return (
    typeof data.url === "string" &&
    (data.name === undefined || typeof data.name === "string")
  );
}

export function isJsonData(data: any): data is JsonData {
  if (
    Array.isArray(data.downloadData) &&
    typeof data.hasKey === "boolean" &&
    (data.limit === null || typeof data.limit === "number")
  ) {
    for (const item of data.downloadData) {
      if (!isDownloadData(item)) return false;
    }
    return true;
  }
  return false;
}
