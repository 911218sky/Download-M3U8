import path from "path";
import { startDownload } from "@utils/core/download";
import { getAllVideoUrl, getTitle, getM3u8 } from "@utils/specific/gamer";
import { options } from "@site/index";

interface VideoInfo {
  url: string;
  name?: string;
  getAllVideoInfo?: boolean;
}

const videoInfoArray: VideoInfo[] = [
  {
    url: "https://ani.gamer.com.tw/animeVideo.php?sn=23381",
    getAllVideoInfo: true,
  },
];

async function processVideoInfo(videoInfo: VideoInfo) {
  let { url, name } = videoInfo;
  if (!name) name = await getTitle(url);
  const m3u8 = await getM3u8(url, {
    videoQuality: "1080p",
  });
  await startDownload(m3u8, options, name || "video", {
    dir: path.resolve(__dirname, "..", "..", "..", name || "video"),
    hasKey: true,
    limit: 50,
  });
}

async function main() {
  for (const videoInfo of videoInfoArray) {
    if (videoInfo.getAllVideoInfo) {
      const allVideoInfo = await getAllVideoUrl(videoInfo.url);
      videoInfoArray.push(...allVideoInfo.map((url) => ({ url })));
    } else {
      await processVideoInfo(videoInfo);
    }
  }
}

main();
