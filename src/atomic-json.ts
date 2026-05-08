import { randomBytes } from "node:crypto";
import { homedir } from "node:os";
import fs from "node:fs/promises";
import path from "node:path";

function expandUser(filePath: string): string {
  if (filePath === "~") {
    return homedir();
  }
  if (filePath.startsWith(`~/`) || filePath.startsWith("~\\")) {
    return path.join(homedir(), filePath.slice(2));
  }
  return filePath;
}

/**
 * Write JSON atomically: temp file in destination dir, UTF-8, trailing newline,
 * fsync, then rename (same algorithm as Python write_json_atomic).
 */
export async function writeJsonAtomic(
  filePath: string,
  data: unknown,
  options?: { indent?: number },
): Promise<void> {
  const indent = options?.indent ?? 2;
  const resolved = path.resolve(expandUser(filePath));
  await fs.mkdir(path.dirname(resolved), { recursive: true });

  const dir = path.dirname(resolved);
  const base = path.basename(resolved);
  const tmpPath = path.join(dir, `.${base}.${randomBytes(16).toString("hex")}.tmp`);

  try {
    const fh = await fs.open(tmpPath, "wx");
    try {
      const content = JSON.stringify(data, null, indent) + "\n";
      await fh.writeFile(content, "utf8");
      await fh.sync();
    } finally {
      await fh.close();
    }
    await fs.rename(tmpPath, resolved);
  } catch (err) {
    await fs.unlink(tmpPath).catch(() => {});
    throw err;
  }
}
