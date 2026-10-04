<!-- browser-automation:start -->
- Ordinary owned automated browser runs use versioned Chrome for Testing or the browser provisioned for the pinned Playwright version. Reject the installed auto-updating Chrome application, including explicit executable overrides and symlinks; never fall back to it when provisioning is missing. Report the resolved executable and browser version, and close owned contexts and browsers gracefully in cleanup. Attaching to an explicitly authorized user-owned browser is a separate operation: preserve its profile and lifetime. Keep regression checks for browser selection in the existing required checks; see [browser automation](https://github.com/hraness/.github/blob/main/BROWSER_AUTOMATION.md).
- Never start the system Chrome app directly from an agent shell; use the repository's browser tooling and respect its scheduler and browser custody controls. For owned launches, pass `--mute-audio` and merge `PaintHolding,MacAppCodeSignClone` into any existing `--disable-features` value instead of adding a second switch. Finish owned process, context, and profile cleanup before releasing the browser lane. Never signal another holder or manipulate its lease to obtain a slot.
<!-- browser-automation:end -->

# Contents

- `src/phone.tsx` and `src/phone.css` – the `Phone` renderer and its scoped `.tm-*` styles. They own messaging fidelity for every app and theme.
- `src/schema.ts` – the versioned scene format (Zod) and `parseScene`.
- `src/timeline.ts` – deterministic playback: `evaluateScene`, `sceneTime`.
- `src/conversation.ts`, `src/assets.ts`, `src/glyph.tsx`, `src/presets.ts` – helpers, asset validation, icons, and example scenes.
- `dist/` – committed build output that consumers install from tags. `bun run build` regenerates it.
- `scripts/` – the build, the packed-package smoke test, and the gallery that renders presets and the README images in `docs/`.
- `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `LICENSE`, `STYLE.md`, `WRITING.md` – public usage, policy, terms, and prose contracts.

# Guidelines

- Use Bun 1.3.14 for repository commands.
- Keep scene version 1 deterministic and stable. Validate foreign documents with `parseScene` before rendering; bound document bytes, element counts, and animation duration. Never change how an existing v1 scene parses or draws without a new scene or renderer version, except for fidelity fixes that make an app look more like the real app; call those out in the pull request with before and after images.
- Keep `Phone` free of hooks, effects, browser globals, and framework-specific imports so it renders on the server and in static HTML. Storage, uploads, export, editing, and accounts belong to consuming apps; media reaches the renderer only through the `media` slots.
- Keep styles scoped under `.tm-` classes and data attributes. Do not add global selectors.
- Rebuild and commit `dist/` with every source change. `bun run check` fails when it is stale.
- Use synthetic people and content in presets, tests, and images.
- Run `bun run check` before handing off a change. For visual changes, compare `bun run gallery --shots` output before and after with the browser provisioned for the pinned `playwright-core`.
- Deliver changes to `main` through a current-head pull request with the `Required` CI job green. Never force-push or bypass the gate.
- Treat a `v*` tag as a release request. Keep the tag equal to `v<package.json version>` on `main`. Merging a version bump to `main` creates its annotated tag automatically once CI passes (`.github/workflows/auto-tag.yml`).
- GitHub Releases are the canonical distribution: pack the checked commit, smoke-test that exact tarball, upload it with `SHA256SUMS` to a prerelease draft, and verify readback. Publish without changing Latest, then require actual immutability and signed release/asset attestations before stable/Latest promotion. Keep the publisher contents-only; it cannot read the administration-only immutable-releases setting. Never rewrite existing tags or replace assets. npm is an optional exact-byte OIDC mirror after promotion.
- Provision Playwright browsers with `PLAYWRIGHT_SKIP_BROWSER_GC=1` so installation does not remove another checkout's cached browser.
- Public copy follows `STYLE.md`; internal prose follows `WRITING.md`.
