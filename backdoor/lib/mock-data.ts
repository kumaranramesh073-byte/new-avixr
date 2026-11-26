// ── Deterministic PRNG so numbers are stable between renders/builds ──────────
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);
const between = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;

function isoDaysAgo(days: number, hours = 0) {
  const d = new Date("2026-06-03T09:00:00Z");
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

export function pctChange(curr: number, prev: number): number {
  if (!prev) return 0;
  return +(((curr - prev) / prev) * 100).toFixed(1);
}

// ── GitHub commits (mock; replace with GitHub API) ──────────────────────────
export interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  ts: string;
  branch: string;
  verified: boolean;
}

export const MOCK_COMMITS: CommitInfo[] = [
  { sha: "80dc1d2", message: "style: update sidebar subtitle to Stop Guessing. Start Simulating.", author: "Gokul", ts: isoDaysAgo(0, 3), branch: "main", verified: true },
  { sha: "01c0eb8", message: "Merge pull request #22 from docs/grounding-and-theme-plans", author: "Gokul", ts: isoDaysAgo(0, 7), branch: "main", verified: true },
  { sha: "60c86f8", message: "docs: add grounding rollout + theme unification implementation plans", author: "Priya Sharma", ts: isoDaysAgo(1, 2), branch: "main", verified: true },
  { sha: "8fe2ea2", message: "Style: Theme Unification Across Modules (#21)", author: "Liam Chen", ts: isoDaysAgo(1, 9), branch: "main", verified: true },
  { sha: "26dd4d5", message: "Feature: Grounding Rollout for All Modules (#20)", author: "Gokul", ts: isoDaysAgo(2, 4), branch: "main", verified: false },
  { sha: "a1f9c33", message: "fix: PDF export pagination for tall module reports", author: "Diego Silva", ts: isoDaysAgo(3, 1), branch: "feat/pdf-export", verified: true },
  { sha: "c7b2e90", message: "chore: bump recharts + html2canvas", author: "Mei Tanaka", ts: isoDaysAgo(4, 6), branch: "main", verified: true },
];

// ── Deploy / build status (shown alongside commits) ─────────────────────────
export const MOCK_DEPLOY = {
  provider: "Render",
  lastDeploy: isoDaysAgo(0, 5),
  status: "live" as "live" | "building" | "failed",
  commitSha: "80dc1d2",
  buildTimeSec: 142,
};
