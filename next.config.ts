import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cursor / VS Code embedded preview and sandboxed contexts
  allowedDevOrigins: ["null", "vscode-app", "vscode-webview"],
};

export default nextConfig;
