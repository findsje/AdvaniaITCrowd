const $ = (selector) => document.querySelector(selector);

const formatDate = (iso, options = { day: 'numeric', month: 'long', year: 'numeric' }) =>
  new Intl.DateTimeFormat('is-IS', { ...options, timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`));

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function validate(players, tournament) {
  const ids = new Set(players.map((player) => player.id));
  if (ids.size !== players.length) throw new Error('Duplicate player ID in players.json');
  for (const round of tournament.rounds) {
    for (const game of round.games) {
      const inGame = new Set();
      for (const score of game.scores) {
        if (!ids.has(score.playerId)) throw new Error(`Unknown player: ${score.playerId}`);
        if (inGame.has(score.playerId)) throw new Error(`Duplicate player in game ${game.number}`);
        if (!Number.isInteger(score.points) || score.points < 0 || score.points > 300) throw new Error(`Invalid score for ${score.playerId}`);
        inGame.add(score.playerId);
      }
    }
  }
}

function render(players, tournament) {
  validate(players, tournament);
  const playerById = new Map(players.map((player) => [player.id, player]));
  const stats = new Map(players.map((player) => [player.id, { games: 0, points: 0 }]));
  const completed = tournament.rounds.filter((round) => round.status === 'completed');
  const scores = completed.flatMap((round) => round.games.flatMap((game) => game.scores));
  for (const score of scores) {
    const stat = stats.get(score.playerId);
    stat.games += 1;
    stat.points += score.points;
  }

  const nextRound = tournament.schedule.find((round) => round.status === 'scheduled');
  $('#season').textContent = tournament.season;
  $('#next-date').textContent = formatDate(nextRound.date, { day: 'numeric', month: 'long' });
  $('#next-year').textContent = nextRound.date.slice(0, 4);
  $('#player-count').textContent = players.length;
  $('#game-count').textContent = scores.length;
  $('#points-count').textContent = scores.reduce((total, score) => total + score.points, 0).toLocaleString('is-IS');
  $('#footer-year').textContent = new Date().getFullYear();

  const scheduleList = $('#schedule-list');
  scheduleList.replaceChildren();
  for (const round of tournament.schedule) {
    const row = element('div', `schedule-row${round.status === 'completed' ? ' is-complete' : ''}${round.number === nextRound.number ? ' is-next' : ''}`);
    row.append(element('span', 'round-index', String(round.number).padStart(2, '0')));
    const name = element('div', 'schedule-name');
    name.append(element('strong', '', `${round.number}. umferð`), element('small', '', round.status === 'completed' ? 'Lokið' : round.number === nextRound.number ? 'Næst á dagskrá' : 'Væntanlegt'));
    row.append(name, element('span', 'schedule-date', formatDate(round.date)), element('span', 'schedule-time', round.time));
    scheduleList.append(row);
  }

  const collator = new Intl.Collator('is-IS');
  const ranked = [...players].sort((a, b) => stats.get(a.id).games - stats.get(b.id).games || collator.compare(a.name, b.name));
  const fewest = stats.get(ranked[0].id).games;
  const priority = ranked.filter((player) => stats.get(player.id).games === fewest);
  const priorityGrid = $('#priority-grid');
  priorityGrid.replaceChildren();
  priority.forEach((player, index) => {
    const card = element('article', 'priority-card');
    card.append(element('span', 'position', `FORGANGUR ${String(index + 1).padStart(2, '0')}`));
    const detail = element('div');
    detail.append(element('h3', '', player.name), element('p', '', player.roleIs));
    card.append(detail, element('span', 'game-pill', `${fewest} ${fewest === 1 ? 'leikur' : 'leikir'} spilaðir`));
    priorityGrid.append(card);
  });

  const roster = $('#roster');
  roster.replaceChildren();
  for (const player of ranked) {
    const stat = stats.get(player.id);
    const row = element('div', 'roster-row');
    const person = element('div', 'person');
    const initials = player.name.split(' ').map((part) => part[0]).slice(0, 2).join('');
    const nameBlock = element('div');
    nameBlock.append(element('strong', '', player.name), element('small', '', `${player.roleIs} / ${player.roleEn}`));
    person.append(element('span', 'avatar', initials), nameBlock);
    row.append(person, element('span', 'games-count', stat.games), element('span', '', stat.points), element('span', '', stat.games ? Math.round(stat.points / stat.games) : '—'));
    roster.append(row);
  }

  const latest = completed.at(-1);
  if (!latest) return;
  $('#last-round-date').textContent = formatDate(latest.date);
  const latestScores = latest.games.flatMap((game) => game.scores);
  const total = latestScores.reduce((sum, score) => sum + score.points, 0);
  $('#round-total').textContent = total.toLocaleString('is-IS');
  const best = latestScores.reduce((top, score) => score.points > top.points ? score : top);
  $('#best-score').textContent = best.points;
  $('#best-player').textContent = playerById.get(best.playerId).name;

  const results = $('#game-results');
  results.replaceChildren();
  for (const game of latest.games) {
    const item = element('div', 'game-result');
    const heading = element('div', 'game-result-head');
    heading.append(element('span', '', `LEIKUR ${String(game.number).padStart(2, '0')}`), element('span', '', game.scores.reduce((sum, score) => sum + score.points, 0)));
    const chips = element('div', 'score-list');
    for (const score of game.scores) {
      const chip = element('span', 'score-chip', playerById.get(score.playerId).name);
      chip.append(element('strong', '', score.points));
      chips.append(chip);
    }
    item.append(heading, chips);
    results.append(item);
  }
}

async function main() {
  try {
    const [playersResponse, tournamentResponse] = await Promise.all([
      fetch('./data/players.json'),
      fetch('./data/tournament.json')
    ]);
    if (!playersResponse.ok || !tournamentResponse.ok) throw new Error('Could not load the JSON data.');
    render(await playersResponse.json(), await tournamentResponse.json());
  } catch (error) {
    console.error(error);
    $('#priority-grid').replaceChildren(element('p', 'error', 'Ekki tókst að sækja gögnin. Endurhlaðið síðuna.'));
  }
}

main();
