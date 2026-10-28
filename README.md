# Advania IT Crowd

A small, static bowling team site for GitHub Pages. Player and tournament data live in JSON; the page calculates games played, total points, averages, and next-round priority in the browser.

## Update the data

- Edit `data/players.json` to add or change a player. Keep each `id` unique and stable.
- Edit the `schedule` array in `data/tournament.json` for dates and status.
- Add each completed competition to `rounds` in `data/tournament.json`. Each of its three `games` has a `scores` array containing `playerId` and `points` for each participant.
- Set the matching schedule entry to `"completed"`. The first remaining `"scheduled"` entry is displayed as the next round.

Priority goes to players with the fewest recorded individual games. Ties are shown in Icelandic alphabetical order. The site does not make a final team selection.

## Preview locally

Run `python -m http.server 8000` from the project root and visit `http://127.0.0.1:8000/`. The JSON fetches require a web server, so opening `index.html` directly as a file will not work.

## Publish

The GitHub Actions workflow in `.github/workflows/pages.yml` deploys the repository on pushes to `main`. In the repository's **Settings → Pages**, set **Build and deployment → Source** to **GitHub Actions** once. The site URL is `https://findsje.github.io/AdvaniaITCrowd/`.

The schedule is linked to the [KLÍ Riðill 2 page](https://www.kli.is/utandeild/ridill-2/). The first-round scores were transcribed from `src/img/okt11results.webp`; the round date follows the team's supplied date of 14 October 2026.
