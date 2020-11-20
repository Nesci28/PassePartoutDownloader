const puppeteer = require("puppeteer");
const { execSync } = require("child_process");

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
    const name = video.split("/").pop();

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
      `youtube-dl http://players.brightcove.net/${dataAccount}/default_default/index.html?videoId=${videoDataId} -o videos/${name}.%(ext)s`
    );
  }

  await browser.close();
})();
