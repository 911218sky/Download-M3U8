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

const device = "0138c650f9984ae26fe0f5bf2ae7c483d1ec93b3d1583b33652be6e04963";

const options: AxiosRequestConfig = {
  headers: {
    Origin: "https://ani.gamer.com.tw",
    Referer: "https://ani.gamer.com.tw/animeVideo.php?sn=35487",
    Cookie:
      "ckM=1995686074; __gads=ID=4e418def0066473f:T=1690810559:RT=1691586512:S=ALNI_MbOHvNKZJjFbOu35dA7_CNXNZT_rA; __gpi=UID=00000c25b2ac0419:T=1690810559:RT=1691586512:S=ALNI_MY_iOiE8zFFCzToBu8-6Uc_HbhpPA; nologinuser=0385cb604ea883b2f3eccccfa820175c3111dfa4321acd23651e93a34316; buap_puoo=p101; BAHAID=a3414061; BAHAHASHID=e7be811b82460e13152e2e09f87509326c1ffc86671e438efdab3c895b1d1b01; BAHANICK=a3414061; BAHALV=13; BAHAFLT=1534333857; MB_BAHAID=a3414061; MB_BAHANICK=a3414061; age_limit_content=1; ga_class1=D; _ga_2Q21791Y9D=GS1.1.1696502696.4.1.1696502710.46.0.0; _gid=GA1.3.1926983055.1697300411; BAHAENUR=e392c11f3255957b44dacc3fdc6d29bf; BAHARUNE=eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9.eyJ1c2VyaWQiOiJhMzQxNDA2MSIsInVzZXJuYW1lIjoiYTM0MTQwNjEiLCJtb2JpbGVWZXJpZnkiOnRydWUsImRlbnlQb3N0IjpmYWxzZSwiYXZhdGFyTGV2ZWwiOjEzLCJtaWQiOjE5OTU2ODYwNzQsIm5vbmNlIjoxOTc2NDUxNTY5LCJqaWQiOiJhMzQxNDA2MUBsaXRlLmdhbWVyLmNvbS50dyIsImV4cCI6MTY5ODYxMzIwMH0.hYo3xxA1JWf1sDVCKO6m1OAqUOPS-fihCX8P0uOd5ZIT1BUsBAhByvW3GaUFnagihqgvlenTu1eiMyD3MJkX8A; MB_BAHARUNE=eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9.eyJ1c2VyaWQiOiJhMzQxNDA2MSIsInVzZXJuYW1lIjoiYTM0MTQwNjEiLCJtb2JpbGVWZXJpZnkiOnRydWUsImRlbnlQb3N0IjpmYWxzZSwiYXZhdGFyTGV2ZWwiOjEzLCJtaWQiOjE5OTU2ODYwNzQsIm5vbmNlIjoxOTc2NDUxNTY5LCJqaWQiOiJhMzQxNDA2MUBsaXRlLmdhbWVyLmNvbS50dyIsImV4cCI6MTY5ODYxMzIwMH0.hYo3xxA1JWf1sDVCKO6m1OAqUOPS-fihCX8P0uOd5ZIT1BUsBAhByvW3GaUFnagihqgvlenTu1eiMyD3MJkX8A; avtrv=1697351031231; ANIME_SIGN=0138b96c0946ef73aac1bb4be852ed4874b6f2bec811fedb652be6e0; buap_modr=p005; __cf_bm=Me9lv7KLrpD94dpRZ1XKj2wUHLwigsjy3TXLT3BJLqg-1697377793-0-AZmVQiBJx9ZJkSCpdjeDKC18g4KNCQXXuvZJH8e6EsTcFXfwvsOj4eC/Ghrdd26SVf2Kkf30M+A9Ccu4gxHZ2Xo=; _gat=1; _ga_MT7EZECMKQ=GS1.1.1697378223.83.1.1697378224.59.0.0; _ga=GA1.1.657848791.1689908706; ckBahaAd=-------29----------------",
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

async function getPlaylistAdvance(ajaxUrl: string): Promise<VideoQuality> {
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
    `https://ani.gamer.com.tw/ajax/m3u8.php?sn=${sn}&device=${device}`,
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
