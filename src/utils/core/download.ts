import fs from "fs";
import path from "path";
import axios from "axios";
import crypto from "crypto";
import Bottleneck from "bottleneck";
import cliProgress from "cli-progress";

import {
  mergeAndTranscodeVideos,
  streamToBuffer,
  deleteFolderRecursive,
  createDirectoryRecursively,
} from "@utils/helpers/utils";

import type { AxiosInstance, AxiosRequestConfig } from "axios";
import type { Readable } from "stream";
import type { DownloadsConfig, GetM3u8Response } from "./types";

export async function startDownload(
  url: string,
  axiosOptions: AxiosRequestConfig,
  fileName: string,
  downloadOptions: DownloadsConfig
): Promise<void> {
  let {
    rootDownloadPath,
    deleteTemporaryFiles = true,
    hasKey = false,
    key,
    m3u8Path,
  } = downloadOptions;
  const folderPath = path.join(rootDownloadPath, fileName);
  createDirectoryRecursively(folderPath);

  const { ts, keyUrl } = await getM3u8(url, axiosOptions, hasKey, m3u8Path);

  if (hasKey && keyUrl) {
    key = await getKey(keyUrl, axiosOptions);
  }

  await downloads(ts, axiosOptions, {
    ...downloadOptions,
    rootDownloadPath: folderPath,
    key,
  });

  await mergeAndTranscodeVideos(
    folderPath,
    rootDownloadPath,
    `${fileName}.mp4`
  );

  if (deleteTemporaryFiles) {
    deleteFolderRecursive(folderPath);
  }
}

async function fetchData(
  url: string,
  axiosInstance: AxiosInstance
): Promise<any> {
  try {
    const response = await axiosInstance.get(url);
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
  hasKey: HasKey,
  m3u8Path?: string
): Promise<GetM3u8Response<HasKey>> {
  const axiosInstance = axios.create(axiosOptions);
  const data = m3u8Path
    ? fs.readFileSync(m3u8Path).toString()
    : ((await fetchData(url, axiosInstance)) as string | undefined);

  if (!data) {
    throw new Error(`HTTPError: No data found in ${url}`);
  }

  const head = url.substring(0, url.lastIndexOf("/"));
  const ts = data.match(/(https:\/\/)?[^ \n]+\.ts[^ \n]*/g);
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
  const axiosInstance = axios.create({
    ...axiosOptions,
    responseType: "stream",
  });
  const response = await axiosInstance.get(url);
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
  downloadOptions: DownloadsConfig
) {
  const { limit, rootDownloadPath } = downloadOptions;
  const progressBar = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic
  );
  progressBar.start(urls.length, 0);

  const limiter = new Bottleneck({
    maxConcurrent: limit,
  });

  const promises = urls.map((url, currentIndex) =>
    limiter.schedule(async () => {
      const filePath = path.join(rootDownloadPath, `${currentIndex}.ts`);
      if (fs.existsSync(filePath)) {
        progressBar.increment();
        return;
      }
      await download(url, axiosOptions, filePath, {
        ...downloadOptions,
      });
      progressBar.increment();
    })
  );

  await Promise.all(promises).finally(() => progressBar.stop());
}

async function download(
  url: string,
  axiosOptions: AxiosRequestConfig,
  filePath: string,
  downloadOptions: DownloadsConfig,
  retries: number = 3
): Promise<void> {
  try {
    if (fs.existsSync(filePath)) return;
    const { hasKey, key } = downloadOptions;
    const axiosInstance = axios.create({
      ...axiosOptions,
      responseType: "stream",
      timeout: 1000 * 5,
    });

    const response = await axiosInstance.get(url);
    const file = fs.createWriteStream(filePath);

    let transformStream: crypto.Decipher | undefined;

    if (hasKey && key) {
      transformStream = crypto.createDecipheriv(
        "aes-128-cbc",
        key,
        Buffer.alloc(16, 0)
      );
    }
    const outputStream = transformStream
      ? response.data.pipe(transformStream)
      : response.data;

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
    if (!(error instanceof Error)) {
      console.log(`Error downloading from ${url}: Unknown error`);
      return;
    }
    if (!error.message.includes("timeout") && retries > 0) {
      console.log(`Error downloading from ${url}: ${error.message}`);
      return;
    }
    console.log(`Retrying download... (${retries} retries left)`);
    await download(url, axiosOptions, filePath, downloadOptions, retries - 1);
  }
}
