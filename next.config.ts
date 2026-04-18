import path from "node:path";
import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  /** 상위 폴더의 package-lock.json 때문에 Turbopack 루트가 어긋나는 경고 방지 */
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
