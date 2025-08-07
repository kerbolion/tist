// Funciones para manejar etiquetas en el modal
function handleLabelInput(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const input = event.target;
        const label = input.value.trim();
        
        if (label && !getCurrentTaskLabels().includes(label)) {
            addTaskLabel(label);
            input.value = '';
        }
    }
}

function addTaskLabel(label) {
    const selectedLabelsContainer = document.getElementById('selectedLabels');
    
    const labelElement = document.createElement('span');
    labelElement.className = 'selected-label';
    labelElement.innerHTML = `
        #${label}
        <button class="remove-label-btn" onclick="removeTaskLabel('${label}')" type="button">×</button>
    `;
    
    selectedLabelsContainer.appendChild(labelElement);
}

function removeTaskLabel(labelToRemove) {
    const selectedLabelsContainer = document.getElementById('selectedLabels');
    const labelElements = selectedLabelsContainer.querySelectorAll('.selected-label');
    
    labelElements.forEach(element => {
        if (element.textContent.trim().startsWith(`#${labelToRemove}`)) {
            element.remove();
        }
    });
}

function getCurrentTaskLabels() {
    const selectedLabelsContainer = document.getElementById('selectedLabels');
    const labelElements = selectedLabelsContainer.querySelectorAll('.selected-label');
    
    return Array.from(labelElements).map(element => {
        const text = element.textContent.trim();
        return text.substring(1, text.length - 1); // Remover # al inicio y × al final
    });
}

function loadTaskLabels(labels) {
    const selectedLabelsContainer = document.getElementById('selectedLabels');
    selectedLabelsContainer.innerHTML = '';
    
    labels.forEach(label => {
        addTaskLabel(label);
    });
}

// Funciones para manejar subtareas en el modal
let subtaskIdCounter = 1000;

function handleSubtaskInput(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const input = event.target;
        const subtaskTitle = input.value.trim();
        
        if (subtaskTitle) {
            addSubtask(subtaskTitle);
            input.value = '';
        }
    }
}

function addSubtask(title, completed = false, id = null) {
    const subtasksList = document.getElementById('modalSubtasksList');
    const subtaskId = id || subtaskIdCounter++;
    
    const subtaskElement = document.createElement('div');
    subtaskElement.className = 'subtask-editor-item';
    subtaskElement.setAttribute('data-subtask-id', subtaskId);
    subtaskElement.innerHTML = `
        <div class="subtask-editor-content">
            <input type="checkbox" class="subtask-editor-checkbox" ${completed ? 'checked' : ''} onchange="toggleSubtaskInEditor(${subtaskId})">
            <input type="text" class="subtask-editor-input" value="${title}" onblur="updateSubtaskTitle(${subtaskId}, this.value)">
            <button class="remove-subtask-btn" onclick="removeSubtask(${subtaskId})" type="button">🗑️</button>
        </div>
    `;
    
    subtasksList.appendChild(subtaskElement);
}

function removeSubtask(subtaskId) {
    const subtaskElement = document.querySelector(`[data-subtask-id="${subtaskId}"]`);
    if (subtaskElement) {
        subtaskElement.remove();
    }
}

function toggleSubtaskInEditor(subtaskId) {
    // La funcionalidad se maneja automáticamente con el checkbox
}

function updateSubtaskTitle(subtaskId, newTitle) {
    // La actualización se maneja automáticamente con el input
}

function getCurrentSubtasks() {
    const subtaskItems = document.querySelectorAll('.subtask-editor-item');
    return Array.from(subtaskItems).map(item => {
        const id = parseInt(item.getAttribute('data-subtask-id'));
        const checkbox = item.querySelector('.subtask-editor-checkbox');
        const input = item.querySelector('.subtask-editor-input');
        
        return {
            id: id,
            title: input.value.trim(),
            completed: checkbox.checked
        };
    }).filter(subtask => subtask.title); // Solo subtareas con título
}

function loadTaskSubtasks(subtasks) {
    const subtasksList = document.getElementById('modalSubtasksList');
    subtasksList.innerHTML = '';
    
    subtasks.forEach(subtask => {
        addSubtask(subtask.title, subtask.completed, subtask.id);
        if (subtask.id >= subtaskIdCounter) {
            subtaskIdCounter = subtask.id + 1;
        }
    });
}