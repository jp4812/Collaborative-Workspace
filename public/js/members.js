// Nexus Corporate Directory Engine
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

// Auth Guard
if (!token) {
    window.location.href = '/signin.html';
}

// User Profile Setup
document.getElementById('userName').textContent = user.name || user.email || 'User';
const roleBadge = document.getElementById('userRoleBadge');
roleBadge.textContent = user.role || 'Member';
const isAdmin = user.role === 'Admin';

if (isAdmin) {
    roleBadge.className = 'text-xs px-2.5 py-0.5 rounded-full font-medium bg-purple-100 text-purple-800';
    document.getElementById('adminActionWrapper')?.classList.remove('hidden');
    document.getElementById('navAnalyticsLink')?.classList.remove('hidden');
} else {
    roleBadge.className = 'text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-800';
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/signin.html';
});

// State
let allUsers = [];
let allWorkspaces = [];

document.addEventListener('DOMContentLoaded', async () => {
    await fetchWorkspaces();
    await fetchUsers();

    // Event listeners
    document.getElementById('memberSearchInput').addEventListener('input', applyFilters);
    document.getElementById('roleFilterSelect').addEventListener('change', applyFilters);

    if (isAdmin) {
        setupProvisionModal();
    }
});

// 1. Fetch Workspaces to map memberships
async function fetchWorkspaces() {
    try {
        const res = await fetch('/api/workspaces', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        allWorkspaces = Array.isArray(data) ? data : (data.workspaces || []);
    } catch (err) {
        console.error('Failed to load workspaces:', err);
    }
}

// 2. Fetch Users
async function fetchUsers() {
    try {
        const res = await fetch('/api/auth/users', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        allUsers = Array.isArray(data) ? data : (data.users || []);

        updateStats();
        applyFilters();
    } catch (err) {
        console.error('Failed to fetch corporate directory:', err);
        document.getElementById('directoryGrid').innerHTML = `
            <div class="col-span-full py-12 text-center text-red-500">
                Failed to load corporate directory. Please verify server connectivity.
            </div>
        `;
    }
}

// 3. Update Stat Cards
function updateStats() {
    const total = allUsers.length;
    const admins = allUsers.filter(u => u.role === 'Admin').length;
    const employees = allUsers.filter(u => u.role === 'Member').length;

    document.getElementById('statTotalUsers').textContent = total;
    document.getElementById('statAdmins').textContent = admins;
    document.getElementById('statEmployees').textContent = employees;
}

// 4. Filter and Render Cards
function applyFilters() {
    const query = document.getElementById('memberSearchInput').value.trim().toLowerCase();
    const roleFilter = document.getElementById('roleFilterSelect').value;

    const filtered = allUsers.filter(u => {
        const matchesQuery = (u.name && u.name.toLowerCase().includes(query)) ||
            (u.email && u.email.toLowerCase().includes(query));
        const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

        return matchesQuery && matchesRole;
    });

    renderDirectoryGrid(filtered);
}

// 5. Render User Cards
function renderDirectoryGrid(users) {
    const grid = document.getElementById('directoryGrid');

    if (users.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full py-12 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
                No corporate identities found matching your criteria.
            </div>
        `;
        return;
    }

    grid.innerHTML = users.map(u => {
        const isUserAdmin = u.role === 'Admin';
        const rolePill = isUserAdmin
            ? '<span class="text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">Admin</span>'
            : '<span class="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Member</span>';

        const avatarColor = isUserAdmin ? 'bg-purple-600' : 'bg-indigo-600';
        const initials = u.name ? u.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';

        // Find workspaces this user is enrolled in
        const enrolledWorkspaces = allWorkspaces.filter(ws => {
            const isOwner = ws.owner && (ws.owner._id === u._id || ws.owner === u._id);
            const isMember = ws.members && ws.members.some(m => (m._id || m) === u._id);
            return isOwner || isMember;
        });

        const workspaceBadges = enrolledWorkspaces.length > 0
            ? enrolledWorkspaces.map(ws => `
                <span class="inline-block text-[11px] font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200">
                    ${ws.name}
                </span>
            `).join(' ')
            : '<span class="text-xs text-gray-400 italic">No workspace enrollments</span>';

        const joinDate = u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown';

        return `
            <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition flex flex-col justify-between space-y-4">
                <div>
                    <div class="flex items-start justify-between gap-3">
                        <div class="flex items-center space-x-3">
                            <div class="w-11 h-11 rounded-xl ${avatarColor} text-white font-bold flex items-center justify-center text-sm shadow-sm">
                                ${initials}
                            </div>
                            <div>
                                <h3 class="font-bold text-gray-900 text-base leading-snug">${u.name}</h3>
                                <p class="text-xs font-mono text-gray-500">${u.email}</p>
                            </div>
                        </div>
                        ${rolePill}
                    </div>

                    <div class="mt-4 pt-3 border-t border-gray-100">
                        <p class="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Enrolled Workspaces (${enrolledWorkspaces.length})</p>
                        <div class="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                            ${workspaceBadges}
                        </div>
                    </div>
                </div>

                <div class="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                    <span>Provisioned</span>
                    <span class="font-medium text-gray-600">${joinDate}</span>
                </div>
            </div>
        `;
    }).join('');
}

// 6. Setup Modal Provisioning (Admin Only)
function setupProvisionModal() {
    const modal = document.getElementById('provisionModal');
    const openBtn = document.getElementById('openProvisionModalBtn');
    const closeBtn = document.getElementById('closeProvisionModalBtn');
    const form = document.getElementById('modalProvisionForm');
    const roleSelect = document.getElementById('modalEmpRole');
    const emailInput = document.getElementById('modalEmpEmail');
    const domainHint = document.getElementById('domainHint');
    const msg = document.getElementById('modalMsg');

    openBtn?.addEventListener('click', () => {
        modal.classList.remove('hidden');
        msg.classList.add('hidden');
        form.reset();
    });

    closeBtn?.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    });

    roleSelect.addEventListener('change', () => {
        if (roleSelect.value === 'Admin') {
            emailInput.placeholder = 'admin@admin.nexus.in';
            domainHint.textContent = 'Must end with @admin.nexus.in';
        } else {
            emailInput.placeholder = 'employee@emp.nexus.in';
            domainHint.textContent = 'Must end with @emp.nexus.in';
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('modalEmpName').value.trim();
        const role = roleSelect.value;
        const email = emailInput.value.trim();
        const password = document.getElementById('modalEmpPassword').value;

        msg.className = 'text-xs text-center font-medium text-gray-500';
        msg.textContent = 'Provisioning account...';
        msg.classList.remove('hidden');

        try {
            const res = await fetch('/api/auth/provision', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ name, email, password, role })
            });

            const data = await res.json();

            if (res.ok) {
                msg.className = 'text-xs text-center font-medium text-emerald-600';
                msg.textContent = 'Account provisioned successfully!';
                form.reset();
                await fetchUsers();

                setTimeout(() => {
                    modal.classList.add('hidden');
                    msg.classList.add('hidden');
                }, 1500);
            } else {
                msg.className = 'text-xs text-center font-medium text-red-600';
                msg.textContent = data.message || 'Provisioning failed.';
            }
        } catch (err) {
            console.error('Provisioning error:', err);
            msg.className = 'text-xs text-center font-medium text-red-600';
            msg.textContent = 'Network or server error.';
        }
    });
}
