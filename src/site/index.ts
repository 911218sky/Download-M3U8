import path from "path";
import { readFile } from "fs/promises";

import { DownloadDataKey, type JsonData } from "./types";

export async function getJsonData(): Promise<JsonData> {
  const filePath = path.resolve(__dirname, "..", "..", "downloadData.json");
  const data = await readFile(filePath, "utf8");
  const jsonData = JSON.parse(data);
  if (!isJsonData(jsonData)) {
    throw new Error("jsonData is not equal to DownloadData");
  }
  return jsonData;
}

export function isJsonData(data: any): data is JsonData {
  if (
    Array.isArray(data.downloadData) &&
    typeof data.hasKey === "boolean" &&
    (typeof data.limit === "number" || typeof data.limit === "undefined") &&
    (typeof data.headers === "object" || typeof data.headers === "undefined") &&
    typeof data.rootDownloadPath === "string" &&
    typeof data.deleteTemporaryFiles === "boolean"
  ) {
    for (const item of data.downloadData) {
      Object.keys(item).forEach((key) => {
        if (!DownloadDataKey.includes(key)) return false;
      });
    }
    return true;
  }
  return false;
}
