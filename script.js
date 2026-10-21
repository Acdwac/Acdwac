/* ==========================================================================
   DLS League Manager - JavaScript Application Logic
   ========================================================================== */

// Global Backend Data Store (Pre-populated with default league, teams, and results)
let backendDatabase = {
    leagueName: "DLS Champions League",
    teams: ["Real Madrid", "FC Barcelona", "Man City", "PSG"],
    matches: []
};

/**
 * Initializes the default matches and pre-entered results upon initial load.
 */
function initDefaultData() {
    backendDatabase.matches = [
        { id: 0, round: 1, homeTeam: "Real Madrid", awayTeam: "PSG", homeScore: 3, awayScore: 1 },
        { id: 1, round: 1, homeTeam: "FC Barcelona", awayTeam: "Man City", homeScore: 2, awayScore: 2 },
        { id: 2, round: 2, homeTeam: "Real Madrid", awayTeam: "FC Barcelona", homeScore: 1, awayScore: 0 },
        { id: 3, round: 2, homeTeam: "PSG", awayTeam: "Man City", homeScore: null, awayScore: null },
        { id: 4, round: 3, homeTeam: "Man City", awayTeam: "Real Madrid", homeScore: null, awayScore: null },
        { id: 5, round: 3, homeTeam: "FC Barcelona", awayTeam: "PSG", homeScore: null, awayScore: null }
    ];
}

// Application Startup
window.onload = function() {
    initDefaultData();
    renderPublicView();
    renderAdminDrawer();
};

/**
 * Switches between the Public Standings Table and Fixtures/Results tabs.
 */
function switchTab(tab) {
    document.getElementById('tabTableBtn').classList.toggle('active', tab === 'table');
    document.getElementById('tabFixturesBtn').classList.toggle('active', tab === 'fixtures');
    document.getElementById('tableView').style.display = tab === 'table' ? 'block' : 'none';
    document.getElementById('fixturesView').style.display = tab === 'fixtures' ? 'block' : 'none';
}

/**
 * Toggles the Backend Administration drawer.
 */
function toggleAdminDrawer(open) {
    document.getElementById('adminDrawer').classList.toggle('open', open);
}

/* ==========================================================================
   PUBLIC FRONTEND RENDERERS (READ-ONLY FOR VISITORS)
   ========================================================================== */

/**
 * Master public renderer function to update all public components.
 */
function renderPublicView() {
    // 1. Update Public Header Title
    const titleElement = document.getElementById('publicLeagueTitle');
    if (titleElement) {
        titleElement.innerText = `🎮 ${backendDatabase.leagueName}`;
    }

    // 2. Render Public Standings Table
    renderPublicStandings();

    // 3. Render Public Fixtures & Results
    renderPublicFixtures();
}

/**
 * Computes match statistics and updates the public standings table.
 * Sorted by: Points (Pts) -> Goal Difference (GD) -> Goals For (GF)
 */
