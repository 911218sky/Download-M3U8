import { resolve } from "path";

import { startDownload } from "@utils/core/download";
import { getJsonData, options } from "@site/index";

async function main() {
  const { rootDownloadPath, limit, downloadData, hasKey } = await getJsonData();
  for (const { url, name } of downloadData) {
    await startDownload(url, options, name || "video", {
      rootDownloadPath,
      hasKey,
      limit: !limit || limit <= 0 ? 10 : limit,
    });
  }
}

main();
