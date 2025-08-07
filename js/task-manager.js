// Gestión de tareas
function quickAddTask(title) {
    const task = {
        id: taskIdCounter++,
        title: title,
        description: '',
        completed: false,
        priority: 4,
        dueDate: null,
        projectId: null,
        labels: [],
        subtasks: [],
        createdAt: new Date().toISOString()
    };
    
    appData.tasks.push(task);
    saveData();
    renderTasks();
    updateCounts();
}

function addTask() {
    const title = document.getElementById('taskTitleInput').value.trim();
    if (!title) return;
    
    const task = {
        id: appData.editingTask ? appData.editingTask.id : taskIdCounter++,
        title: title,
        description: document.getElementById('taskDescriptionInput').value.trim(),
        completed: false,
        priority: appData.currentTask.priority || 4,
        dueDate: appData.currentTask.dueDate || null,
        projectId: appData.currentTask.projectId || null,
        labels: appData.currentTask.labels || [],
        subtasks: appData.editingTask ? appData.editingTask.subtasks || [] : [],
        createdAt: appData.editingTask ? appData.editingTask.createdAt : new Date().toISOString()
    };
    
    if (appData.editingTask) {
        const index = appData.tasks.findIndex(t => t.id === appData.editingTask.id);
        appData.tasks[index] = task;
    } else {
        appData.tasks.push(task);
    }
    
    saveData();
    hideTaskForm();
    renderTasks();
    updateCounts();
}

function saveTask() {
    const title = document.getElementById('modalTaskTitle').value.trim();
    if (!title) return;
    
    const task = {
        id: appData.editingTask ? appData.editingTask.id : taskIdCounter++,
        title: title,
        description: document.getElementById('modalTaskDescription').value.trim(),
        completed: appData.editingTask ? appData.editingTask.completed : false,
        priority: parseInt(document.getElementById('modalTaskPriority').value),
        dueDate: document.getElementById('modalTaskDate').value || null,
        projectId: parseInt(document.getElementById('modalTaskProject').value) || null,
        labels: getCurrentTaskLabels(),
        subtasks: getCurrentSubtasks(),
        createdAt: appData.editingTask ? appData.editingTask.createdAt : new Date().toISOString(),
        completedAt: appData.editingTask ? appData.editingTask.completedAt : null
    };
    
    if (appData.editingTask) {
        const index = appData.tasks.findIndex(t => t.id === appData.editingTask.id);
        appData.tasks[index] = task;
    } else {
        appData.tasks.push(task);
    }
    
    saveData();
    hideTaskModal();
    renderTasks();
    updateCounts();
    
    showNotification(appData.editingTask ? '✅ Tarea actualizada' : '✅ Tarea creada');
}

function deleteTask(taskId) {
    if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
        appData.tasks = appData.tasks.filter(task => task.id !== taskId);
        saveData();
        renderTasks();
        updateCounts();
    }
}

function toggleTask(taskId) {
    const task = appData.tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : null;
        saveData();
        renderTasks();
        updateCounts();
    }
}

function toggleSubtask(taskId, subtaskId) {
    const task = appData.tasks.find(t => t.id === taskId);
    if (task && task.subtasks) {
        const subtask = task.subtasks.find(s => s.id === subtaskId);
        if (subtask) {
            subtask.completed = !subtask.completed;
            saveData();
            renderTasks();
        }
    }
}

function editTask(taskId) {
    const task = appData.tasks.find(t => t.id === taskId);
    if (task) {
        appData.editingTask = task;
        
        // Llenar el modal con los datos de la tarea
        document.getElementById('modalTaskTitle').value = task.title;
        document.getElementById('modalTaskDescription').value = task.description || '';
        document.getElementById('modalTaskProject').value = task.projectId || '';
        document.getElementById('modalTaskDate').value = task.dueDate || '';
        document.getElementById('modalTaskPriority').value = task.priority;
        
        // Cargar etiquetas
        loadTaskLabels(task.labels || []);
        
        // Cargar subtareas
        loadTaskSubtasks(task.subtasks || []);
        
        showTaskModal();
    }
}

// Filtrado de tareas
function getFilteredTasks() {
    let filtered = [...appData.tasks];
    
    switch (appData.currentView) {
        case 'today':
            const today = new Date().toISOString().split('T')[0];
            filtered = filtered.filter(task => 
                !task.completed && (
                    task.dueDate === today || 
                    (task.dueDate && new Date(task.dueDate) < new Date(today))
                )
            );
            break;
        case 'upcoming':
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            filtered = filtered.filter(task => 
                !task.completed && task.dueDate && new Date(task.dueDate) >= tomorrow
            );
            break;
        case 'inbox':
            filtered = filtered.filter(task => !task.completed && !task.projectId);
            break;
        case 'important':
            filtered = filtered.filter(task => !task.completed && task.priority <= 2);
            break;
        case 'assigned':
            // Por simplicidad, mostramos todas las tareas no completadas
            filtered = filtered.filter(task => !task.completed);
            break;
        case 'project':
            filtered = filtered.filter(task => task.projectId === appData.selectedProject);
            break;
        default:
            break;
    }
    
    // Ordenar por prioridad y fecha
    filtered.sort((a, b) => {
        if (a.completed && !b.completed) return 1;
        if (!a.completed && b.completed) return -1;
        if (a.priority !== b.priority) return a.priority - b.priority;
        if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
        if (a.dueDate && !b.dueDate) return -1;
        if (!a.dueDate && b.dueDate) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    return filtered;
}

function searchTasks(query) {
    if (!query.trim()) {
        renderTasks();
        return;
    }
    
    const tasksList = document.getElementById('tasksList');
    const searchResults = appData.tasks.filter(task => 
        task.title.toLowerCase().includes(query.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(query.toLowerCase())) ||
        (query.startsWith('#') && task.labels.some(label => 
            label.toLowerCase().includes(query.slice(1).toLowerCase())
        ))
    );
    
    // Mostrar resultados de búsqueda
    if (searchResults.length === 0) {
        tasksList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <div class="empty-title">No se encontraron resultados</div>
                <div class="empty-description">Intenta con otros términos de búsqueda</div>
            </div>
        `;
        return;
    }
    
    // Usar el mismo renderizado pero con resultados filtrados
    const originalTasks = [...appData.tasks];
    appData.tasks = searchResults;
    renderTasks();
    appData.tasks = originalTasks;
}