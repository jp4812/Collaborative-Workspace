// Nexus Analytics Engine
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

// Auth Guard
if (!token) {
    window.location.href = '/signin.html';
}

// RBAC Guard: Analytics is accessible to Corporate Administrators ONLY
if (user.role !== 'Admin') {
    window.location.href = '/dashboard.html';
}

// User Profile Setup
document.getElementById('userName').textContent = user.name || user.email || 'User';
const roleBadge = document.getElementById('userRoleBadge');
roleBadge.textContent = user.role || 'Member';
if (user.role === 'Admin') {
    roleBadge.className = 'badge badge-purple';
} else {
    roleBadge.className = 'badge badge-emerald';
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/signin.html';
});

// Chart instances store
let charts = {
    status: null,
    workload: null,
    priority: null,
    velocity: null
};

// Global state
let allWorkspaces = [];
let allTasks = [];

// Init on load
document.addEventListener('DOMContentLoaded', async () => {
    await fetchWorkspaces();
    await loadAnalyticsData();

    document.getElementById('workspaceFilter').addEventListener('change', () => {
        applyWorkspaceFilter();
    });

    document.getElementById('refreshBtn').addEventListener('click', async () => {
        await loadAnalyticsData();
    });
});

// 1. Fetch accessible workspaces
async function fetchWorkspaces() {
    try {
        const res = await fetch('/api/workspaces', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        allWorkspaces = Array.isArray(data) ? data : (data.workspaces || []);

        const select = document.getElementById('workspaceFilter');
        select.innerHTML = '<option value="ALL">All Workspaces Combined</option>';

        allWorkspaces.forEach(ws => {
            const opt = document.createElement('option');
            opt.value = ws._id;
            opt.textContent = ws.name;
            select.appendChild(opt);
        });
    } catch (err) {
        console.error('Failed to load workspaces:', err);
    }
}

// 2. Fetch all tasks across all workspaces
async function loadAnalyticsData() {
    allTasks = [];

    try {
        for (const ws of allWorkspaces) {
            const res = await fetch(`/api/tasks/workspace/${ws._id}`, {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await res.json();
            const tasks = Array.isArray(data) ? data : (data.tasks || []);

            tasks.forEach(t => {
                // Attach workspace metadata for filtering
                t.workspaceMeta = { id: ws._id, name: ws.name };
                allTasks.push(t);
            });
        }

        applyWorkspaceFilter();
    } catch (err) {
        console.error('Failed to fetch analytics tasks:', err);
    }
}

// 3. Filter tasks based on dropdown and compute metrics
function applyWorkspaceFilter() {
    const selectedWsId = document.getElementById('workspaceFilter').value;

    let filteredTasks = allTasks;
    if (selectedWsId !== 'ALL') {
        filteredTasks = allTasks.filter(t => {
            const wsId = (t.workspace && typeof t.workspace === 'object') ? t.workspace._id : t.workspace;
            return wsId === selectedWsId || (t.workspaceMeta && t.workspaceMeta.id === selectedWsId);
        });
    }

    renderKPICards(filteredTasks);
    renderCharts(filteredTasks);
    renderTables(filteredTasks);
}

// 4. Render Top KPI Summary Cards
function renderKPICards(tasks) {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const highPriorityOpen = tasks.filter(t => t.priority === 'High' && t.status !== 'Completed').length;

    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    document.getElementById('kpiTotalTasks').textContent = total;
    document.getElementById('kpiCompletionRate').textContent = `${rate}%`;
    document.getElementById('kpiCompletionCount').textContent = `(${completed} of ${total})`;
    document.getElementById('kpiProgressBar').style.width = `${rate}%`;
    document.getElementById('kpiInProgress').textContent = inProgress;
    document.getElementById('kpiHighPriority').textContent = highPriorityOpen;
    document.getElementById('criticalBadge').textContent = `${highPriorityOpen} Open`;
}

// 5. Render 4 Chart.js Charts
function renderCharts(tasks) {
    renderStatusChart(tasks);
    renderWorkloadChart(tasks);
    renderPriorityChart(tasks);
    renderVelocityChart(tasks);
}

// Chart 1: Status Distribution (Doughnut)
function renderStatusChart(tasks) {
    const ctx = document.getElementById('statusChart').getContext('2d');
    if (charts.status) charts.status.destroy();

    const todoCount = tasks.filter(t => t.status === 'To Do').length;
    const inProgCount = tasks.filter(t => t.status === 'In Progress').length;
    const completedCount = tasks.filter(t => t.status === 'Completed').length;

    charts.status = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['To Do', 'In Progress', 'Completed'],
            datasets: [{
                data: [todoCount, inProgCount, completedCount],
                backgroundColor: ['#94a3b8', '#6366f1', '#10b981'],
                borderWidth: 2,
                borderColor: '#ffffff',
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { boxWidth: 12, font: { family: 'Inter', size: 12 } }
                }
            },
            cutout: '68%'
        }
    });
}

