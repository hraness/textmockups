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

Merging a `package.json` version bump to `main` tags `v<version>` once CI passes, and the tag publishes an immutable GitHub Release. Consumers pin `github:hraness/textmockups#v<version>`.

## npm

After the GitHub Release, the release workflow's `npm` job publishes the
tagged commit to npm as `@hraness/textmockups` with a provenance attestation.
It uses npm trusted publishing, so GitHub Actions proves the workflow's
identity to npm and no npm token is stored anywhere. The job skips a version
that npm already has.

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
