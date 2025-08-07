// Gestión de formularios y modales
function showQuickAdd() {
    document.getElementById('quickAddInput').focus();
}

function showTaskForm() {
    document.getElementById('taskForm').classList.add('active');
    document.getElementById('taskTitleInput').focus();
    appData.editingTask = null;
    appData.currentTask = {};
    
    // Resetear formulario
    document.getElementById('taskTitleInput').value = '';
    document.getElementById('taskDescriptionInput').value = '';
    resetTaskOptions();
}

function hideTaskForm() {
    document.getElementById('taskForm').classList.remove('active');
    appData.editingTask = null;
    appData.currentTask = {};
}

function showTaskModal() {
    document.getElementById('taskModal').classList.add('active');
    updateProjectSelects();
    
    if (!appData.editingTask) {
        // Limpiar formulario para nueva tarea
        document.getElementById('modalTaskTitle').value = '';
        document.getElementById('modalTaskDescription').value = '';
        document.getElementById('modalTaskProject').value = '';
        document.getElementById('modalTaskDate').value = '';
        document.getElementById('modalTaskPriority').value = '4';
    }
}

function hideTaskModal() {
    document.getElementById('taskModal').classList.remove('active');
    appData.editingTask = null;
    
    // Limpiar etiquetas y subtareas
    document.getElementById('selectedLabels').innerHTML = '';
    document.getElementById('modalSubtasksList').innerHTML = '';
    document.getElementById('modalTaskLabels').value = '';
    document.getElementById('newSubtaskInput').value = '';
}

function showProjectModal() {
    document.getElementById('projectModal').classList.add('active');
    document.getElementById('projectNameInput').focus();
}

function hideProjectModal() {
    document.getElementById('projectModal').classList.remove('active');
}

function resetTaskOptions() {
    document.getElementById('dueDateText').textContent = 'Fecha límite';
    document.getElementById('projectText').textContent = 'Proyecto';
    document.getElementById('priorityText').textContent = 'Prioridad';
    
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.classList.remove('active');
    });
}

// Funciones de opciones de tarea (simplificadas para el ejemplo)
function toggleDatePicker() {
    const dateInput = prompt('Fecha límite (YYYY-MM-DD):');
    if (dateInput) {
        appData.currentTask.dueDate = dateInput;
        document.getElementById('dueDateText').textContent = new Date(dateInput).toLocaleDateString();
        document.querySelector('[onclick="toggleDatePicker()"]').classList.add('active');
    }
}

function toggleProjectPicker() {
    const projectSelect = document.createElement('select');
    projectSelect.innerHTML = `
        <option value="">Sin proyecto</option>
        ${appData.projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
    `;
    
    const projectName = prompt('Seleccionar proyecto:\n' + appData.projects.map((p, i) => `${i + 1}. ${p.name}`).join('\n') + '\n\nEscribe el número:');
    if (projectName) {
        const projectIndex = parseInt(projectName) - 1;
        if (projectIndex >= 0 && projectIndex < appData.projects.length) {
            const project = appData.projects[projectIndex];
            appData.currentTask.projectId = project.id;
            document.getElementById('projectText').textContent = project.name;
            document.querySelector('[onclick="toggleProjectPicker()"]').classList.add('active');
        }
    }
}

function togglePriorityPicker() {
    const priorities = ['Alta (1)', 'Media (2)', 'Normal (3)', 'Baja (4)'];
    const priorityChoice = prompt('Seleccionar prioridad:\n' + priorities.map((p, i) => `${i + 1}. ${p}`).join('\n') + '\n\nEscribe el número:');
    if (priorityChoice) {
        const priority = parseInt(priorityChoice);
        if (priority >= 1 && priority <= 4) {
            appData.currentTask.priority = priority;
            document.getElementById('priorityText').textContent = `Prioridad ${priority}`;
            document.querySelector('[onclick="togglePriorityPicker()"]').classList.add('active');
        }
    }
}

function toggleLabelPicker() {
    const label = prompt('Añadir etiqueta:');
    if (label) {
        if (!appData.currentTask.labels) appData.currentTask.labels = [];
        appData.currentTask.labels.push(label);
        document.querySelector('[onclick="toggleLabelPicker()"]').classList.add('active');
    }
}