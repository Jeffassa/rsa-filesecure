// Imprime la couverture et le corps du guide en PDF avec Chrome.
import { pathToFileURL } from "node:url";
import { join } from "node:path";
import puppeteer from "puppeteer-core";

const DIR = process.argv[2];
const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--allow-file-access-from-files"],
});

async function render(html, pdf, withFooter) {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(join(DIR, html)).href, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
  const fonts = await page.evaluate(() => [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family));
  console.log(html, "polices chargées :", [...new Set(fonts)].join(", "));
  await page.pdf({
    path: join(DIR, pdf),
    preferCSSPageSize: true,
    printBackground: true,
    tagged: true,
    outline: withFooter,
    displayHeaderFooter: withFooter,
    headerTemplate: "<span></span>",
    footerTemplate: withFooter
      ? `<div style="width:100%;padding:0 16mm;font-family:'Segoe UI',Arial,sans-serif;font-size:7.5pt;color:#8a8fa3;display:flex;justify-content:space-between;">
           <span>RSA FileSecure, guide d'utilisation</span>
           <span>page <span class="pageNumber"></span> sur <span class="totalPages"></span></span>
         </div>`
      : "<span></span>",
  });
  await page.close();
}

await render("cover.html", "cover.pdf", false);
await render("guide.html", "body.pdf", true);
await browser.close();
