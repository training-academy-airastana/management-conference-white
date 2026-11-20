# Air Astana Group Management Conference — White

The main white version of the XVIII Management Conference website, 3 December 2026.
Includes responsive navigation, three agenda views and speaker dialogs.

## Run locally

```sh
npm ci
npm run dev
```

## Publication

GitHub Actions builds the static Next.js export and publishes it to GitHub Pages.
The repository name supplies the base path automatically.

Update confirmed links and forthcoming copy in `data/siteConfig.ts`.
The supplied programme's quiz and panel overlap is retained.
Brand asset sources are recorded in `public/fonts/SOURCES.txt`.
