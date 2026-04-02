import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";

export async function POST() {
  const projectRoot = path.resolve(process.cwd(), "..");
  const script = path.join(projectRoot, "jobs", "run_inference.py");

  return new Promise<NextResponse>((resolve) => {
    const cmd = `python "${script}"`;
    exec(
      cmd,
      { cwd: projectRoot, timeout: 60000 },
      (error, stdout, stderr) => {
        if (error) {
          resolve(
            NextResponse.json(
              {
                success: false,
                error: error.message,
                stdout: stdout.trim(),
                stderr: stderr.trim(),
              },
              { status: 500 }
            )
          );
        } else {
          // Try to parse a count from stdout, e.g. "Inference complete. Predictions written: 42"
          const match = stdout.match(/(\d+)/);
          const count = match ? parseInt(match[1]) : null;
          resolve(
            NextResponse.json({
              success: true,
              count,
              stdout: stdout.trim(),
              stderr: stderr.trim(),
            })
          );
        }
      }
    );
  });
}
