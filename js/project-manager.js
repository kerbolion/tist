// Gestión de proyectos
function addProject() {
    const name = document.getElementById('projectNameInput').value.trim();
    if (!name) return;
    
    const project = {
        id: projectIdCounter++,
        name: name,
        color: document.getElementById('projectColorInput').value,
        taskCount: 0
    };
    
    appData.projects.push(project);
    saveData();
    hideProjectModal();
    renderProjects();
    updateProjectSelects();
    
    // Limpiar formulario
    document.getElementById('projectNameInput').value = '';
}

function deleteProject(projectId) {
    if (confirm('¿Estás seguro de que quieres eliminar este proyecto? Las tareas del proyecto no se eliminarán.')) {
        // Remover el proyecto de las tareas
        appData.tasks.forEach(task => {
            if (task.projectId === projectId) {
                task.projectId = null;
            }
        });
        
        appData.projects = appData.projects.filter(p => p.id !== projectId);
        saveData();
        renderProjects();
        renderTasks();
        updateCounts();
        updateProjectSelects();
    }
}

function updateProjectSelects() {
    const selects = document.querySelectorAll('#modalTaskProject');
    selects.forEach(select => {
        const currentValue = select.value;
        select.innerHTML = `
            <option value="">Sin proyecto</option>
            ${appData.projects.map(project => 
                `<option value="${project.id}">${project.name}</option>`
            ).join('')}
        `;
        select.value = currentValue;
    });
}