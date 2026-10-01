import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

const libreDir = path.join(root, "public", "vendor", "maplibre");
await mkdir(libreDir, { recursive: true });
const libreWorker = await readFile(
  path.join(root, "node_modules", "maplibre-gl", "dist", "maplibre-gl-worker.mjs"),
  "utf8"
);
await writeFile(
  path.join(libreDir, "maplibre-gl-worker.js"),
  libreWorker.replace('from"./maplibre-gl-shared.mjs"', 'from"./maplibre-gl-shared.js"')
);
await copyFile(
  path.join(root, "node_modules", "maplibre-gl", "dist", "maplibre-gl-shared.mjs"),
  path.join(libreDir, "maplibre-gl-shared.js")
);

const mapboxDir = path.join(root, "public", "vendor", "mapbox");
await mkdir(mapboxDir, { recursive: true });
await copyFile(
  path.join(root, "node_modules", "mapbox-gl", "dist", "mapbox-gl-csp-worker.js"),
  path.join(mapboxDir, "mapbox-gl-csp-worker.js")
);
