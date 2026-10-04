import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const workflow = readFileSync(new URL("../.github/workflows/release.yml", import.meta.url), "utf8");
const npm = workflow.slice(workflow.indexOf("\n  npm:"));

test("GitHub releases publish the checked package and checksum before locking assets", () => {
  expect(workflow).toContain("SHA256SUMS");
  expect(workflow).toContain("--draft");
  expect(workflow).toContain("--draft=false");
  expect(workflow).toContain("release verify-asset");
  expect(workflow).toContain("release verify");
  expect(workflow).not.toContain("true\\t0");
});

test("release jobs hand off one verified tarball rather than repacking for npm", () => {
  expect(workflow).toContain("actions/upload-artifact@");
  expect(workflow).toContain("actions/download-artifact@");
  expect(workflow).toContain("artifact-ids:");
  expect(workflow).toContain("bun run check");
  expect(workflow).toContain("scripts/package-smoke.ts");
  expect(npm).not.toContain("npm pack");
  expect(npm).toContain("npm publish");
  expect(npm).toContain("--provenance");
  expect(npm).toContain("dist.integrity");
  expect(workflow).not.toContain("--clobber");
  expect(workflow).not.toContain("release delete");
});

test("the release smoke test installs a supplied tarball from an unrelated working directory", async () => {
  const root = resolve(import.meta.dir, "..");
  const work = await mkdtemp(join(tmpdir(), "textmockups-exact-artifact-"));
  try {
    const packed = Bun.spawnSync([process.execPath, "pm", "pack", "--ignore-scripts", "--destination", work], { cwd: root, stdout: "pipe", stderr: "pipe" });
    expect(packed.exitCode).toBe(0);
    const version = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version;
    const smoke = Bun.spawnSync([process.execPath, join(root, "scripts/package-smoke.ts"), join(work, `hraness-textmockups-${version}.tgz`)], {
      cwd: work, stdout: "pipe", stderr: "pipe",
    });
    expect(smoke.exitCode).toBe(0);
    expect(smoke.stdout.toString()).toContain("packed package renders");
  } finally { await rm(work, { recursive: true, force: true }); }
}, 30_000);

test("the release YAML and shell parse, and publishing authority stays isolated", () => {
  const definition = Bun.YAML.parse(workflow) as { permissions: Record<string, string>; jobs: Record<string, { permissions: Record<string, string>; steps: { run?: string }[] }> };
  expect(definition.permissions).toEqual({ contents: "read" });
  expect(definition.jobs.verify?.permissions).toEqual({ contents: "read" });
  expect(definition.jobs.publish?.permissions).toEqual({ contents: "write" });
  expect(definition.jobs.npm?.permissions).toEqual({ contents: "read", "id-token": "write" });
  for (const job of Object.values(definition.jobs)) for (const step of job.steps) {
    if (!step.run) continue;
    const syntax = Bun.spawnSync(["bash", "-n"], { stdin: Buffer.from(step.run), stdout: "pipe", stderr: "pipe" });
    expect(syntax.exitCode).toBe(0);
  }
});
