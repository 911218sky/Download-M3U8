import { startDownload } from "@utils/core/download";
import { getJsonData } from "@site/index";

async function main() {
  const { limit, downloadData, ...options } = await getJsonData();
  for (const data of downloadData) {
    await startDownload({
      limit: !limit || limit <= 0 ? 1 : limit,
      ...data,
      ...options,
    });
  }
}

main();
