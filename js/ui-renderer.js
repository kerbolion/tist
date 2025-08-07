// Funciones de renderizado
function renderTasks() {
    const tasksList = document.getElementById('tasksList');
    const filteredTasks = getFilteredTasks();
    
    if (filteredTasks.length === 0) {
        tasksList.innerHTML = '';
        document.getElementById('emptyState').style.display = 'block';
        return;
    }
    
    document.getElementById('emptyState').style.display = 'none';
    
    tasksList.innerHTML = filteredTasks.map(task => {
        const project = appData.projects.find(p => p.id === task.projectId);
        const dueDateInfo = getDueDateInfo(task.dueDate);
        const priorityClass = `priority-${task.priority}`;
        
        return `
            <div class="task-item ${task.completed ? 'completed' : ''}">
                <div class="task-header">
                    <div class="task-checkbox ${task.completed ? 'completed' : ''}" onclick="toggleTask(${task.id})">
                        ${task.completed ? '✓' : ''}
                    </div>
                    <div class="task-content">
                        <div class="task-title ${task.completed ? 'completed' : ''}">${task.title}</div>
                        ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                        <div class="task-meta">
                            ${project ? `<div class="task-project">
                                <div class="project-color" style="background-color: ${project.color}; width: 8px; height: 8px; border-radius: 50%; margin-right: 4px;"></div>
                                ${project.name}
                            </div>` : ''}
                            ${task.dueDate ? `<div class="task-due-date ${dueDateInfo.class}">
                                📅 ${dueDateInfo.text}
                            </div>` : ''}
                            ${task.priority < 4 ? `<div class="task-priority">
                                <div class="priority-flag ${priorityClass}">🏃</div>
                            </div>` : ''}
                            ${task.labels && task.labels.length > 0 ? `<div class="task-labels">
                                ${task.labels.map(label => `<span class="task-label">#${label}</span>`).join('')}
                            </div>` : ''}
                        </div>
                        ${task.subtasks && task.subtasks.length > 0 ? `
                            <div class="subtasks">
                                ${task.subtasks.map(subtask => `
                                    <div class="subtask-item">
                                        <div class="subtask-checkbox ${subtask.completed ? 'completed' : ''}" onclick="toggleSubtask(${task.id}, ${subtask.id})">
                                            ${subtask.completed ? '✓' : ''}
                                        </div>
                                        <div class="subtask-title ${subtask.completed ? 'completed' : ''}">${subtask.title}</div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                    <div class="task-actions-menu">
                        <button class="action-btn" onclick="editTask(${task.id})" title="Editar">
                            ✏️
                        </button>
                        <button class="action-btn" onclick="deleteTask(${task.id})" title="Eliminar">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderProjects() {
    const projectsList = document.getElementById('projectsList');
    
    projectsList.innerHTML = appData.projects.map(project => `
        <div class="nav-item project-item" data-project="${project.id}" onclick="switchToProject(${project.id})">
            <div class="project-color" style="background-color: ${project.color}"></div>
            <div class="nav-item-text">${project.name}</div>
            <div class="nav-item-count">${project.taskCount}</div>
        </div>
    `).join('');
    
    updateProjectSelects();
}

function renderLabels() {
    const labelsList = document.getElementById('labelsList');
    
    labelsList.innerHTML = appData.labels.map(label => `
        <div class="nav-item" onclick="searchTasks('#${label.name}')">
            <div class="nav-item-icon">🏷️</div>
            <div class="nav-item-text">#${label.name}</div>
        </div>
    `).join('');
}

// Actualización de contadores
function updateCounts() {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const counts = {
        today: appData.tasks.filter(t => 
            !t.completed && (
                t.dueDate === today || 
                (t.dueDate && new Date(t.dueDate) < new Date(today))
            )
        ).length,
        upcoming: appData.tasks.filter(t => 
            !t.completed && t.dueDate && new Date(t.dueDate) >= tomorrow
        ).length,
        inbox: appData.tasks.filter(t => !t.completed && !t.projectId).length,
        important: appData.tasks.filter(t => !t.completed && t.priority <= 2).length,
        assigned: appData.tasks.filter(t => !t.completed).length
    };
    
    // Actualizar contadores en la UI
    Object.keys(counts).forEach(view => {
        const element = document.getElementById(`${view}Count`);
        if (element) {
            element.textContent = counts[view];
        }
    });
    
    // Actualizar contadores de proyectos
    appData.projects.forEach(project => {
        project.taskCount = appData.tasks.filter(t => 
            t.projectId === project.id && !t.completed
        ).length;
    });
    
    renderProjects();
}