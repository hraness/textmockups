// Builds dist/ (JavaScript, declarations and the stylesheet) from src/.
// dist/ is committed because consumers install tagged GitHub sources, which
// do not run build scripts. `--check` rebuilds into a temporary directory and
// fails when the committed dist/ differs.
import { mkdtemp, readdir, readFile, rm, cp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const check = process.argv.includes("--check");
const outDir = check
  ? await mkdtemp(join(tmpdir(), "textmockups-dist-"))
  : join(root, "dist");

async function files(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const nested = await Promise.all(
    entries.map((entry) =>
      entry.isDirectory()
        ? files(join(dir, entry.name))
        : Promise.resolve([join(dir, entry.name)]),
    ),
  );
  return nested.flat().sort();
}

try {
  if (!check) await rm(outDir, { recursive: true, force: true });
  const tsc = Bun.spawnSync(
    ["bunx", "tsc", "-p", "tsconfig.build.json", "--outDir", outDir],
    { cwd: root, stdout: "inherit", stderr: "inherit" },
  );
  if (tsc.exitCode !== 0) process.exit(tsc.exitCode ?? 1);
  await cp(join(root, "src", "phone.css"), join(outDir, "phone.css"));
  await cp(join(root, "src", "fonts"), join(outDir, "fonts"), {
    recursive: true,
  });
  if (check) {
    const committed = join(root, "dist");
    const expected = (await files(outDir)).map((file) => relative(outDir, file));
    const actual = (await files(committed)).map((file) =>
      relative(committed, file),
    );
    const stale: string[] = [];
    for (const name of new Set([...expected, ...actual])) {
      const [a, b] = await Promise.all([
        readFile(join(outDir, name)).catch(() => null),
        readFile(join(committed, name)).catch(() => null),
      ]);
      if (!a || !b || !a.equals(b)) stale.push(name);
    }
    if (stale.length) {
      console.error(
        `dist/ is out of date (${stale.join(", ")}). Run \`bun run build\` and commit dist/.`,
      );
      process.exit(1);
    }
    console.log("dist/ matches src/.");
  }
} finally {
  if (check) await rm(outDir, { recursive: true, force: true });
}
