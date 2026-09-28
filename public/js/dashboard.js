const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');
let activeWorkspaceId = null;
let currentTasksCache = [];
let currentWorkspaceObject = null;

if (!token) {
    window.location.href = '/signin.html';
}

// User Profile & Role Setup
document.getElementById('userName').textContent = user.name || user.email || 'User';
const roleBadge = document.getElementById('userRoleBadge');
roleBadge.textContent = user.role || 'Member';

const isAdmin = user.role === 'Admin';

if (isAdmin) {
    roleBadge.className = 'text-xs px-2.5 py-0.5 rounded-full font-medium bg-purple-100 text-purple-800';
    document.getElementById('adminCreateWorkspaceCard')?.classList.remove('hidden');
    document.getElementById('adminCreateEmployeeCard')?.classList.remove('hidden');
}

// Logout Handler
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = '/signin.html';
});

// Load Accessible Workspaces
async function fetchWorkspaces() {
    try {
        const res = await fetch('/api/workspaces', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();

        const list = document.getElementById('workspaceList');
        list.innerHTML = '';

        const workspaces = Array.isArray(data) ? data : (data.workspaces || []);

        if (workspaces.length === 0) {
            list.innerHTML = '<p class="text-sm text-gray-500">No workspaces assigned.</p>';
            return;
        }

        workspaces.forEach((ws) => {
            const item = document.createElement('div');
            item.className = 'p-3 rounded-md border border-gray-200 hover:bg-indigo-50 cursor-pointer transition flex justify-between items-center mb-2';
            item.innerHTML = `
                <div>
                  <p class="font-semibold text-sm text-gray-900">${ws.name}</p>
                  <p class="text-xs text-gray-500">${ws.description || 'No description'}</p>
                </div>
            `;
            item.onclick = () => selectWorkspace(ws);
            list.appendChild(item);
        });

        if (!activeWorkspaceId && workspaces.length > 0) {
            selectWorkspace(workspaces[0]);
        } else if (activeWorkspaceId) {
            const found = workspaces.find(w => w._id === activeWorkspaceId);
            if (found) {
                selectWorkspace(found);
            } else if (workspaces.length > 0) {
                selectWorkspace(workspaces[0]);
            }
        }
    } catch (err) {
        console.error('Failed to load workspaces:', err);
    }
}

// Select Active Workspace & Configure Role-Specific Views
function selectWorkspace(ws) {
    if (!ws || !ws._id) return;

    activeWorkspaceId = ws._id;
    currentWorkspaceObject = ws;

    document.getElementById('currentWorkspaceTitle').textContent = ws.name;
    document.getElementById('currentWorkspaceDesc').textContent = ws.description || 'No description provided';

    const taskBtn = document.getElementById('openTaskFormBtn');
    const formHeader = document.getElementById('taskSectionHeader');
    const submitBtn = document.getElementById('submitTaskBtn');
    const assigneeWrapper = document.getElementById('assigneeWrapper');

    taskBtn.classList.remove('hidden');

    if (isAdmin) {
        // Admin: standard task creation
        taskBtn.textContent = '+ Add Task';
        taskBtn.className = 'bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-md transition';
        if (formHeader) formHeader.textContent = 'Create New Task';
        if (submitBtn) {
            submitBtn.textContent = 'Save Task';
            submitBtn.className = 'col-span-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-md text-sm transition';
        }
        if (assigneeWrapper) assigneeWrapper.classList.remove('hidden');
    } else {
        // Employee / Member: log daily completed or progress work
        taskBtn.textContent = '+ Log Today\'s Work';
        taskBtn.className = 'bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-md transition';
        if (formHeader) formHeader.textContent = 'Log Daily Work / Progress';
        if (submitBtn) {
            submitBtn.textContent = 'Post Daily Log';
            submitBtn.className = 'col-span-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-md text-sm transition';
        }
        // Auto-assigned to self, hides manual assignee dropdown
        if (assigneeWrapper) assigneeWrapper.classList.add('hidden');
    }

    // Invite Member button restricted to Admin or Workspace Owner
    const isOwner = ws.owner && (ws.owner._id === user.id || ws.owner === user.id);
    if (isAdmin || isOwner) {
        document.getElementById('openMemberModalBtn')?.classList.remove('hidden');
    } else {
        document.getElementById('openMemberModalBtn')?.classList.add('hidden');
    }

    populateAssigneeSelect();
    fetchTasks(ws._id);
}

// Populate Member Dropdowns for Tasks
function populateAssigneeSelect() {
    const assigneeSelect = document.getElementById('taskAssignee');
    if (!assigneeSelect || !currentWorkspaceObject) return;

    assigneeSelect.innerHTML = '<option value="">Unassigned</option>';

    const membersList = [];
    if (currentWorkspaceObject.owner && typeof currentWorkspaceObject.owner === 'object') {
        membersList.push(currentWorkspaceObject.owner);
    }

    if (Array.isArray(currentWorkspaceObject.members)) {
        currentWorkspaceObject.members.forEach(m => {
            if (typeof m === 'object' && !membersList.some(existing => existing._id === m._id)) {
                membersList.push(m);
            }
        });
    }

    membersList.forEach((member) => {
        const opt = document.createElement('option');
        opt.value = member._id;
        opt.textContent = member.name ? `${member.name} (${member.email})` : member.email;
        assigneeSelect.appendChild(opt);
    });
}

// Visibility Toggles
document.getElementById('openTaskFormBtn').addEventListener('click', () => {
    document.getElementById('addTaskSection').classList.toggle('hidden');
});

document.getElementById('openMemberModalBtn')?.addEventListener('click', () => {
    document.getElementById('addMemberSection')?.classList.toggle('hidden');
});

// Load Tasks and Populate Kanban Columns
async function fetchTasks(workspaceId) {
    const colTodo = document.getElementById('col-todo');
    const colInProgress = document.getElementById('col-inprogress');
    const colCompleted = document.getElementById('col-completed');

    colTodo.innerHTML = '<p class="text-xs text-gray-400 p-2">Loading...</p>';
    colInProgress.innerHTML = '<p class="text-xs text-gray-400 p-2">Loading...</p>';
    colCompleted.innerHTML = '<p class="text-xs text-gray-400 p-2">Loading...</p>';

    try {
        const res = await fetch('/api/tasks/workspace/' + workspaceId, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();

        colTodo.innerHTML = '';
        colInProgress.innerHTML = '';
        colCompleted.innerHTML = '';

        currentTasksCache = Array.isArray(data) ? data : (data.tasks || []);

        const counts = { 'To Do': 0, 'In Progress': 0, 'Completed': 0 };

        currentTasksCache.forEach((task) => {
            counts[task.status] = (counts[task.status] || 0) + 1;

            const card = document.createElement('div');
            card.setAttribute('draggable', 'true');
            card.id = `task-${task._id}`;
            card.dataset.taskId = task._id;
            card.dataset.status = task.status;

            card.className = 'bg-white p-3 rounded-lg border border-gray-200 shadow-sm cursor-grab active:cursor-grabbing hover:border-indigo-300 transition duration-150 space-y-2 select-none';

            const priorityColor = task.priority === 'High'
                ? 'text-red-600 bg-red-50'
                : (task.priority === 'Medium' ? 'text-yellow-600 bg-yellow-50' : 'text-gray-600 bg-gray-50');

            const isBug = task.title.toLowerCase().includes('bug') || task.title.toLowerCase().startsWith('[bug]');
            const issueBadge = isBug
                ? '<span class="text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-100 px-1.5 py-0.5 rounded">Issue / Bug</span>'
                : '';

            const assigneeName = task.assignedTo && typeof task.assignedTo === 'object'
                ? (task.assignedTo.name || task.assignedTo.email)
                : 'Unassigned';

            // RBAC: Edit and Delete buttons render ONLY for Admins
            const adminActions = isAdmin ? `
                <div class="flex items-center space-x-1">
                  <button onclick="openEditModal('${task._id}')" class="text-gray-400 hover:text-indigo-600 p-1 text-xs" title="Edit Task">✎</button>
                  <button onclick="deleteTask('${task._id}')" class="text-gray-400 hover:text-red-600 p-1 text-xs" title="Delete Task">✕</button>
                </div>
            ` : '';

            card.innerHTML = `
                <div class="flex items-start justify-between gap-2">
                  <div>
                    ${issueBadge}
                    <h4 class="font-semibold text-gray-900 text-sm leading-snug mt-0.5">${task.title}</h4>
                  </div>
                  ${adminActions}
                </div>
                ${task.description ? `<p class="text-xs text-gray-500">${task.description}</p>` : ''}
                <div class="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                  <span class="px-2 py-0.5 rounded font-medium ${priorityColor}">${task.priority}</span>
                  <span class="text-gray-600 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded">👤 ${assigneeName}</span>
                </div>
            `;

            card.addEventListener('dragstart', handleDragStart);
            card.addEventListener('dragend', handleDragEnd);

            if (task.status === 'In Progress') {
                colInProgress.appendChild(card);
            } else if (task.status === 'Completed') {
                colCompleted.appendChild(card);
            } else {
                colTodo.appendChild(card);
            }
        });

        document.getElementById('count-todo').textContent = counts['To Do'] || 0;
        document.getElementById('count-inprogress').textContent = counts['In Progress'] || 0;
        document.getElementById('count-completed').textContent = counts['Completed'] || 0;

    } catch (err) {
        console.error('Failed to load tasks:', err);
    }
}

// Native HTML5 Drag and Drop Handlers
let draggedCard = null;

function handleDragStart(e) {
    draggedCard = this;
    this.classList.add('opacity-40');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.taskId);
}

function handleDragEnd() {
    this.classList.remove('opacity-40');
    draggedCard = null;
    document.querySelectorAll('.kanban-col > div[id^="col-"]').forEach((col) => {
        col.classList.remove('bg-indigo-50/50', 'ring-2', 'ring-indigo-300');
    });
}

function initKanbanDropzones() {
    const columns = document.querySelectorAll('.kanban-col');

    columns.forEach((col) => {
        const targetContainer = col.querySelector('div[id^="col-"]');
        const newStatus = col.dataset.status;

        targetContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            targetContainer.classList.add('bg-indigo-50/50', 'ring-2', 'ring-indigo-300');
        });

        targetContainer.addEventListener('dragleave', () => {
            targetContainer.classList.remove('bg-indigo-50/50', 'ring-2', 'ring-indigo-300');
        });

        targetContainer.addEventListener('drop', async (e) => {
            e.preventDefault();
            targetContainer.classList.remove('bg-indigo-50/50', 'ring-2', 'ring-indigo-300');

            if (!draggedCard) return;

            const taskId = draggedCard.dataset.taskId;
            const prevStatus = draggedCard.dataset.status;

            if (prevStatus === newStatus) return;

            targetContainer.appendChild(draggedCard);
            draggedCard.dataset.status = newStatus;

            try {
                const res = await fetch(`/api/tasks/${taskId}/status`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({ status: newStatus })
                });

                if (!res.ok) throw new Error('Status update failed');
                fetchTasks(activeWorkspaceId);
            } catch (err) {
                console.error('Status sync error:', err);
                fetchTasks(activeWorkspaceId);
            }
        });
    });
}

