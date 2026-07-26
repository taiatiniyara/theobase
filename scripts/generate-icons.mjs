import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const svgPath = join(__dirname, "..", "public", "icon.svg");
const outDir = join(__dirname, "..", "public");

async function main() {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.warn(
      "sharp not installed. Run `npm install --save-dev sharp` to generate PNG icons.\n" +
        "Skipping icon generation — SVG fallback will be used."
    );
    process.exit(0);
  }

  if (!existsSync(svgPath)) {
    console.error(`SVG not found at ${svgPath}`);
    process.exit(1);
  }

  const svg = readFileSync(svgPath);

  await sharp(svg).resize(192, 192).png().toFile(join(outDir, "icon-192.png"));
  console.log("Generated icon-192.png");

  await sharp(svg).resize(512, 512).png().toFile(join(outDir, "icon-512.png"));
  console.log("Generated icon-512.png");
}

main();
