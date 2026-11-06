# Historical publication workflows

Textmockups was retired on 6 November 2026. These workflow files were moved unchanged from `.github/workflows/`:

- `auto-tag.yml` created version tags after CI passed on `main`.
- `release.yml` published immutable GitHub Releases and an optional npm mirror.

They are preserved for history and are not loaded by GitHub Actions. The original files are also available at [the last active source commit](https://github.com/hraness/textmockups/tree/568dbd0295fd628bb7ce8f3ff561f604a1038c18/.github/workflows). Required CI remains in `.github/workflows/ci.yml`. Existing tags, release assets, and package files are preserved.
