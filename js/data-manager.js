// Gestión de datos de la aplicación
let appData = {
    tasks: [],
    projects: [
        { id: 1, name: 'Trabajo', color: '#db4035', taskCount: 0 },
        { id: 2, name: 'Personal', color: '#ff9933', taskCount: 0 },
        { id: 3, name: 'Estudio', color: '#299438', taskCount: 0 }
    ],
    labels: [
        { id: 1, name: 'urgente', color: '#db4035' },
        { id: 2, name: 'importante', color: '#ff9933' },
        { id: 3, name: 'reunion', color: '#299438' }
    ],
    currentView: 'today',
    editingTask: null,
    currentTask: {}
};

// Variables globales
let taskIdCounter = 1;
let projectIdCounter = 4;
let labelIdCounter = 4;

// Gestión de datos locales
function saveData() {
    const data = {
        tasks: appData.tasks,
        projects: appData.projects,
        labels: appData.labels,
        taskIdCounter,
        projectIdCounter,
        labelIdCounter
    };
    // En lugar de localStorage, guardamos en una variable temporal
    window.appBackup = JSON.stringify(data);
}

function loadData() {
    try {
        if (window.appBackup) {
            const data = JSON.parse(window.appBackup);
            appData.tasks = data.tasks || [];
            appData.projects = data.projects || appData.projects;
            appData.labels = data.labels || appData.labels;
            taskIdCounter = data.taskIdCounter || 1;
            projectIdCounter = data.projectIdCounter || 4;
            labelIdCounter = data.labelIdCounter || 4;
        }
    } catch (e) {
        console.log('No hay datos guardados, usando datos por defecto');
    }
}

// Datos de ejemplo
function loadSampleData() {
    const sampleTasks = [
        {
            id: taskIdCounter++,
            title: 'Completar presentación para el cliente',
            description: 'Preparar slides y ensayar presentación',
            completed: false,
            priority: 1,
            dueDate: new Date().toISOString().split('T')[0],
            projectId: 1,
            labels: ['urgente', 'presentación'],
            subtasks: [],
            createdAt: new Date().toISOString()
        },
        {
            id: taskIdCounter++,
            title: 'Comprar ingredientes para la cena',
            description: '',
            completed: false,
            priority: 3,
            dueDate: new Date().toISOString().split('T')[0],
            projectId: 2,
            labels: ['compras'],
            subtasks: [
                { id: 1, title: 'Tomates', completed: false },
                { id: 2, title: 'Pasta', completed: true },
                { id: 3, title: 'Queso', completed: false }
            ],
            createdAt: new Date().toISOString()
        },
        {
            id: taskIdCounter++,
            title: 'Revisar documentación del proyecto',
            description: 'Leer y comentar los documentos técnicos',
            completed: true,
            priority: 2,
            dueDate: null,
            projectId: 1,
            labels: ['revision'],
            subtasks: [],
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        }
    ];
    
    appData.tasks = sampleTasks;
    saveData();
}

// Exportar/Importar datos
function exportData() {
    const dataToExport = {
        tasks: appData.tasks,
        projects: appData.projects,
        labels: appData.labels,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `todoist-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showNotification('✅ Datos exportados correctamente');
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (importedData.tasks && importedData.projects) {
                    if (confirm('¿Estás seguro de que quieres importar estos datos? Esto reemplazará todos los datos actuales.')) {
                        appData.tasks = importedData.tasks || [];
                        appData.projects = importedData.projects || [];
                        appData.labels = importedData.labels || [];
                        
                        // Actualizar contadores
                        taskIdCounter = Math.max(...appData.tasks.map(t => t.id), 0) + 1;
                        projectIdCounter = Math.max(...appData.projects.map(p => p.id), 0) + 1;
                        labelIdCounter = Math.max(...appData.labels.map(l => l.id), 0) + 1;
                        
                        saveData();
                        renderProjects();
                        renderLabels();
                        renderTasks();
                        updateCounts();
                        
                        showNotification('✅ Datos importados correctamente');
                    }
                } else {
                    showNotification('❌ Archivo de respaldo inválido', 'error');
                }
            } catch (error) {
                showNotification('❌ Error al importar datos: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}