// Chart 2: Workload by Team Member (Horizontal Bar)
function renderWorkloadChart(tasks) {
    const ctx = document.getElementById('workloadChart').getContext('2d');
    if (charts.workload) charts.workload.destroy();

    const memberMap = {};

    tasks.forEach(t => {
        let name = 'Unassigned';
        if (t.assignedTo && typeof t.assignedTo === 'object') {
            name = t.assignedTo.name || t.assignedTo.email || 'Unassigned';
        }

        if (!memberMap[name]) {
            memberMap[name] = { todo: 0, inprog: 0, completed: 0 };
        }

        if (t.status === 'To Do') memberMap[name].todo++;
        else if (t.status === 'In Progress') memberMap[name].inprog++;
        else if (t.status === 'Completed') memberMap[name].completed++;
    });

    const members = Object.keys(memberMap);
    const todoData = members.map(m => memberMap[m].todo);
    const inprogData = members.map(m => memberMap[m].inprog);
    const completedData = members.map(m => memberMap[m].completed);

    charts.workload = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: members.length > 0 ? members : ['No Data'],
            datasets: [
                {
                    label: 'Completed',
                    data: completedData,
                    backgroundColor: '#10b981',
                    borderRadius: 4
                },
                {
                    label: 'In Progress',
                    data: inprogData,
                    backgroundColor: '#6366f1',
                    borderRadius: 4
                },
                {
                    label: 'To Do',
                    data: todoData,
                    backgroundColor: '#cbd5e1',
                    borderRadius: 4
                }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { stacked: true, grid: { display: false } },
                y: { stacked: true, grid: { display: false } }
            },
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } }
            }
        }
    });
}

// Chart 3: Priority Hierarchy (Bar)
function renderPriorityChart(tasks) {
    const ctx = document.getElementById('priorityChart').getContext('2d');
    if (charts.priority) charts.priority.destroy();

    const high = tasks.filter(t => t.priority === 'High').length;
    const med = tasks.filter(t => t.priority === 'Medium').length;
    const low = tasks.filter(t => t.priority === 'Low').length;

    charts.priority = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['High Priority', 'Medium Priority', 'Low Priority'],
            datasets: [{
                label: 'Tasks Count',
                data: [high, med, low],
                backgroundColor: ['#ef4444', '#f59e0b', '#38bdf8'],
                borderRadius: 6,
                maxBarThickness: 45
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { stepSize: 1 } },
                x: { grid: { display: false } }
            }
        }
    });
}

