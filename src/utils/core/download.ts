import fs from "fs";
import axios, { AxiosRequestConfig } from "axios";
import crypto from "crypto";
import Bottleneck from "bottleneck";
import progress from "progress";
import {
  createDirectory,
  mergeAndTranscodeVideos,
  streamToBuffer,
  deleteFolderRecursive,
} from "../helpers/utils";

import type { Readable } from "stream";

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

const defaultDownloadOptions: DownloadsConfig = {
  dir: "video",
  limit: 1,
  deleteTemporaryFiles: true,
};

const defaultDownloadsOptions: DownloadsConfig = {
  ...defaultDownloadOptions,
  hasKey: false,
};

export function readDownloadData(filePath: string) {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error reading downloadData.json: ${error.message}`);
    } else {
      console.error("An error occurred");
    }
    return [];
  }
}

export async function startDownload(
  url: string,
  axiosOptions: AxiosRequestConfig,
  fileName: string,
  downloadOptions_: Partial<DownloadsConfig>
): Promise<void> {
  const downloadOptions: DownloadsConfig = {
    ...defaultDownloadOptions,
    ...downloadOptions_,
  };
  if (downloadOptions.dir) {
    createDirectory(downloadOptions.dir);
  }

  const { ts, keyUrl } = await getM3u8(
    url,
    axiosOptions,
    downloadOptions.hasKey!
  );

  let key: Buffer | undefined = undefined;
  if (downloadOptions.hasKey! && keyUrl) {
    key = await getKey(keyUrl, axiosOptions);
  }

  await downloads(ts, axiosOptions, {
    ...downloadOptions,
    key,
  });

  await mergeAndTranscodeVideos(downloadOptions.dir, `${fileName}.mp4`);

  if (downloadOptions.dir && downloadOptions.deleteTemporaryFiles) {
    deleteFolderRecursive(downloadOptions.dir);
  }
}

async function fetchData(
  url: string,
  axiosOptions: AxiosRequestConfig
): Promise<any> {
  try {
    const response = await axios.get(url, axiosOptions);
    if (response.status !== 200) {
      throw new Error(`HTTPError: HTTP error while getting data from ${url}`);
    }
    if (!response.data) {
      throw new Error(`HTTPError: No valid data found at ${url}`);
    }
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`An error occurred while fetching data: ${error.message}`);
    } else {
      console.error("An unknown error occurred while fetching data.");
    }
  }
}

async function getM3u8<HasKey extends boolean = true>(
  url: string,
  axiosOptions: AxiosRequestConfig,
  hasKey: HasKey
): Promise<GetM3u8Response<HasKey>> {
  const data = (await fetchData(url, axiosOptions)) as string;
  const head = url.substring(0, url.lastIndexOf("/"));
  const ts = data.match(/(https:\/\/)?[^ \n]+\.ts/g);
  if (!ts) {
    throw new Error(`HTTPError: No valid .ts file found in ${url}`);
  }

  const keyUrl = hasKey
    ? (data.match(/URI="(.+?)"/)?.[1] as string)
    : undefined;

  if (hasKey && !keyUrl) {
    throw new Error(`HTTPError: No valid key url found in ${url}`);
  }

  ts.splice(0, 1);

  if (ts && !ts[0].includes("https")) {
    ts.forEach((v, i, arr) => {
      arr[i] = `${head}/${v}`;
    });
  }

  return {
    ts,
    keyUrl: (hasKey
      ? `${head}/${keyUrl}`
      : undefined) as GetM3u8Response<HasKey>["keyUrl"],
  };
}

async function getKey(
  url: string,
  axiosOptions: AxiosRequestConfig
): Promise<Buffer> {
  const response = await axios.get(url, {
    ...axiosOptions,
    responseType: "stream",
  });
  const dataStream = response.data as Readable;
  const key = await streamToBuffer(dataStream);
  if (key.length === 0) {
    console.error("Key not received.");
    throw new Error("Key not received.");
  }
  return key;
}

async function downloads(
  urls: string[],
  axiosOptions: AxiosRequestConfig,
  downloadOptions_: Partial<DownloadsConfig> = {}
) {
  const downloadOptions: DownloadsConfig = {
    ...defaultDownloadsOptions,
    ...downloadOptions_,
  };
  const progressBar = new progress(`Downloading [:bar] :percent :etas`, {
    width: 40,
    total: urls.length,
  });

  const limiter = new Bottleneck({
    maxConcurrent: downloadOptions.limit,
  });

  const promises = urls.map((url, currentIndex) =>
    limiter.schedule(async () => {
      const filePath = `${downloadOptions.dir ?? "."}/${currentIndex}.ts`;
      await download(url, axiosOptions, filePath, {
        ...downloadOptions,
        key: downloadOptions.key,
      });
      progressBar.tick();
    })
  );

  await Promise.all(promises).finally(() => progressBar.terminate());
}

async function download(
  url: string,
  axiosOptions: AxiosRequestConfig,
  filePath: string,
  downloadOptions_: DownloadsConfig
): Promise<void> {
  const downloadOptions: DownloadsConfig = {
    ...defaultDownloadsOptions,
    ...downloadOptions_,
  };
  try {
    const file = fs.createWriteStream(filePath);
    const response = (await fetchData(url, {
      responseType: "stream",
      ...axiosOptions,
    })) as Readable;

    const { hasKey, key } = downloadOptions;

    let transformStream: crypto.Decipher | undefined;

    if (hasKey && key) {
      transformStream = crypto.createDecipheriv(
        "aes-128-cbc",
        key,
        Buffer.alloc(16, 0)
      );
    }
    const outputStream = transformStream
      ? response.pipe(transformStream)
      : response;
    outputStream.pipe(file);

    await new Promise((resolve, reject) => {
      file.on("finish", () => {
        file.close();
        resolve(true);
      });
      file.on("error", (err) => {
        reject(err);
      });
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.log(`Error downloading from ${url}: ${error.message}`);
    } else {
      console.log(`Error downloading from ${url}: Unknown error`);
    }
  }
}
