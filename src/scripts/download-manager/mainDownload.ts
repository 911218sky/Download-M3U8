import { resolve } from "path";

import { startDownload } from "@utils/core/download";
import { getJsonData, options } from "@site/index";

async function main() {
  const readJsonData = await getJsonData();
  const limit =
    !readJsonData.limit || readJsonData.limit <= 0 ? 10 : readJsonData.limit;
  for (const { url, name } of readJsonData.downloadData) {
    await startDownload(url, options, name || "", {
      dir: resolve(__dirname, "..", "..", "..", name ?? "video"),
      hasKey: readJsonData.hasKey,
      limit,
    });
  }
}

main();
