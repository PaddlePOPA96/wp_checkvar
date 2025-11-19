import type { NextConfig } from "next";

const isGithubActions = process.env.GITHUB_ACTIONS === "true";
const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1] || "";
const base = isGithubActions && repoName ? `/${repoName}` : "";

const nextConfig: NextConfig = {
  output: "export", // enable static export for GitHub Pages
  images: { unoptimized: true }, // next/image works with export
  basePath: base || undefined,
  assetPrefix: base || undefined,
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_BASE_PATH: base,
  },
};

export default nextConfig;
