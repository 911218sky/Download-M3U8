import { AxiosRequestConfig } from "axios";

export interface DownloadData {
  url: string;
  name: string | undefined;
}

export interface JsonData {
  downloadData: DownloadData[];
  hasKey: boolean;
}

export const options: AxiosRequestConfig = {
  headers: {
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
    // 動漫風
    origin: "https://ani.gamer.com.tw",
    referer: "https://ani.gamer.com.tw/animeVideo.php?sn=33944",
    // missav
    // origin: "https://missav.com",
    // referer: "https://missav.com/rki-613",
  },
};

export const downloadData: DownloadData[] = [
  {
    url: "https://bahamut.akamaized.net/1133994d9f2be7f63d4f4ecd26e3da8071af7b60/1080p/hdntl=exp=1697389226~acl=%2f*~data=hdntl,a3414061%3a35491%3a1%3a1%3a68686826~hmac=5e30b0bc655a3c32bc9a0e602b498299de07c21f0959f304eb3a38dcb1ec9e87/chunklist_b5000000.m3u8",
    name: "家裡蹲吸血姬的鬱悶 [2]",
  },
];
