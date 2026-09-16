# Xplaya Core

Import the attached XPLAYA ZIP and build/run the project from the existing source code.



IMPORTANT: Everything inside the ZIP is part of XPLAYA. Build and preserve everything that already exists inside the ZIP. Do not start over, redesign it, or replace existing systems.



Use the ZIP as the source of truth.



Firebase Authentication



Use the existing Firebase Authentication code/configuration inside the ZIP.



If the Firebase/Google API key is missing or required, use the key I provide below:



GOOGLE / FIREBASE API KEY:

AIzaSyDrrtGK2hBEa_j7E88pwNpBfk8hsAv1nX4



Also identify the exact Lovable preview/published domain that needs to be added to Firebase Authentication → Authorized Domains, and tell me the domain if I need to add it manually.



Cloudflare R2



Use the existing Cloudflare R2 code already inside the ZIP.



Do not rebuild the R2 system and do not use Firebase Storage.



If the R2 secrets are missing, I will provide them below. Add them securely as server-side secrets/environment variables.



R2 ACCESS KEY ID:

a4f704280bad592e9daf698bd2818aee



R2 SECRET ACCESS KEY:

a5cd65aea0e67b38fd1f251c5d004891328b6255944c76fec41cb5b5c44421b3



Do not expose R2 secrets in frontend code.



Final instruction



Build and run everything that is already inside the ZIP.



Do not remove existing features.



Do not recreate existing features unnecessarily.



Do not redesign the UI.



First inspect the imported project, then run it and fix only genuine errors or missing connections.



After the existing project is running correctly, we will continue with the remaining XPLAYA work.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://xplaya-to-the-moon.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4a3cb937-fec3-48fe-9b13-085055b565a7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
