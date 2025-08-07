// Inicialización principal de la aplicación
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    renderProjects();
    renderLabels();
    renderTasks();
    updateCounts();
    
    // Event listeners
    document.getElementById('quickAddInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && this.value.trim()) {
            quickAddTask(this.value.trim());
            this.value = '';
        }
    });

    document.getElementById('searchInput').addEventListener('input', function() {
        searchTasks(this.value);
    });

    // Cerrar modal al hacer clic fuera
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });

    // Cerrar sidebar en mobile al hacer clic en el contenido
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
            if (!e.target.closest('.sidebar') && !e.target.closest('.mobile-menu-btn')) {
                document.getElementById('sidebar').classList.remove('open');
            }
        }
    });

    // Cargar datos de ejemplo si no hay datos
    if (appData.tasks.length === 0) {
        loadSampleData();
        renderTasks();
        updateCounts();
    }

    // Inicializar funciones avanzadas
    setTimeout(() => {
        addAdvancedFeatures();
        initializeKeyboardShortcuts();
        
        // Re-renderizar con drag and drop
        const originalRenderTasks = renderTasks;
        renderTasks = function() {
            originalRenderTasks();
            setTimeout(() => enableDragAndDrop(), 100);
        };
        
        renderTasks();
    }, 1000);

    // Auto-guardado cada 30 segundos
    setInterval(() => {
        saveData();
    }, 30000);

    // Mostrar mensaje de bienvenida
    setTimeout(() => {
        showNotification('🎉 ¡Bienvenido a tu gestor de tareas! Usa Ctrl+N para crear una nueva tarea.');
    }, 2000);
});