// Funciones de navegación
function switchView(view) {
    appData.currentView = view;
    
    // Actualizar navegación activa
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-view="${view}"]`).classList.add('active');
    
    // Actualizar título
    const titles = {
        today: 'Hoy',
        upcoming: 'Próximamente',
        inbox: 'Bandeja de entrada',
        important: 'Importante',
        assigned: 'Asignadas a mí'
    };
    
    document.getElementById('mainTitle').textContent = titles[view] || view;
    
    renderTasks();
}

function switchToProject(projectId) {
    appData.currentView = 'project';
    appData.selectedProject = projectId;
    
    // Actualizar navegación activa
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-project="${projectId}"]`).classList.add('active');
    
    const project = appData.projects.find(p => p.id === projectId);
    document.getElementById('mainTitle').textContent = project.name;
    
    renderTasks();
}

// Responsive
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}