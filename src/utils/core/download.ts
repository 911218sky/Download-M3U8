import axios from "axios";
import fs from "fs";
import path from "path";
import crypto, { randomUUID } from "crypto";
import Bottleneck from "bottleneck";
import cliProgress from "cli-progress";

import {
  mergeAndTranscodeVideos,
  streamToBuffer,
  deleteFolderRecursive,
  createDirectoryRecursively,
} from "@utils/helpers/utils";

import type { AxiosRequestConfig } from "axios";
import type { Readable } from "stream";
import type { DownloadOptions, DownloadsConfig, DownloadsOptions, GetM3u8Options, GetM3u8Response } from "./types";

export async function startDownload(
  downloadOptions: DownloadsConfig,
): Promise<void> {
  console.log(`[INFO] [CONFIG] ${JSON.stringify(downloadOptions, null, 2)}`);
  if (!downloadOptions.name) {
    downloadOptions.name = randomUUID();
  }
  if (!downloadOptions.rootDownloadPath) {
    downloadOptions.rootDownloadPath = ".";
  }
  const { rootDownloadPath, name, deleteTemporaryFiles, axiosOptions } = downloadOptions;
  const folderPath = path.join(rootDownloadPath, name);
  const fileName = `${name}.mp4`;
  const isExistFile = fs.existsSync(path.join(rootDownloadPath, fileName));
  const isOriginalExistFolder = fs.existsSync(folderPath);

  if (isExistFile) {
    console.log(`[INFO] [EXIST] File already exists: ${path.join(rootDownloadPath, fileName)}`);
    return;
  }

  if (!isOriginalExistFolder) {
    console.log(`[INFO] [CREATE] Creating directory...`);
    if (!createDirectoryRecursively(folderPath)) {
      console.error(`[ERROR] [CREATE] Failed to create directory: ${folderPath}`);
      return;
    } else {
      console.log(`[INFO] [CREATE] Directory created: ${folderPath}`);
    }
  }

  // Download the video
  if (!isOriginalExistFolder) {
    console.log(`[INFO] [GETTING M3U8] Getting m3u8...`);
    const { ts, keyUrl } = await getM3u8(downloadOptions);

    if (downloadOptions.hasKey && keyUrl) {
      console.log(`[INFO] [GETTING KEY] Getting key...`);
      downloadOptions.key = await getKey(keyUrl, axiosOptions);
    }

    console.log(`[INFO] [DOWNLOAD] Downloading videos...`);
    await downloads({ ...downloadOptions, urls: ts, rootDownloadPath: folderPath });
  }

  console.log(`[INFO] [MERGE] Merging videos...`);
  await mergeAndTranscodeVideos(
    folderPath,
    rootDownloadPath,
    fileName
  );

  if (deleteTemporaryFiles && !isOriginalExistFolder) {
    console.log(`[INFO] [DELETE] Deleting temporary files...`);
    deleteFolderRecursive(folderPath);
  }
}

async function fetchData(
  url: string,
  axiosOptions?: AxiosRequestConfig
): Promise<any> {
  try {
    const response = await axios.get(url, {
      ...axiosOptions,
    });
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
  {
    url,
    axiosOptions,
    hasKey,
    m3u8Path,
    m3u8Prefix,
  }: GetM3u8Options<HasKey>,
): Promise<GetM3u8Response<HasKey>> {
  if (!url && !m3u8Path) {
    throw new Error("No url or m3u8Path provided");
  }

  // If url is provided, fetch the data from the url
  const data: string | undefined = url
    ? await fetchData(url, axiosOptions)
    : m3u8Path
      ? fs.readFileSync(m3u8Path).toString()
      : undefined;

  if (!data) {
    throw new Error(`HTTPError: No data found in ${url}`);
  }

  // Get the head of the url
  const head = url ? url.substring(0, url.lastIndexOf("/")) : m3u8Prefix ? m3u8Prefix : "";
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

  // Remove the first element from the array
  ts.splice(0, 1);

  // If the first element does not contain https, prepend the head to the first element
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
  axiosOptions?: AxiosRequestConfig
): Promise<Buffer> {
  const response = await axios.get(url, {
    responseType: "stream",
    timeout: 1000 * 5,
    ...axiosOptions,
  });
  const dataStream = response.data as Readable;
  const key = await streamToBuffer(dataStream);
  if (key.length === 0) {
    throw new Error("Key not received.");
  }
  return key;
}

async function downloads(
  {
    urls,
    rootDownloadPath,
    limit = 1,
    ...options
  }: DownloadsOptions
) {
  if (!urls.length) {
    throw new Error("No urls provided");
  }

  const originalLength = urls.length;
  // filter out the files that have already been downloaded
  urls = urls.filter((url) => !fs.existsSync(path.join(rootDownloadPath ? rootDownloadPath : ".", `${urls.indexOf(url)}.ts`)));

  const progressBar = new cliProgress.SingleBar({
    format: 'Progress [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true,
    stopOnComplete: true,
    clearOnComplete: true,
    fps: 5
  }, cliProgress.Presets.shades_classic);

  progressBar.start(urls.length, 0);

  const limiter = new Bottleneck({
    maxConcurrent: limit,
  });

  const promises = urls.map((url, currentIndex) =>
    limiter.schedule(async () => {
      const filePath = path.join(
        rootDownloadPath ? rootDownloadPath : ".",
        `${(originalLength - urls.length) + currentIndex}.ts`
      );
      if (fs.existsSync(filePath)) {
        progressBar.increment();
        return;
      }
      await download({ ...options, url, filePath });
      progressBar.increment();
    })
  );

  await Promise.all(promises).finally(() => progressBar.stop());
}


async function download(
  { url, filePath,
    retries = 3,
    hasKey,
    key,
    axiosOptions,
  }: DownloadOptions,
): Promise<void> {
  try {
    if (fs.existsSync(filePath)) {
      console.log(`File already exists: ${filePath}`);
      return;
    }
    const response = await axios.get(url, {
      ...axiosOptions,
      responseType: "stream",
      // 5 seconds timeout
      timeout: 1000 * 5,
    });
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
      file.on("error", () => {
        file.close();
        reject("ECONNRESET");
      });
    });
  } catch (error: unknown) {
    if (!(error instanceof Error)) {
      console.log(`Error downloading from ${url}: Unknown error`);
      return;
    }
    if (!error.message.includes("timeout") && error.message.includes("ECONNRESET") || retries <= 0) {
      console.log(`Error downloading from ${url}: ${error.message}`);
      return;
    }
    console.log(`Error downloading from ${url}: ${error.message}`);
    console.log(`Retrying download... (${retries} retries left)`);
    await download({ url, filePath, hasKey, key, axiosOptions, retries: retries - 1 });
  }
}
