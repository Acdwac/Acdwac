let leagueData = { leagueName: "", teams: [], matches: [] };

// Fetch data.json automatically when the page opens
window.onload = function() {
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            leagueData = data;
            renderPublicView();
        })
        .catch(error => {
            console.error('Error loading league data:', error);
        });
};

function switchTab(tab) {
    document.getElementById('tabTableBtn').classList.toggle('active', tab === 'table');
    document.getElementById('tabFixturesBtn').classList.toggle('active', tab === 'fixtures');
    document.getElementById('tableView').style.display = tab === 'table' ? 'block' : 'none';
    document.getElementById('fixturesView').style.display = tab === 'fixtures' ? 'block' : 'none';
}

function renderPublicView() {
    document.getElementById('publicLeagueTitle').innerText = `🎮 ${leagueData.leagueName}`;
    renderPublicStandings();
    renderPublicFixtures();
}

function renderPublicStandings() {
    let stats = {};
    leagueData.teams.forEach(t => {
        stats[t] = { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
    });

    leagueData.matches.forEach(m => {
        if (m.homeScore !== null && m.awayScore !== null) {
            const home = stats[m.homeTeam];
            const away = stats[m.awayTeam];

            if (home && away) {
                home.played++; away.played++;
                home.gf += m.homeScore; home.ga += m.awayScore;
                away.gf += m.awayScore; away.ga += m.homeScore;

                if (m.homeScore > m.awayScore) {
                    home.won++; home.pts += 3; away.lost++;
                } else if (m.homeScore < m.awayScore) {
                    away.won++; away.pts += 3; home.lost++;
                } else {
                    home.drawn++; away.drawn++; home.pts += 1; away.pts += 1;
                }
            }
        }
    });

    Object.keys(stats).forEach(t => { stats[t].gd = stats[t].gf - stats[t].ga; });

    const sorted = Object.keys(stats).sort((a, b) => {
        if (stats[b].pts !== stats[a].pts) return stats[b].pts - stats[a].pts;
        if (stats[b].gd !== stats[a].gd) return stats[b].gd - stats[a].gd;
        return stats[b].gf - stats[a].gf;
    });

    const tbody = document.getElementById('publicStandingsBody');
    if (!tbody) return;

    if (sorted.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" style="color: var(--text-muted);">No teams registered</td></tr>`;
        return;
    }

    tbody.innerHTML = sorted.map((team, idx) => {
        const s = stats[team];
        return `
            <tr>
                <td class="pos">${idx + 1}</td>
                <td style="text-align: left; font-weight: 600;">${team}</td>
                <td>${s.played}</td>
                <td>${s.won}</td>
                <td>${s.drawn}</td>
                <td>${s.lost}</td>
                <td>${s.gf}</td>
                <td>${s.ga}</td>
                <td>${s.gd}</td>
                <td class="pts">${s.pts}</td>
            </tr>
        `;
    }).join('');
}

function renderPublicFixtures() {
    const container = document.getElementById('publicFixturesList');
    if (!container) return;

    if (leagueData.matches.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: var(--text-muted);">No fixtures generated yet.</p>`;
        return;
    }

    let html = '';
    let currentRound = 0;

    leagueData.matches.forEach(m => {
        if (m.round !== currentRound) {
            currentRound = m.round;
            html += `<div class="round-title">Round ${currentRound}</div>`;
        }

        const isPlayed = m.homeScore !== null && m.awayScore !== null;
        const scoreText = isPlayed ? `${m.homeScore} - ${m.awayScore}` : `VS`;
        const badgeClass = isPlayed ? 'score-badge' : 'score-badge pending';

        html += `
            <div class="fixture-card">
                <span class="fixture-team home">${m.homeTeam}</span>
                <span class="${badgeClass}">${scoreText}</span>
                <span class="fixture-team away">${m.awayTeam}</span>
            </div>
        `;
    });

    container.innerHTML = html;
}
