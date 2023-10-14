import axios, { AxiosRequestConfig } from "axios";
import { URL } from "url";

interface M3u8Response {
  src?: string;
  error?: {
    code: number;
    message: string;
    state: string;
    details: string[];
  };
}

interface VideoQuality {
  "360p": string | null;
  "540p": string | null;
  "720p": string | null;
  "1080p": string | null;
}

interface GetM3u8Config {
  videoQuality?: keyof VideoQuality;
}

const options: AxiosRequestConfig = {
  headers: {
    Origin: "https://ani.gamer.com.tw",
    Referer: "https://ani.gamer.com.tw/animeVideo.php?sn=35487",
    Cookie:
      "ckM=1995686074; __gads=ID=4e418def0066473f:T=1690810559:RT=1691586512:S=ALNI_MbOHvNKZJjFbOu35dA7_CNXNZT_rA; __gpi=UID=00000c25b2ac0419:T=1690810559:RT=1691586512:S=ALNI_MY_iOiE8zFFCzToBu8-6Uc_HbhpPA; nologinuser=0385cb604ea883b2f3eccccfa820175c3111dfa4321acd23651e93a34316; buap_puoo=p101; BAHAID=a3414061; BAHAHASHID=e7be811b82460e13152e2e09f87509326c1ffc86671e438efdab3c895b1d1b01; BAHANICK=a3414061; BAHALV=13; BAHAFLT=1534333857; MB_BAHAID=a3414061; MB_BAHANICK=a3414061; age_limit_content=1; ga_class1=D; _ga_2Q21791Y9D=GS1.1.1696502696.4.1.1696502710.46.0.0; BAHAENUR=99bb1d03e161e1c95dcf975ca85d4f8b; BAHARUNE=eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9.eyJ1c2VyaWQiOiJhMzQxNDA2MSIsInVzZXJuYW1lIjoiYTM0MTQwNjEiLCJtb2JpbGVWZXJpZnkiOnRydWUsImRlbnlQb3N0IjpmYWxzZSwiYXZhdGFyTGV2ZWwiOjEzLCJtaWQiOjE5OTU2ODYwNzQsIm5vbmNlIjoxNzgwMzk0Mzg0LCJqaWQiOiJhMzQxNDA2MUBsaXRlLmdhbWVyLmNvbS50dyIsImV4cCI6MTY5ODQ0MDQwMH0.RP-tiS8oK0gwe9EcsTIgTXiuWSbFH9Wpz1pipqTFetBln01Qwbg5B26WQi7TEQCS1uyXjALUS1JdvjOB_paUjw; MB_BAHARUNE=eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9.eyJ1c2VyaWQiOiJhMzQxNDA2MSIsInVzZXJuYW1lIjoiYTM0MTQwNjEiLCJtb2JpbGVWZXJpZnkiOnRydWUsImRlbnlQb3N0IjpmYWxzZSwiYXZhdGFyTGV2ZWwiOjEzLCJtaWQiOjE5OTU2ODYwNzQsIm5vbmNlIjoxNzgwMzk0Mzg0LCJqaWQiOiJhMzQxNDA2MUBsaXRlLmdhbWVyLmNvbS50dyIsImV4cCI6MTY5ODQ0MDQwMH0.RP-tiS8oK0gwe9EcsTIgTXiuWSbFH9Wpz1pipqTFetBln01Qwbg5B26WQi7TEQCS1uyXjALUS1JdvjOB_paUjw; avtrv=1697184640155; _gid=GA1.3.1716247149.1697184640; __cf_bm=Q9OorZ1ncSQGrm452uPew38lXIwJpJp8MgpW1LhXfn0-1697208796-0-AXIKn++Gc2np0JSPnEDiePBWcfjPvEOw1HyFv5TjqWmo1YGW17sybCKphTTMaTTNOmldjNOvYh1O2WDKogM/4dc=; _ga=GA1.1.657848791.1689908706; _ga_MT7EZECMKQ=GS1.1.1697208796.77.1.1697208797.59.0.0; ANIME_SIGN=000554745af94dc6baf0587fa602b6051ea46b59fe581824652959de; buap_modr=p005; ckBahaAd=-------05----------------",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36",
  },
};

export async function getAllVideoUrl(videoUrl: string): Promise<string[]> {
  const response = await axios.get(videoUrl, options);

  if (response.status !== 200) {
    throw new Error(`Request failed with status code ${response.status}`);
  }

  const modifiedUrl = videoUrl.replace(/sn=\d+/, "sn=");
  const regex = /<li class="[^<]*"><a href="\?sn=(\d+)">[^<]*<\/a><\/li>/g;
  const matches = [...response.data.matchAll(regex)];
  const snValues = matches.map((match) => match[1]);
  return snValues.map((sn) => `${modifiedUrl}${sn}`);
}

export async function getTitle(videoUrl: string): Promise<string> {
  const response = await axios.get(videoUrl, options);

  if (response.status !== 200) {
    throw new Error(`Request failed with status code ${response.status}`);
  }

  const regex = /<title>(.*?)<\/title>/;
  const match = response.data.match(regex);

  if (match && match[1]) {
    const titleText = match[1].replace("線上看 - 巴哈姆特動畫瘋", "").trim();
    return titleText;
  } else {
    throw new Error("Title not found or empty");
  }
}

export async function getPlaylistAdvance(
  ajaxUrl: string
): Promise<VideoQuality> {
  const response = await axios.get(ajaxUrl, options);

  if (response.status !== 200) {
    throw new Error(`Request failed with status code ${response.status}`);
  }

  const regexStreamInf =
    /#EXT-X-STREAM-INF:BANDWIDTH=\d+,RESOLUTION=\d+x\d+\s+(.+\.m3u8)/g;
  const matches = [...response.data.matchAll(regexStreamInf)];

  if (matches.length > 0) {
    const qualityUrls = matches.map((match) => match[1]);
    return {
      "360p": qualityUrls[0],
      "540p": qualityUrls[1],
      "720p": qualityUrls[2],
      "1080p": qualityUrls[3],
    };
  } else {
    throw new Error("No quality URLs found");
  }
}

export async function getM3u8(
  videoUrl: string,
  m3u8Options?: GetM3u8Config
): Promise<string> {
  const videoInfo = new URL(videoUrl, "https://ani.gamer.com.tw");
  const sn = videoInfo.searchParams.get("sn");
  if (!sn) {
    throw new Error("Please enter the correct URL");
  }

  const response = await axios.get(
    `https://ani.gamer.com.tw/ajax/m3u8.php?sn=${sn}&device=000560909c37856ee166fc22dc1d8ecfb4bbc62277f93a75652959de5122`,
    options
  );

  if (response.status !== 200) {
    throw new Error(`Request failed with status code ${response.status}`);
  }

  const data = response.data as M3u8Response;
  const ajaxUrl = data.src;

  if (!ajaxUrl) {
    if (data.error) console.log(data.error);
    throw new Error("M3u8 URL not found in the response");
  }

  const parsedUrl = new URL(ajaxUrl);
  const originalUrl = `${parsedUrl.protocol}//${
    parsedUrl.host
  }${parsedUrl.pathname.replace("playlist_advance.m3u8", "")}`;
  const qualityUrlsList = await getPlaylistAdvance(ajaxUrl);
  const qualityUrls = qualityUrlsList[m3u8Options?.videoQuality ?? "1080p"];
  return originalUrl + qualityUrls;
}
