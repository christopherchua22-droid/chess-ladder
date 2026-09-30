# Chess Club Ladder

A public Elo leaderboard for a chess club, hosted free on GitHub Pages. Anyone
can view rankings and player histories. Only the repo owner can sign in and
record games, because saving a game is a commit to this repo, which GitHub only
allows for people with write access. No server or database needed.

Everyone starts at 1200. Ratings are recomputed from the full game list every
time the page loads, so `data.json` (players + games) is the only source of truth.

## Setup (about 5 minutes)

1. Create a **public** GitHub repo named `chess-ladder` and upload all these files.
2. Edit `config.js`: set `owner` to your GitHub username (and `repo` / `branch` if different).
3. In the repo go to **Settings → Pages**, choose **Deploy from a branch**, branch `main`, folder `/ (root)`.
   Your site will be at `https://YOUR_USERNAME.github.io/chess-ladder/`.
4. Create a token for signing in to the admin page:
   **GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**
   - Repository access: **Only select repositories** → `chess-ladder`
   - Permissions: **Contents → Read and write**
   - Copy the token (it starts with `github_pat_`).
5. Open `/admin.html` on your site, paste the token, and sign in.
6. (Optional) In the admin page, scroll to **Password login**, choose a long password, and save. From then on you sign in with the password instead of the token.

## Using it

- **Add a player**, then **Record a game** (choose the two players and the result).
- Each action is saved as a commit. The public page updates about a minute later
  (the time GitHub Pages needs to redeploy).
- **Undo last game** removes the most recent game if you make a mistake.

## Password login: how it works and its limits

The password encrypts your token (AES-256-GCM, key stretched with 600,000 rounds of PBKDF2)
and the encrypted result is saved as `vault.json` in the repo. Signing in with the password
decrypts it in your browser. The password itself is never stored or sent anywhere.

Because the repo is public, anyone can download `vault.json` and try to guess the password
offline. A long passphrase (four or more random words) makes that impractical; a short or
common password does not. The token only reaches this one repo's contents, and you can revoke
it any time in GitHub settings, which also disables the password login.

## Notes

- Your token is stored only in your browser's local storage. Use a private device,
  keep the token scoped to this one repo, and press **Sign out** on shared computers.
- Anyone can find `admin.html`, but without a valid token nothing can be saved.
- Game history is public (it lives in `data.json` in a public repo).
- Rating settings (start rating, K-factor) are at the top of `elo.js`. Changing them
  re-rates every past game automatically.

## Tests

```bash
node test-elo.js
node test-vault.js
```
