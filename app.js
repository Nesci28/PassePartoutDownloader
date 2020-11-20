const puppeteer = require("puppeteer");
const { execSync } = require("child_process");

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

  for (const video of videos) {
    const name = video.split("/").pop();
    execSync(`youtube-dl.exe ${video} -o ${name}.%(ext)s`);
  }

  await browser.close();
})();
