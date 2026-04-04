import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST() {
  if (process.env.SCORING_WEBHOOK_URL) {
    try {
      const r = await fetch(process.env.SCORING_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const body = (await r.json().catch(() => ({}))) as Record<string, unknown>;
      return NextResponse.json({ success: r.ok, ...body }, { status: r.ok ? 200 : 502 });
    } catch (e) {
      return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
    }
  }

  if (process.env.VERCEL) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Scoring is not available inside Vercel serverless. Run jobs/run_inference.py with DATABASE_URL (e.g. GitHub Actions) or set SCORING_WEBHOOK_URL.",
      },
      { status: 503 }
    );
  }

  const projectRoot = path.resolve(process.cwd(), "..");
  const script = path.join(projectRoot, "jobs", "run_inference.py");

  try {
    const { stdout, stderr } = await execAsync(`python3 "${script}"`, {
      cwd: projectRoot,
      timeout: 120_000,
      env: { ...process.env },
    });
    const m = stdout.match(/Predictions written:\s*(\d+)/i);
    const count = m ? parseInt(m[1], 10) : null;
    return NextResponse.json({
      success: true,
      count,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
    });
  } catch (err: unknown) {
    const e = err as { message?: string; stdout?: string; stderr?: string };
    return NextResponse.json(
      {
        success: false,
        error: e.message ?? String(err),
        stdout: e.stdout?.trim(),
        stderr: e.stderr?.trim(),
      },
      { status: 500 }
    );
  }
}
