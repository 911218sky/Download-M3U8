import { exec } from 'child_process';
import fs from "fs";
import path from "path";
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

import type { Readable } from "stream";

const execPromise = promisify(exec);

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

export function createDirectoryRecursively(directoryPath: string): boolean {
  if (fs.existsSync(directoryPath)) {
    return false;
  }

  const parentDirectory = path.dirname(directoryPath);
  if (!fs.existsSync(parentDirectory)) {
    createDirectoryRecursively(parentDirectory);
  }

  fs.mkdirSync(directoryPath);
  return true;
}

export async function mergeAndTranscodeVideos(
  inputDir: string,
  outputDir: string,
  fileName: string
): Promise<void> {
  const uniqueId = uuidv4();
  const originalInputDir = inputDir;
  const newInputDir = path.join(path.dirname(inputDir), uniqueId);

  // Rename input directory to avoid issues with Chinese characters
  fs.renameSync(inputDir, newInputDir);
  inputDir = newInputDir;

  inputDir = path.isAbsolute(inputDir) ? inputDir : path.resolve(inputDir);
  outputDir = path.isAbsolute(outputDir) ? outputDir : path.resolve(outputDir);

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
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
    .filter((fileEntry): fileEntry is string => fileEntry !== null)
    .join("\n");

  const concatListFile = path.join(inputDir, "m3u8.txt");

  fs.writeFileSync(concatListFile, concatList);

  try {
    // Optimized FFmpeg command for faster processing
    // FFmpeg command explanations:
    // -f concat: Use the concat demuxer to read input from a list of files
    // -safe 0: Disable safe mode, allowing absolute paths in the concat file
    // -i "${concatListFile}": Input file containing the list of video segments to concatenate
    // -c copy: Directly copy video and audio streams without re-encoding
    // -threads 0: Allow FFmpeg to automatically determine the number of threads to use
    const ffmpegCommand = `ffmpeg -f concat -safe 0 -i "${concatListFile}" -c copy -threads 0 "${path.join(outputDir, fileName)}"`;
    const { stdout, stderr } = await execPromise(ffmpegCommand);

    if (stderr) {
      console.error("FFmpeg stderr:", stderr);
    }
    console.log("FFmpeg process completed!");
    console.log("FFmpeg stdout:", stdout);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error during video merging: ${error.message}`);
    } else {
      console.error('Unknown error during video merging');
    }
  } finally {
    fs.unlinkSync(concatListFile);
    fs.renameSync(newInputDir, originalInputDir);
  }
}