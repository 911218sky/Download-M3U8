import path from "path";
import { readFile } from "fs/promises";
import { AxiosRequestConfig } from "axios";

import type { DownloadData, JsonData } from "./types";

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

export async function getJsonData(): Promise<JsonData> {
  const filePath = path.resolve(__dirname, "..", "..", "downloadData.json");
  const data = await readFile(filePath, "utf8");
  const jsonData = JSON.parse(data);
  if (!isJsonData(jsonData)) {
    throw new Error("jsonData is not equal to DownloadData");
  }
  return jsonData;
}

export function isDownloadData(data: any): data is DownloadData {
  return typeof data.url === "string" && (typeof data.name === "string" || data.name === undefined);
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
