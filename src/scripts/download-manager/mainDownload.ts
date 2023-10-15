import path from "path";
import { startDownload } from "../../utils/core/download";
import { getJsonData, options } from "../../site";

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
  const readJsonData = getJsonData();
  const limit =
    !readJsonData.limit || readJsonData.limit <= 0 ? 50 : readJsonData.limit;
  for (const { url, name } of readJsonData.downloadData) {
    await startDownload(url, options, name || "", {
      dir: path.resolve(__dirname, "..", "..", "..", name ?? "video"),
      hasKey: readJsonData.hasKey,
      limit,
    });
  }
}

main();
