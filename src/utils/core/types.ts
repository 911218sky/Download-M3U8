import type{ AxiosRequestConfig } from "axios";

export interface GetM3u8Response<HasKey extends boolean = true> {
  ts: string[];
  keyUrl: HasKey extends true ? string : undefined;
  m3u8Path?: string;
}

export interface GetM3u8Options<HasKey extends boolean> {
  url?: string;
  m3u8Path?: string;
  m3u8Prefix?: string;
  axiosOptions?: AxiosRequestConfig;
  hasKey?: HasKey;
}

export interface DownloadOptions {
  url: string;
  filePath: string;
  retries?: number;
  axiosOptions?: AxiosRequestConfig;
  key?: Buffer | undefined;
  hasKey?: boolean;
}

export interface DownloadsOptions {
  urls: string[];
  axiosOptions?: AxiosRequestConfig;
  rootDownloadPath?: string;
  limit?: number;
  key?: Buffer | undefined;
  hasKey?: boolean;
}

export interface DownloadsConfig {
  url?: string;
  name?: string;
  rootDownloadPath?: string;
  limit?: number;
  deleteTemporaryFiles?: boolean;
  hasKey?: boolean;
  key?: Buffer | undefined;
  m3u8Path?: string;
  m3u8Prefix?: string;
  axiosOptions?: AxiosRequestConfig;
}