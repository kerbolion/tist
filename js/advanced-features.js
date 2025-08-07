// Drag and Drop para reordenar tareas
let draggedTask = null;

function enableDragAndDrop() {
    const taskItems = document.querySelectorAll('.task-item');
    
    taskItems.forEach(task => {
        task.draggable = true;
        
        task.addEventListener('dragstart', function(e) {
            draggedTask = this;
            this.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });
        
        task.addEventListener('dragend', function() {
            this.classList.remove('dragging');
            draggedTask = null;
        });
        
        task.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            const afterElement = getDragAfterElement(this.parentElement, e.clientY);
            if (afterElement == null) {
                this.parentElement.appendChild(draggedTask);
            } else {
                this.parentElement.insertBefore(draggedTask, afterElement);
            }
        });
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Shortcuts de teclado
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + N: Nueva tarea
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            showTaskModal();
        }
        
        // Ctrl/Cmd + F: Buscar
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            document.getElementById('searchInput').focus();
        }
        
        // Escape: Cerrar modales
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                modal.classList.remove('active');
            });
            hideTaskForm();
        }
        
        // Enter: Confirmar acciones en modales
        if (e.key === 'Enter' && document.querySelector('.modal.active')) {
            const activeModal = document.querySelector('.modal.active');
            if (activeModal.id === 'taskModal') {
                saveTask();
            } else if (activeModal.id === 'projectModal') {
                addProject();
            }
        }
    });
}

// Agregar funciones avanzadas a la interfaz
function addAdvancedFeatures() {
    // Agregar botón de estadísticas al header
    const headerActions = document.querySelector('.header-actions');
    const statsBtn = document.createElement('button');
    statsBtn.className = 'header-btn';
    statsBtn.onclick = showStatsModal;
    statsBtn.innerHTML = '<span>📊</span> Estadísticas';
    headerActions.insertBefore(statsBtn, headerActions.firstChild);
    
    // Agregar botón de modo oscuro
    const darkModeBtn = document.createElement('button');
    darkModeBtn.className = 'header-btn';
    darkModeBtn.onclick = toggleDarkMode;
    darkModeBtn.innerHTML = '<span>🌙</span> Tema';
    headerActions.insertBefore(darkModeBtn, headerActions.firstChild);
    
    // Agregar opciones de importar/exportar al sidebar
    const sidebarNav = document.querySelector('.sidebar-nav');
    const dataSection = document.createElement('div');
    dataSection.className = 'nav-section';
    dataSection.innerHTML = `
        <div class="nav-section-title">Datos</div>
        <div class="nav-item" onclick="exportData()">
            <div class="nav-item-icon">📥</div>
            <div class="nav-item-text">Exportar</div>
        </div>
        <div class="nav-item" onclick="importData()">
            <div class="nav-item-icon">📤</div>
            <div class="nav-item-text">Importar</div>
        </div>
    `;
    sidebarNav.appendChild(dataSection);
}