import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@pomona/shared"],
  // next dev 가 AI 에이전트 실행을 감지하면 AGENTS.md · CLAUDE.md 를 만드는 것을 끈다
  agentRules: false,
  // 브라우저는 이 앱 주소로만 부르고 Next 가 백엔드로 넘긴다. 같은 주소라 백엔드에 CORS 설정이 필요 없다
  async rewrites() {
    return [{ source: "/api/admin/:path*", destination: `${process.env.BACKEND_URL}/api/admin/:path*` }];
  },
};

export default nextConfig;
