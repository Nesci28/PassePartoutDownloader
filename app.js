const puppeteer = require("puppeteer");
const { execSync } = require("child_process");
const axios = require("axios");

const FIRSTEPISODEINDEX = 49;

(async () => {
  const options = {
    headless: false,
    slowMo: 10,
    defaultViewport: null,
  };

  const browser = await puppeteer.launch(options);
  const page = await browser.newPage();
  await page.goto("https://coucou.telequebec.tv/heros/88/passe-partout", {
    waitUntil: "networkidle2",
    timeout: 90000,
  });

  await page.waitForSelector(".row-container.videos", { visible: true });

  const videos = await page.evaluate(() =>
    [...document.querySelectorAll("a")]
      .filter(
        (el) => el.href.includes("videos") && el.href.substr(-6) !== "videos"
      )
      .map((el) => el.href)
  );

  const final = videos.length;
  for (let i = FIRSTEPISODEINDEX; i < videos.length; i++) {
    const video = videos[i];
    console.log(`${i}/${final}`);
    const name = video.split("/").pop().replace(/-/g, " ");
    const id = video.split("/videos/").pop().split("/")[0];
    const { data } = await axios.get(
      `https://mnmedias.api.telequebec.tv/api/v4/player/${id}`
    );
    const date = convertToDate(data);

    let videoPage = await browser.newPage();
    await videoPage.goto(video, {
      waitUntil: "networkidle2",
      timeout: 90000,
    });
    await videoPage.waitForSelector(".video-js", { visible: true });
    const dataAccount = await videoPage.evaluate(() =>
      [...document.querySelectorAll(".video-js")].map((el) =>
        el.getAttribute("data-account")
      )
    );
    const videoDataId = await videoPage.evaluate(() =>
      [...document.querySelectorAll(".video-js")].map((el) =>
        el.getAttribute("data-video-id")
      )
    );
    execSync(
      `youtube-dl http://players.brightcove.net/${dataAccount}/default_default/index.html?videoId=${videoDataId} -o "videos/${date}.${name}.%(ext)s"`
    );
  }

  await browser.close();
})();

function convertToDate(data) {
  const months = [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
  ];
  const startDateText =
    data.userRequestContext.canalDiffusion.broadcastDates.current.startDateText;
  const dateElements = startDateText.split(" ");
  const day = dateElements[0];
  const month = months.indexOf(dateElements[1]) + 1;
  const year = dateElements[2];
  return `${year}-${month}-${day}`;
}
