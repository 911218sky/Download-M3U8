import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";

import type { Readable } from "stream";

export async function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk) => {
      chunks.push(chunk);
    });
    stream.on("end", () => {
      const buffer: Buffer = Buffer.concat(chunks);
      resolve(buffer);
    });
    stream.on("error", (error: Error) => {
      reject(error);
    });
  });
}

export function deleteFolderRecursive(directoryPath: string): void {
  if (!path.isAbsolute(directoryPath)) {
    directoryPath = path.resolve(directoryPath);
  }
  if (fs.existsSync(directoryPath)) {
    fs.readdirSync(directoryPath).forEach((file) => {
      const currentPath = path.join(directoryPath, file);
      if (fs.lstatSync(currentPath).isDirectory()) {
        deleteFolderRecursive(currentPath);
      } else {
        fs.unlinkSync(currentPath);
      }
    });
    fs.rmdirSync(directoryPath);
  }
}

export function createDirectoryRecursively(directoryPath: string): void {
  if (fs.existsSync(directoryPath)) {
    console.log(`Directory already exists: ${directoryPath}`);
    return;
  }

  const parentDirectory = path.dirname(directoryPath);
  if (!fs.existsSync(parentDirectory)) {
    createDirectoryRecursively(parentDirectory);
  }

  fs.mkdirSync(directoryPath);
  console.log(`Directory created: ${directoryPath}`);
}

export async function mergeAndTranscodeVideos(
  inputDir: string,
  outputDir: string,
  fileName: string
): Promise<void> {
  try {
    if (!path.isAbsolute(inputDir)) {
      inputDir = path.resolve(inputDir);
    }
    if (!path.isAbsolute(outputDir)) {
      outputDir = path.resolve(outputDir);
    }
    const inputFiles = fs
      .readdirSync(inputDir)
      .filter((filename) => filename.endsWith(".ts"))
      .sort((a, b) => {
        return parseInt(a.split(".")[0]) - parseInt(b.split(".")[0]);
      })
      .map((filename) => path.join(inputDir, filename));

    const concatList = inputFiles
      .map((file) => {
        const stats = fs.statSync(file);
        if (stats.size > 50 * 1024) {
          return `file '${file}'`;
        }
        return null;
      })
      .filter((fileEntry) => fileEntry !== null) // 去除未符合大小要求的文件
      .join("\n");

    const concatListFile = path.join(inputDir, "m3u8.txt");

    fs.writeFileSync(concatListFile, concatList);

    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(concatListFile)
        .inputOptions(["-f", "concat", "-safe", "0"])
        .outputOptions([
          "-c:v",
          "h264_nvenc",
          "-c",
          "copy",
          "-bsf:a",
          "aac_adtstoasc",
        ])
        .output(path.join(outputDir, fileName))
        .on("start", (commandLine) => {
          console.log("ffmpeg command:", commandLine);
        })
        .on("error", (err, stdout, stderr) => {
          console.error("ffmpeg error:", err);
          console.error("ffmpeg stderr:", stderr);
          reject(err);
        })
        .on("end", () => {
          console.log("ffmpeg process finished!");
          resolve();
        })
        .run();
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.log(`${error.message}`);
    } else {
      console.log(`Error merge videos : Unknown error`);
    }
  }
}
