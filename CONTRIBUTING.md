# Contributing

Issues and focused pull requests are welcome.

Open an issue before starting a broad change to the scene format or the `Phone` props. Version 1 scenes must keep parsing and drawing the same way; incompatible changes need a new scene version.

Run the checks before opening a pull request:

```sh
bun install
bun run build   # dist/ is committed; rebuild it after changing src/
bun run check
```

For visual changes, render the presets before and after and compare them:

```sh
bunx playwright-core install chromium
bun run gallery --shots .gallery
```

Attach the before and after images for the apps and themes you changed. When the change affects the README images, regenerate them with `bun run gallery --docs`.

## Releases

Merging a `package.json` version bump to `main` tags `v<version>` once CI passes. The release workflow checks and packs that commit, installs the exact tarball in a clean consumer, and publishes it with `SHA256SUMS` in an immutable GitHub Release. Consumers pin the release's `hraness-textmockups-<version>.tgz` URL. The scene format and renderer are unchanged in v0.3.4. Drafts are resolved through the CLI to an exact numeric release ID because GitHub's published-tag endpoint does not expose them.

GitHub release immutability must be enabled before publication. The workflow uploads both files to a prerelease draft and compares their uploaded bytes with the checked artifact. It publishes that prerelease without changing Latest, checks that the actual release is immutable, and verifies GitHub's signed release and asset attestations. Only then does it promote the release to stable and Latest; npm runs after that promotion.

This checks the actual artifact instead of querying the administrative settings API, which the workflow's contents-only token cannot read. It never widens that token, rewrites an existing tag, or replaces release assets. If the release is not locked or its attestations fail, it remains an unpromoted prerelease and the workflow stops. Resolve the provider configuration before another release; never delete or overwrite artifacts to force a retry.

## npm

GitHub Releases are the canonical package distribution. The optional `npm`
job mirrors the same tarball as `@hraness/textmockups` with a provenance
attestation. It uses npm trusted publishing, so GitHub Actions proves the
workflow's identity to npm and no npm token is stored anywhere. An existing
npm version must have the same package integrity and provenance; it is never
replaced. npm setup is not required to install the GitHub package.

npm only accepts trusted publishing for a package that already exists, so the
job warns and skips until a maintainer does this once:

1. From a clean checkout of the newest `v*` tag, which the release workflow
   has already checked, publish the first version by hand:
   `npm publish --access public --ignore-scripts`.
2. Let this workflow publish from now on:
   `npm trust github @hraness/textmockups --repo hraness/textmockups --file release.yml --allow-publish --yes`
   (npm 11.16 or newer).
3. In the package settings on npmjs.com, require two-factor authentication and
   disallow tokens.
