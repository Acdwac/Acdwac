// Mandated 12 Teams for DLS ABAFUDIKI LEAGUE
const DEFAULT_TEAMS = [
    "Acdwac fc", "DBH OB HEATER", "BIG SHOE FC", "Galatasaray f.c", 
    "Young stars", "Trist FC", "Phoenix FC", "Sc kitara", 
    "BC FC", "Patryc FC", "Arsenal DMWS FC", "CR7 fc"
];

let leagueData = {
    leagueName: "DLS ABAFUDIKI LEAGUE",
    teams: DEFAULT_TEAMS,
    matches: []
};

// Generate full 22-Round Double Round-Robin algorithm (132 total matches)
function generateDefaultMatches(teams) {
    let matches = [];
    let idCounter = 0;
    const numTeams = teams.length;
    let tempTeams = [...teams];

    for (let round = 1; round <= (numTeams - 1) * 2; round++) {
        const isSecondHalf = round > (numTeams - 1);

        for (let i = 0; i < numTeams / 2; i++) {
            const homeIndex = i;
            const awayIndex = numTeams - 1 - i;

            let home = tempTeams[homeIndex];
            let away = tempTeams[awayIndex];

            if (isSecondHalf) {
                let swap = home;
                home = away;
                away = swap;
            }

            matches.push({
                id: idCounter++,
                round: round,
                homeTeam: home,
                awayTeam: away,
                homeScore: null,
                awayScore: null
            });
        }

        // Rotate team list holding the first element fixed
        tempTeams.splice(1, 0, tempTeams.pop());
    }

    return matches;
}

// Initialize and Load Data
window.onload = function() {
    fetch('data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            leagueData = data;
            leagueData.leagueName = "DLS ABAFUDIKI LEAGUE";
            if (!leagueData.matches || leagueData.matches.length === 0) {
                leagueData.matches = generateDefaultMatches(leagueData.teams || DEFAULT_TEAMS);
            }
            renderPublicView();
        })
        .catch(error => {
            console.log('Using default 22-round fallback dataset for DLS ABAFUDIKI LEAGUE:', error);
            leagueData.matches = generateDefaultMatches(DEFAULT_TEAMS);
            renderPublicView();
        });
};

// Navigation Tab Switching
function switchTab(tab) {
    const tableBtn = document.getElementById('tabTableBtn');
    const fixturesBtn = document.getElementById('tabFixturesBtn');
    const tableView = document.getElementById('tableView');
    const fixturesView = document.getElementById('fixturesView');

    if (tab === 'table') {
        tableBtn.classList.add('active');
        tableBtn.classList.remove('text-gray-300');
        fixturesBtn.classList.remove('active');
        fixturesBtn.classList.add('text-gray-300');
        
        tableView.classList.remove('hidden');
        tableView.classList.add('block');
        fixturesView.classList.remove('block');
        fixturesView.classList.add('hidden');
    } else {
        fixturesBtn.classList.add('active');
        fixturesBtn.classList.remove('text-gray-300');
        tableBtn.classList.remove('active');
        tableBtn.classList.add('text-gray-300');

        fixturesView.classList.remove('hidden');
        fixturesView.classList.add('block');
        tableView.classList.remove('block');
        tableView.classList.add('hidden');
    }
}

// Render Page Contents
function renderPublicView() {
    const titleElem = document.getElementById('publicLeagueTitle');
    if (titleElem) {
        titleElem.innerHTML = `<i class="fa-solid fa-trophy text-goldCustom"></i> DLS ABAFUDIKI LEAGUE`;
    }
    renderPublicStandings();
    populateRoundFilter();
    renderPublicFixtures('all');
}

