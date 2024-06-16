import { startDownload } from "@utils/core/download";
import { getJsonData } from "@site/index";

async function main() {
  const { rootDownloadPath, limit, downloadData, hasKey } = await getJsonData();
  for (const { url, name, m3u8Path } of downloadData) {
    await startDownload(url, {}, name || "video", {
      rootDownloadPath,
      hasKey,
      m3u8Path,
      limit: !limit || limit <= 0 ? 10 : limit,
    });
  }
}

main();