// Chart 4: Velocity Trend (Line)
function renderVelocityChart(tasks) {
    const ctx = document.getElementById('velocityChart').getContext('2d');
    if (charts.velocity) charts.velocity.destroy();

    // Prepare 7-day chronological labels
    const days = [];
    const dateKeys = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateKey = d.toISOString().split('T')[0];
        dateKeys.push(dateKey);
        days.push(d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
    }

    const createdCounts = new Array(7).fill(0);
    const completedCounts = new Array(7).fill(0);

    tasks.forEach(t => {
        if (t.createdAt) {
            const cDate = new Date(t.createdAt).toISOString().split('T')[0];
            const idx = dateKeys.indexOf(cDate);
            if (idx !== -1) createdCounts[idx]++;
        }
        if (t.status === 'Completed' && t.updatedAt) {
            const uDate = new Date(t.updatedAt).toISOString().split('T')[0];
            const idx = dateKeys.indexOf(uDate);
            if (idx !== -1) completedCounts[idx]++;
        }
    });

    charts.velocity = new Chart(ctx, {
        type: 'line',
        data: {
            labels: days,
            datasets: [
                {
                    label: 'Tasks Created',
                    data: createdCounts,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    fill: true,
                    tension: 0.35,
                    borderWidth: 2,
                    pointRadius: 3
                },
                {
                    label: 'Tasks Completed',
                    data: completedCounts,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.35,
                    borderWidth: 2,
                    pointRadius: 3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { stepSize: 1 } },
                x: { grid: { display: false } }
            }
        }
    });
}

// 6. Render Critical Attention Table & Throughput Leaderboard
function renderTables(tasks) {
    // Critical Table
    const criticalBody = document.getElementById('criticalTasksBody');
    const criticalTasks = tasks.filter(t => t.priority === 'High' && t.status !== 'Completed');

    if (criticalTasks.length === 0) {
        criticalBody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-emerald-600 font-medium"><i class="bi bi-check-circle-fill mr-1.5 text-emerald-500"></i>Zero high-priority blockers in this scope!</td></tr>';
    } else {
        criticalBody.innerHTML = criticalTasks.map(t => {
            const wsName = t.workspaceMeta ? t.workspaceMeta.name : 'Workspace';
            const assigneeName = t.assignedTo && typeof t.assignedTo === 'object'
                ? (t.assignedTo.name || t.assignedTo.email)
                : 'Unassigned';
            const statusBadge = t.status === 'In Progress'
                ? '<span class="badge badge-indigo">In Progress</span>'
                : '<span class="badge badge-gray">To Do</span>';

            return `
                <tr class="hover:bg-gray-50 transition">
                    <td class="p-2.5 font-semibold text-gray-900">${t.title}</td>
                    <td class="p-2.5 text-gray-500">${wsName}</td>
                    <td class="p-2.5 text-gray-600"><i class="bi bi-person text-gray-400 mr-1"></i>${assigneeName}</td>
                    <td class="p-2.5">${statusBadge}</td>
                </tr>
            `;
        }).join('');
    }

    // Leaderboard Table
    const leaderboardBody = document.getElementById('leaderboardBody');
    const memberStats = {};

    tasks.forEach(t => {
        let name = 'Unassigned';
        if (t.assignedTo && typeof t.assignedTo === 'object') {
            name = t.assignedTo.name || t.assignedTo.email || 'Unassigned';
        }

        if (!memberStats[name]) {
            memberStats[name] = { total: 0, completed: 0 };
        }
        memberStats[name].total++;
        if (t.status === 'Completed') memberStats[name].completed++;
    });

    const rows = Object.keys(memberStats).map(name => {
        const item = memberStats[name];
        const pct = item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0;
        return { name, total: item.total, completed: item.completed, pct };
    }).sort((a, b) => b.completed - a.completed);

    if (rows.length === 0) {
        leaderboardBody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-gray-400">No member data recorded.</td></tr>';
    } else {
        leaderboardBody.innerHTML = rows.map(r => `
            <tr class="hover:bg-gray-50 transition">
                <td class="p-2.5 font-semibold text-gray-900 flex items-center gap-1.5">
                    <span class="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                        ${r.name.charAt(0).toUpperCase()}
                    </span>
                    ${r.name}
                </td>
                <td class="p-2.5 text-gray-600 font-medium">${r.total}</td>
                <td class="p-2.5 text-emerald-600 font-semibold">${r.completed}</td>
                <td class="p-2.5">
                    <div class="flex items-center gap-2">
                        <span class="text-xs font-semibold text-gray-700">${r.pct}%</span>
                        <div class="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div class="bg-indigo-600 h-1.5 rounded-full" style="width: ${r.pct}%"></div>
                        </div>
                    </div>
                </td>
            </tr>
        `).join('');
    }
}
