import path from "path";
import { startDownload, readDownloadData } from "./lib/downloadVideoKey";
import { downloadData, options, JsonData } from "./site";

// async function main() {
//   for (const { url, name } of downloadData) {
//     await startDownload(url, options, name || "", {
//       dir: path.join(__dirname, `${name}`),
//       limit: 50,
//       hasKey: true,
//     });
//   }
// }

async function main() {
  const jsonData = readDownloadData(
    path.join(__dirname, "downloadData.json")
  ) as JsonData;
  for (const { url, name } of jsonData.downloadData) {
    await startDownload(url, options, name || "", {
      dir: path.join(__dirname, `${name}`),
      limit: 50,
      hasKey: jsonData.hasKey,
    });
  }
}

main();