// Compute & Display Table
function renderPublicStandings() {
    let stats = {};
    const teams = leagueData.teams || DEFAULT_TEAMS;

    teams.forEach(t => {
        stats[t] = { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
    });

    let playedMatchesCount = 0;

    if (leagueData.matches) {
        leagueData.matches.forEach(m => {
            if (m.homeScore !== null && m.awayScore !== null && m.homeScore !== "" && m.awayScore !== "") {
                playedMatchesCount++;
                const home = stats[m.homeTeam];
                const away = stats[m.awayTeam];

                if (home && away) {
                    const hScore = parseInt(m.homeScore, 10);
                    const aScore = parseInt(m.awayScore, 10);

                    home.played++; away.played++;
                    home.gf += hScore; home.ga += aScore;
                    away.gf += aScore; away.ga += hScore;

                    if (hScore > aScore) {
                        home.won++; home.pts += 3; away.lost++;
                    } else if (hScore < aScore) {
                        away.won++; away.pts += 3; home.lost++;
                    } else {
                        home.drawn++; away.drawn++; home.pts += 1; away.pts += 1;
                    }
                }
            }
        });
    }

    const counterElem = document.getElementById('matchCounter');
    if (counterElem) {
        counterElem.innerText = `${playedMatchesCount} / ${leagueData.matches ? leagueData.matches.length : 132} Played`;
    }

    Object.keys(stats).forEach(t => { stats[t].gd = stats[t].gf - stats[t].ga; });

    // Sort: Points -> Goal Difference -> Goals For
    const sorted = Object.keys(stats).sort((a, b) => {
        if (stats[b].pts !== stats[a].pts) return stats[b].pts - stats[a].pts;
        if (stats[b].gd !== stats[a].gd) return stats[b].gd - stats[a].gd;
        return stats[b].gf - stats[a].gf;
    });

    const tbody = document.getElementById('publicStandingsBody');
    if (!tbody) return;

    if (sorted.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" class="py-6 text-gray-400">No teams registered</td></tr>`;
        return;
    }

    tbody.innerHTML = sorted.map((team, idx) => {
        const s = stats[team];
        const rank = idx + 1;

        let posBadgeClass = "text-gray-400";
        let rowBgClass = "hover:bg-darkHeader/60 transition-colors";

        if (rank === 1) {
            posBadgeClass = "bg-goldCustom text-darkBg font-black w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px]";
            rowBgClass = "bg-goldCustom/10 hover:bg-goldCustom/20 transition-colors";
        } else if (rank <= 4) {
            posBadgeClass = "bg-emeraldCustom/20 text-emeraldCustom font-bold w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px]";
        }

        return `
            <tr class="${rowBgClass}">
                <td class="font-mono">
                    <span class="${posBadgeClass}">${rank}</span>
                </td>
                <td class="text-left pl-2 font-bold text-white tracking-wide">
                    ${rank === 1 ? `<i class="fa-solid fa-crown text-goldCustom text-[10px] mr-1"></i>` : ''}
                    ${team}
                </td>
                <td class="text-gray-300 font-mono">${s.played}</td>
                <td class="text-gray-300 font-mono">${s.won}</td>
                <td class="text-gray-300 font-mono">${s.drawn}</td>
                <td class="text-gray-300 font-mono">${s.lost}</td>
                <td class="text-gray-400 font-mono text-[11px]">${s.gf}</td>
                <td class="text-gray-400 font-mono text-[11px]">${s.ga}</td>
                <td class="font-mono font-semibold ${s.gd > 0 ? 'text-mintCustom' : s.gd < 0 ? 'text-red-400' : 'text-gray-400'}">
                    ${s.gd > 0 ? '+' + s.gd : s.gd}
                </td>
                <td class="font-mono font-black text-emeraldCustom text-sm pr-2">${s.pts}</td>
            </tr>
        `;
    }).join('');
}

// Fill Round Filter Options
function populateRoundFilter() {
    const select = document.getElementById('roundFilter');
    if (!select || !leagueData.matches) return;

    const rounds = [...new Set(leagueData.matches.map(m => m.round))].sort((a, b) => a - b);
    
    let optionsHTML = '<option value="all">Show All Rounds (22)</option>';
    rounds.forEach(r => {
        optionsHTML += `<option value="${r}">Round ${r}</option>`;
    });
    select.innerHTML = optionsHTML;
}

function filterRound(val) {
    renderPublicFixtures(val);
}

// Render Fixtures List
function renderPublicFixtures(selectedRound) {
    const container = document.getElementById('publicFixturesList');
    if (!container) return;

    if (!leagueData.matches || leagueData.matches.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-400 py-6 text-xs">No fixtures available.</p>`;
        return;
    }

    let filteredMatches = leagueData.matches;
    if (selectedRound !== 'all') {
        filteredMatches = leagueData.matches.filter(m => m.round == selectedRound);
    }

    let html = '';
    let currentRound = 0;

    filteredMatches.forEach(m => {
        if (m.round !== currentRound && selectedRound === 'all') {
            currentRound = m.round;
            html += `
                <div class="sticky top-0 bg-darkHeader border border-darkBorder text-mintCustom text-[11px] font-bold px-3 py-1 rounded-lg my-2 uppercase tracking-wider flex items-center justify-between shadow-sm">
                    <span><i class="fa-solid fa-flag text-emeraldCustom mr-1"></i> Round ${currentRound}</span>
                    <span class="text-[9px] text-gray-400">6 Matches</span>
                </div>
            `;
        }

        const isPlayed = m.homeScore !== null && m.awayScore !== null && m.homeScore !== "" && m.awayScore !== "";
        const scoreText = isPlayed ? `${m.homeScore} - ${m.awayScore}` : `VS`;
        
        const badgeStyle = isPlayed 
            ? `bg-emeraldCustom text-darkBg font-black px-2.5 py-1 rounded-md text-xs shadow-sm` 
            : `bg-darkBg text-gray-400 font-bold px-2 py-1 rounded border border-darkBorder text-[10px]`;

        html += `
            <div class="bg-darkBg hover:bg-darkHeader/80 border border-darkBorder p-2 rounded-lg flex items-center justify-between gap-1 transition-all">
                <span class="w-2/5 text-right font-semibold text-white text-xs truncate">${m.homeTeam}</span>
                <div class="w-1/5 text-center flex justify-center">
                    <span class="${badgeStyle}">${scoreText}</span>
                </div>
                <span class="w-2/5 text-left font-semibold text-white text-xs truncate">${m.awayTeam}</span>
            </div>
        `;
    });

    container.innerHTML = html;
}
