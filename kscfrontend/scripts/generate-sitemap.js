import { SitemapStream, streamToPromise } from "sitemap";
import { writeFileSync } from "node:fs";

const hostname = "https://kangarugirls.sc.ke";

const pages = [
  "/",
  "/about",
  "/admissions",
  "/events",
  "/feestructure",
  "/curriculum",
  "/performance",
  "/policies",
  "/parents",
  "/student-life",
  "/gallery",
  "/newsletter",
  "/contact",
  "/legal",
];

async function generateSitemap() {
  const sitemap = new SitemapStream({ hostname });

  for (const page of pages) {
    sitemap.write({
      url: page,
      lastmod: new Date().toISOString(),
    });
  }

  sitemap.end();

  const xml = await streamToPromise(sitemap);

  writeFileSync("public/sitemap.xml", xml.toString());

  console.log("✅ Sitemap generated successfully!");
}

generateSitemap().catch((err) => {
  console.error(err);
  process.exit(1);
});