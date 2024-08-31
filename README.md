# DownloadUtensil

DownloadUtensil is a powerful tool designed to help you download AES-encrypted videos and automatically merge them into a single file. It supports downloading from various streaming platforms, such as Gamer and Anime1, among others. This guide will walk you through the installation and setup process.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installing Node.js](#installing-nodejs)
- [Installing FFmpeg](#installing-ffmpeg)
- [Installing DownloadUtensil](#installing-downloadutensil)
- [Configuring `downloadData.json`](#configuring-downloaddatajson)
- [Usage](#usage)

## Prerequisites

Before you can run DownloadUtensil, make sure you have the following software installed:

- Node.js
- FFmpeg

## Installing Node.js

Node.js is essential for running DownloadUtensil. If you haven't installed Node.js yet, follow these instructions:

1. Visit the [official Node.js website](https://nodejs.org/) to download the installer.
2. Select the version that matches your operating system, download the installer, and execute it.
3. Follow the installer prompts to complete the installation.

To verify the installation, open your terminal or command prompt and run:

```bash
node -v
```

This command will display your Node.js version number, confirming the installation was successful.

## Installing FFmpeg

FFmpeg is necessary for processing video files with DownloadUtensil. Here’s how to install it:

1. Download FFmpeg from this [link](https://github.com/911218sky/DownloadUtensil/releases/download/v1.1/ffmpeg-release-full.7z).

2. After downloading, extract the contents of the `.7z` file.

3. Find the "bin" folder within the extracted files.

4. Add the path to the "bin" folder to your system's environment variables. This step enables you to use FFmpeg commands from any location in your terminal or command prompt.

## Installing DownloadUtensil

Once Node.js and FFmpeg are installed, you can proceed to install DownloadUtensil. Follow these steps to set up the project:

1. Open your terminal or command prompt.

2. Navigate to the directory where DownloadUtensil is located. For example:

```bash
cd /path/to/your/project
```

3. Run the provided `install.bat` script to install all necessary dependencies:

```bash
install.bat
```

## Configuring `downloadData.json`

To use DownloadUtensil for downloading videos, you need to configure the `downloadData.json` file. This file tells the program what videos to download and how to handle them. Below is the format you should use and an explanation of each field:

### `downloadData.json` Format

```json
{
  "hasKey": false,
  "deleteTemporaryFiles": true,
  "limit": 15,
  "rootDownloadPath": "./video",
  "headers": {},
  "downloadData": [
    {
      "url": "Optional, choose either this or the URL (URL takes priority) ex: https://www.example.com/video.m3u8",
      "name": "Optional, you can provide a custom name for the downloaded file",
      "m3u8Path": "Optional, choose either this or the URL (URL takes priority) ex: ./video.m3u8",
      "m3u8Prefix": "Optional, used to specify a prefix for URLs or m3u8 paths. If a URL is provided, it prioritizes the URL prefix; if m3u8Path is provided, it automatically adds the specified prefix."
    }
  ]
}
```

### Explanation of Each Field

- **`hasKey`**: Specifies whether the content requires a decryption key. Set to `true` if the content is AES-encrypted and requires a decryption key, or `false` if it does not.

- **`deleteTemporaryFiles`**: Determines whether temporary files created during the download process should be deleted after the process is complete. Set to `true` to delete temporary files and free up space, or `false` to keep them.

- **`limit`**: Sets the maximum number of simultaneous downloads. For example, setting `"limit": 15` allows up to 15 downloads at the same time.

- **`rootDownloadPath`**: The path where the downloaded videos will be stored. For example, `"./video"` will save the videos in a folder named "video" in the current directory.

- **`headers`**: Custom headers can be specified here if needed for making HTTP requests (e.g., for authentication or specific content-type requests).

- **`downloadData`**: This is an array containing information about each video you want to download. Each object in the array can have the following fields:
  - **`url`**: The direct URL to the video’s `.m3u8` file. This field is optional if you are using `m3u8Path` instead.
  - **`name`**: A custom name you want to assign to the downloaded file. This field is optional.
  - **`m3u8Path`**: The local path to an `.m3u8` file. This field is optional if you are using `url` instead.
  - **`m3u8Prefix`**: A prefix that should be added to each segment URL if the URLs are relative and not absolute. This is useful if the `.m3u8` file does not contain the full path for video segments.

### Example Configuration

To download a video using an `.m3u8` file from a URL, here’s how you would configure `downloadData.json`:

```json
{
  "hasKey": false,
  "deleteTemporaryFiles": true,
  "limit": 15,
  "rootDownloadPath": "./video",
  "headers": {},
  "downloadData": [
    {
      "url": "https://www.example.com/video.m3u8",
      "name": "ExampleVideo",
    }
  ]
}
```

If you have the `.m3u8` file locally and want to use the local path:

```json
{
  "hasKey": false,
  "deleteTemporaryFiles": true,
  "limit": 15,
  "rootDownloadPath": "./video",
  "headers": {},
  "downloadData": [
    {
      "m3u8Path": "./video.m3u8",
      "name": "LocalVideo",
      "m3u8Prefix": "https://www.example.com/"
    }
  ]
}
```

## Usage

Once you've configured `downloadData.json`, you can start downloading videos with DownloadUtensil. The program will automatically handle AES-encrypted videos, merge them after download, and store them in the specified location.

Simply run the program, and it will process the download tasks as defined in your `downloadData.json`.