// Edit Modal Logic (Admin Only)
window.openEditModal = function (taskId) {
    const task = currentTasksCache.find((t) => t._id === taskId);
    if (!task) return;

    document.getElementById('editTaskId').value = task._id;
    document.getElementById('editTaskTitle').value = task.title;
    document.getElementById('editTaskDesc').value = task.description || '';
    document.getElementById('editTaskPriority').value = task.priority;

    const editAssigneeSelect = document.getElementById('editTaskAssignee');
    const mainAssigneeSelect = document.getElementById('taskAssignee');
    editAssigneeSelect.innerHTML = mainAssigneeSelect.innerHTML;

    editAssigneeSelect.value = task.assignedTo
        ? (typeof task.assignedTo === 'object' ? task.assignedTo._id : task.assignedTo)
        : '';

    document.getElementById('editTaskModal').classList.remove('hidden');
};

const closeEditModal = () => {
    document.getElementById('editTaskModal').classList.add('hidden');
};

document.getElementById('closeEditModalBtn').addEventListener('click', closeEditModal);
document.getElementById('cancelEditModalBtn').addEventListener('click', closeEditModal);

document.getElementById('editTaskForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const taskId = document.getElementById('editTaskId').value;
    const title = document.getElementById('editTaskTitle').value.trim();
    const description = document.getElementById('editTaskDesc').value.trim();
    const priority = document.getElementById('editTaskPriority').value;
    const assignedTo = document.getElementById('editTaskAssignee').value;

    try {
        const res = await fetch(`/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
                title,
                description,
                priority,
                assignedTo: assignedTo && assignedTo.trim() !== '' ? assignedTo : null
            })
        });

        if (res.ok) {
            closeEditModal();
            fetchTasks(activeWorkspaceId);
        } else {
            const data = await res.json();
            alert(data.message || 'Failed to update task');
        }
    } catch (err) {
        console.error('Edit task error:', err);
    }
});

// Delete Task (Admin Only)
window.deleteTask = async function (taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
        const res = await fetch('/api/tasks/' + taskId, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (res.ok) {
            fetchTasks(activeWorkspaceId);
        } else {
            const data = await res.json();
            alert(data.message || 'Failed to delete task');
        }
    } catch (err) {
        console.error('Delete task failed:', err);
    }
};

// Admin Provisions Employee Account
const empForm = document.getElementById('createEmployeeForm');
if (empForm) {
    empForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('empName').value.trim();
        const email = document.getElementById('empEmail').value.trim();
        const password = document.getElementById('empPassword').value;
        const msg = document.getElementById('empMsg');

        try {
            const res = await fetch('/api/auth/provision', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ name, email, password, role: 'Member' })
            });

            const data = await res.json();
            msg.classList.remove('hidden');

            if (res.ok) {
                msg.className = 'text-xs mt-2 text-green-600 font-medium';
                msg.textContent = `Account created for ${data.user.email}`;
                empForm.reset();
                setTimeout(() => msg.classList.add('hidden'), 3500);
            } else {
                msg.className = 'text-xs mt-2 text-red-600 font-medium';
                msg.textContent = data.message || 'Failed to provision account';
            }
        } catch (err) {
            console.error('Provisioning error:', err);
        }
    });
}

// Workspace Creation (Admin Only)
const createWsForm = document.getElementById('createWorkspaceForm');
if (createWsForm) {
    createWsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('wsName').value.trim();
        const description = document.getElementById('wsDesc').value.trim();

        try {
            const res = await fetch('/api/workspaces', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ name, description })
            });

            const data = await res.json();

            if (res.ok) {
                document.getElementById('wsName').value = '';
                document.getElementById('wsDesc').value = '';

                await fetchWorkspaces();
                const newWorkspace = data.workspace || data;
                if (newWorkspace && newWorkspace._id) {
                    selectWorkspace(newWorkspace);
                }
            } else {
                alert(data.message || 'Failed to create workspace');
            }
        } catch (err) {
            console.error('Create workspace error:', err);
        }
    });
}

// Task / Daily Log Creation
document.getElementById('createTaskForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!activeWorkspaceId) return;

    let title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDesc').value.trim();
    const priority = document.getElementById('taskPriority').value;
    const status = document.getElementById('taskStatus').value; // User-selected status column

    // If Employee, auto-assign to self and prepend today's date tag
    let assignedTo = null;
    if (!isAdmin) {
        const todayStr = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
        title = `[Daily: ${todayStr}] ${title}`;
        assignedTo = user.id;
    } else {
        const selected = document.getElementById('taskAssignee').value;
        assignedTo = selected && selected.trim() !== '' ? selected : null;
    }

    const payload = {
        title,
        description,
        priority,
        workspace: activeWorkspaceId,
        assignedTo,
        status
    };

    try {
        const res = await fetch('/api/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            document.getElementById('taskTitle').value = '';
            document.getElementById('taskDesc').value = '';
            document.getElementById('addTaskSection').classList.add('hidden');
            fetchTasks(activeWorkspaceId);
        } else {
            const errData = await res.json();
            alert(errData.message || 'Failed to record work entry');
        }
    } catch (err) {
        console.error('Task creation error:', err);
    }
});

// Invite Member to Workspace
document.getElementById('inviteMemberForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!activeWorkspaceId) return;

    const emailInput = document.getElementById('inviteEmail');
    const msg = document.getElementById('inviteMsg');
    const email = emailInput.value.trim();

    try {
        const res = await fetch('/api/workspaces/' + activeWorkspaceId + '/members', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ email })
        });

        const data = await res.json();
        msg.classList.remove('hidden');

        if (res.ok) {
            msg.className = 'text-xs mt-2 text-green-600 font-medium';
            msg.textContent = 'Member added to workspace!';
            emailInput.value = '';

            await fetchWorkspaces();

            setTimeout(() => {
                msg.classList.add('hidden');
                document.getElementById('addMemberSection')?.classList.add('hidden');
            }, 2500);
        } else {
            msg.className = 'text-xs mt-2 text-red-600 font-medium';
            msg.textContent = data.message || 'Failed to add member';
        }
    } catch (err) {
        console.error('Invite member error:', err);
    }
});

// Boot Application
initKanbanDropzones();
fetchWorkspaces();