function renderPublicStandings() {
    let stats = {};

    // Initialize stats for each registered team
    backendDatabase.teams.forEach(t => {
        stats[t] = { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
    });

    // Process finished matches
    backendDatabase.matches.forEach(m => {
        if (m.homeScore !== null && m.awayScore !== null) {
            const home = stats[m.homeTeam];
            const away = stats[m.awayTeam];

            if (home && away) {
                home.played++; 
                away.played++;
                home.gf += m.homeScore; 
                home.ga += m.awayScore;
                away.gf += m.awayScore; 
                away.ga += m.homeScore;

                if (m.homeScore > m.awayScore) {
                    home.won++; 
                    home.pts += 3; 
                    away.lost++;
                } else if (m.homeScore < m.awayScore) {
                    away.won++; 
                    away.pts += 3; 
                    home.lost++;
                } else {
                    home.drawn++; 
                    away.drawn++; 
                    home.pts += 1; 
                    away.pts += 1;
                }
            }
        }
    });

    // Calculate Goal Difference
    Object.keys(stats).forEach(t => { 
        stats[t].gd = stats[t].gf - stats[t].ga; 
    });

    // Rank teams: Points -> Goal Difference -> Goals For
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

/**
 * Displays match fixtures and read-only score badges to public viewers.
 */
function renderPublicFixtures() {
    const container = document.getElementById('publicFixturesList');
    if (!container) return;

    if (backendDatabase.matches.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: var(--text-muted);">No fixtures generated yet.</p>`;
        return;
    }

    let html = '';
    let currentRound = 0;

    backendDatabase.matches.forEach(m => {
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

/* ==========================================================================
   BACKEND ADMIN FUNCTIONS
   ========================================================================== */

/**
 * Initializes and populates the backend drawer form fields.
 */
function renderAdminDrawer() {
    const leagueInput = document.getElementById('adminLeagueInput');
    if (leagueInput) leagueInput.value = backendDatabase.leagueName;
    
    renderAdminTeamList();
    renderAdminFixturesInput();
}

/**
 * Updates the League Name from backend drawer input.
 */
function saveLeagueNameBackend() {
    const val = document.getElementById('adminLeagueInput').value.trim();
    if (val) {
        backendDatabase.leagueName = val;
        renderPublicView();
    }
}

/**
 * Adds a new team via the backend drawer.
 */
function addTeamBackend() {
    const input = document.getElementById('adminTeamInput');
    const team = input.value.trim();

    if (team && !backendDatabase.teams.includes(team)) {
        backendDatabase.teams.push(team);
        input.value = '';
        renderAdminTeamList();
        renderPublicView();
    }
}

/**
 * Removes a team from backend state.
 */
function removeTeamBackend(teamName) {
    backendDatabase.teams = backendDatabase.teams.filter(t => t !== teamName);
    renderAdminTeamList();
    renderPublicView();
}

/**
 * Renders the removable team tags inside the admin panel.
 */
function renderAdminTeamList() {
    const ul = document.getElementById('adminTeamList');
    if (!ul) return;

    ul.innerHTML = backendDatabase.teams.map(t => `
        <li class="team-tag">
            ${t}
            <span class="remove-team-btn" onclick="removeTeamBackend('${t}')">✕</span>
        </li>
    `).join('');
}

/**
 * Round-Robin (Berger) Algorithm for generating all tournament fixtures in backend.
 */
function generateFixturesBackend() {
    if (backendDatabase.teams.length < 2) {
        alert("Please add at least 2 teams to generate fixtures.");
        return;
    }

    backendDatabase.matches = [];
    let list = [...backendDatabase.teams];

    // Append temporary BYE team if odd number of teams
    if (list.length % 2 !== 0) list.push("BYE");

    const numRounds = list.length - 1;
    const halfSize = list.length / 2;

    for (let round = 0; round < numRounds; round++) {
        for (let i = 0; i < halfSize; i++) {
            const home = list[i];
            const away = list[list.length - 1 - i];

            if (home !== "BYE" && away !== "BYE") {
                backendDatabase.matches.push({
                    id: backendDatabase.matches.length,
                    round: round + 1,
                    homeTeam: home,
                    awayTeam: away,
                    homeScore: null,
                    awayScore: null
                });
            }
        }
        // Rotate elements for round robin rotation
        list.splice(1, 0, list.pop());
    }

    renderAdminFixturesInput();
    renderPublicView();
}

/**
 * Renders editable score input controls inside the backend drawer.
 */
function renderAdminFixturesInput() {
    const container = document.getElementById('adminFixturesContainer');
    if (!container) return;

    if (backendDatabase.matches.length === 0) {
        container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem;">No fixtures available.</p>`;
        return;
    }

    let html = '';
    let currentRound = 0;

    backendDatabase.matches.forEach(m => {
        if (m.round !== currentRound) {
            currentRound = m.round;
            html += `<div style="font-weight:700; color:var(--accent-blue); margin:10px 0 4px 0;">Round ${currentRound}</div>`;
        }

        html += `
            <div class="admin-fixture-row">
                <span style="flex:1; text-align:right; font-weight:600;">${m.homeTeam}</span>
                <div style="margin: 0 8px; display:flex; gap:4px; align-items:center;">
                    <input type="number" min="0" class="backend-score-input" value="${m.homeScore ?? ''}" 
                        onchange="updateScoreBackend(${m.id}, 'home', this.value)">
                    -
                    <input type="number" min="0" class="backend-score-input" value="${m.awayScore ?? ''}" 
                        onchange="updateScoreBackend(${m.id}, 'away', this.value)">
                </div>
                <span style="flex:1; text-align:left; font-weight:600;">${m.awayTeam}</span>
            </div>
        `;
    });

    container.innerHTML = html;
}

/**
 * Updates match scores in backend and syncs instantly to public view.
 */
function updateScoreBackend(matchId, type, val) {
    const match = backendDatabase.matches.find(m => m.id === matchId);
    if (!match) return;

    const score = val === '' ? null : parseInt(val, 10);
    if (type === 'home') match.homeScore = score;
    if (type === 'away') match.awayScore = score;

    // Instantly sync changes to public read-only views
    renderPublicView();
}
