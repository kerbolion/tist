// Datos de la aplicación
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

        // Inicialización
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
        });

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

        // Navegación
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

        // Renderizado
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

        // Utilidades
        function getDueDateInfo(dueDate) {
            if (!dueDate) return null;
            
            const today = new Date().toISOString().split('T')[0];
            const taskDate = new Date(dueDate);
            const todayDate = new Date(today);
            
            if (dueDate === today) {
                return { text: 'Hoy', class: 'due-today' };
            } else if (taskDate < todayDate) {
                const daysDiff = Math.floor((todayDate - taskDate) / (1000 * 60 * 60 * 24));
                return { text: `Vencido ${daysDiff} día${daysDiff > 1 ? 's' : ''}`, class: 'due-overdue' };
            } else {
                const daysDiff = Math.floor((taskDate - todayDate) / (1000 * 60 * 60 * 24));
                if (daysDiff === 1) {
                    return { text: 'Mañana', class: 'due-future' };
                } else if (daysDiff <= 7) {
                    return { text: `En ${daysDiff} días`, class: 'due-future' };
                } else {
                    return { text: new Date(dueDate).toLocaleDateString(), class: 'due-future' };
                }
            }
        }

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

        // Responsive
        function toggleSidebar() {
            document.getElementById('sidebar').classList.toggle('open');
        }

        // Cerrar sidebar en mobile al hacer clic en el contenido
        document.addEventListener('click', function(e) {
            if (window.innerWidth <= 768) {
                if (!e.target.closest('.sidebar') && !e.target.closest('.mobile-menu-btn')) {
                    document.getElementById('sidebar').classList.remove('open');
                }
            }
        });

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
            renderTasks();
            updateCounts();
        }

        // Cargar datos de ejemplo al inicio si no hay datos
        if (appData.tasks.length === 0) {
            loadSampleData();
        }

        // Funcionalidades adicionales avanzadas
        
        // Sistema de notificaciones
        function showNotification(message, type = 'success') {
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.innerHTML = `
                <div class="notification-content">
                    <span class="notification-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
                    <span class="notification-message">${message}</span>
                </div>
                <button class="notification-close" onclick="this.parentElement.remove()">×</button>
            `;
            
            document.body.appendChild(notification);
            
            // Auto-remove después de 5 segundos
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 5000);
            
            // Animación de entrada
            setTimeout(() => {
                notification.classList.add('show');
            }, 100);
        }

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

        // Estadísticas y productividad
        function getProductivityStats() {
            const today = new Date();
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            
            const completedTasks = appData.tasks.filter(t => t.completed);
            
            const stats = {
                totalTasks: appData.tasks.length,
                completedTasks: completedTasks.length,
                completionRate: Math.round((completedTasks.length / appData.tasks.length) * 100) || 0,
                completedThisWeek: completedTasks.filter(t => 
                    t.completedAt && new Date(t.completedAt) >= weekAgo
                ).length,
                completedThisMonth: completedTasks.filter(t => 
                    t.completedAt && new Date(t.completedAt) >= monthAgo
                ).length,
                highPriorityCompleted: completedTasks.filter(t => t.priority <= 2).length,
                averageCompletionTime: calculateAverageCompletionTime(),
                mostProductiveDay: getMostProductiveDay(),
                projectStats: getProjectStats()
            };
            
            return stats;
        }

        function calculateAverageCompletionTime() {
            const completedTasks = appData.tasks.filter(t => t.completed && t.completedAt);
            if (completedTasks.length === 0) return 0;
            
            const totalTime = completedTasks.reduce((sum, task) => {
                const created = new Date(task.createdAt);
                const completed = new Date(task.completedAt);
                return sum + (completed - created);
            }, 0);
            
            return Math.round(totalTime / completedTasks.length / (1000 * 60 * 60 * 24)); // días
        }

        function getMostProductiveDay() {
            const dayStats = {};
            const completedTasks = appData.tasks.filter(t => t.completed && t.completedAt);
            
            completedTasks.forEach(task => {
                const day = new Date(task.completedAt).toLocaleDateString('es-ES', { weekday: 'long' });
                dayStats[day] = (dayStats[day] || 0) + 1;
            });
            
            let mostProductiveDay = 'Sin datos';
            let maxTasks = 0;
            
            Object.entries(dayStats).forEach(([day, count]) => {
                if (count > maxTasks) {
                    maxTasks = count;
                    mostProductiveDay = day;
                }
            });
            
            return mostProductiveDay;
        }

        function getProjectStats() {
            return appData.projects.map(project => {
                const projectTasks = appData.tasks.filter(t => t.projectId === project.id);
                const completedTasks = projectTasks.filter(t => t.completed);
                
                return {
                    name: project.name,
                    color: project.color,
                    totalTasks: projectTasks.length,
                    completedTasks: completedTasks.length,
                    completionRate: Math.round((completedTasks.length / projectTasks.length) * 100) || 0
                };
            });
        }

        // Modal de estadísticas
        function showStatsModal() {
            const stats = getProductivityStats();
            
            const modal = document.createElement('div');
            modal.className = 'modal active';
            modal.id = 'statsModal';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 600px;">
                    <div class="modal-header">
                        <h2 class="modal-title">📊 Estadísticas de productividad</h2>
                        <button class="modal-close" onclick="hideStatsModal()">×</button>
                    </div>
                    
                    <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
                        <div class="stat-card">
                            <div class="stat-number">${stats.totalTasks}</div>
                            <div class="stat-label">Tareas totales</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${stats.completedTasks}</div>
                            <div class="stat-label">Tareas completadas</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${stats.completionRate}%</div>
                            <div class="stat-label">Tasa de finalización</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${stats.completedThisWeek}</div>
                            <div class="stat-label">Completadas esta semana</div>
                        </div>
                    </div>
                    
                    <div class="stats-details" style="margin-bottom: 24px;">
                        <h3 style="margin-bottom: 16px; color: #333;">📈 Detalles de productividad</h3>
                        <div class="detail-grid" style="display: grid; gap: 12px;">
                            <div class="detail-item">
                                <span class="detail-label">Completadas este mes:</span>
                                <span class="detail-value">${stats.completedThisMonth}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Alta prioridad completadas:</span>
                                <span class="detail-value">${stats.highPriorityCompleted}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Tiempo promedio de finalización:</span>
                                <span class="detail-value">${stats.averageCompletionTime} días</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Día más productivo:</span>
                                <span class="detail-value">${stats.mostProductiveDay}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="project-stats">
                        <h3 style="margin-bottom: 16px; color: #333;">📁 Estadísticas por proyecto</h3>
                        <div class="project-stats-list">
                            ${stats.projectStats.map(project => `
                                <div class="project-stat-item" style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background-color: #f8f9fa; border-radius: 8px; margin-bottom: 8px;">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <div class="project-color" style="background-color: ${project.color}; width: 12px; height: 12px; border-radius: 50%;"></div>
                                        <span style="font-weight: 500;">${project.name}</span>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="font-size: 14px; font-weight: 600;">${project.completedTasks}/${project.totalTasks}</div>
                                        <div style="font-size: 12px; color: #666;">${project.completionRate}% completado</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin-top: 24px;">
                        <button class="btn btn-secondary" onclick="exportData()" style="margin-right: 12px;">📥 Exportar datos</button>
                        <button class="btn btn-primary" onclick="hideStatsModal()">Cerrar</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
        }

        function hideStatsModal() {
            const modal = document.getElementById('statsModal');
            if (modal) {
                modal.remove();
            }
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

        // Modo oscuro
        function toggleDarkMode() {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            window.darkModeEnabled = isDark;
            
            showNotification(isDark ? '🌙 Modo oscuro activado' : '☀️ Modo claro activado');
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
        
        // Inicializar funciones avanzadas
        setTimeout(() => {
            addAdvancedFeatures();
            
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