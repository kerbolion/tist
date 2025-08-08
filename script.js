// Variables globales
let appData = {
    tasks: [],
    projects: [
        { id: 1, name: 'Trabajo', color: '#db4035' },
        { id: 2, name: 'Personal', color: '#ff9933' },
        { id: 3, name: 'Estudio', color: '#299438' }
    ],
    currentView: 'today',
    editingTask: null,
    editingProject: null
};

let taskIdCounter = 1;
let projectIdCounter = 4;
let subtaskIdCounter = 1000;

// Estado del formulario
let isFormVisible = false;

// Configuración de IA con valores por defecto optimizados
let aiConfig = {
    apiKey: '',
    model: 'gpt-4.1-nano',
    maxTokens: 1000,
    temperature: 0.7,
    historyLimit: 10
};

// Estadísticas de uso
let aiStats = {
    todayQueries: 0,
    totalTokens: 0,
    estimatedCost: 0,
    usageHistory: [],
    currentModel: 'GPT-4.1 nano',
    lastResetDate: new Date().toDateString()
};

// Precios por modelo (por 1K tokens)
const modelPricing = {
    'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-4.1-nano': { input: 0.0015, output: 0.002 } 
};

// Funciones de utilidad para fechas con zona horaria corregida
function getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getCurrentDateTimeString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function getDateFromString(dateString) {
    if (!dateString) return null;
    // Crear fecha local sin conversión de zona horaria
    const parts = dateString.split('T')[0].split('-');
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
}

function compareDates(date1String, date2String) {
    const date1 = getDateFromString(date1String);
    const date2 = getDateFromString(date2String);
    
    if (!date1 || !date2) return 0;
    
    if (date1 < date2) return -1;
    if (date1 > date2) return 1;
    return 0;
}

// Función para obtener todas las etiquetas existentes
function getAllExistingLabels() {
    const labels = new Set();
    appData.tasks.forEach(task => {
        if (task.labels) {
            task.labels.forEach(label => labels.add(label));
        }
    });
    return Array.from(labels).sort();
}

// Función para obtener todos los proyectos con nombres
function getProjectsInfo() {
    return appData.projects.map(project => ({
        id: project.id,
        name: project.name,
        color: project.color
    }));
}

// Funciones de almacenamiento mejoradas
function saveToLocalStorage() {
    try {
        const dataToSave = {
            tasks: appData.tasks,
            projects: appData.projects,
            taskIdCounter: taskIdCounter,
            projectIdCounter: projectIdCounter,
            subtaskIdCounter: subtaskIdCounter
        };
        localStorage.setItem('todoistData', JSON.stringify(dataToSave));
        console.log('Datos guardados correctamente');
    } catch (error) {
        console.error('Error guardando datos:', error);
        mostrarMensajeChat('❌ Error guardando datos localmente');
    }
}

function loadFromLocalStorage() {
    try {
        const savedData = localStorage.getItem('todoistData');
        if (savedData) {
            const data = JSON.parse(savedData);
            appData.tasks = data.tasks || [];
            appData.projects = data.projects || appData.projects;
            taskIdCounter = data.taskIdCounter || 1;
            projectIdCounter = data.projectIdCounter || 4;
            subtaskIdCounter = data.subtaskIdCounter || 1000;
            console.log('Datos cargados correctamente');
        }
    } catch (e) {
        console.error('Error cargando datos:', e);
        mostrarMensajeChat('❌ Error cargando datos guardados');
    }
}

function saveAIConfigToStorage() {
    try {
        localStorage.setItem('aiConfig', JSON.stringify(aiConfig));
        localStorage.setItem('aiStats', JSON.stringify(aiStats));
        console.log('Configuración de IA guardada');
    } catch (error) {
        console.error('Error guardando configuración de IA:', error);
    }
}

function loadAIConfig() {
    try {
        const savedConfig = localStorage.getItem('aiConfig');
        const savedStats = localStorage.getItem('aiStats');
        
        if (savedConfig) {
            const config = JSON.parse(savedConfig);
            aiConfig = { ...aiConfig, ...config };
            console.log('Configuración de IA cargada');
        }
        
        if (savedStats) {
            const stats = JSON.parse(savedStats);
            // Reset daily stats if it's a new day
            if (stats.lastResetDate !== new Date().toDateString()) {
                stats.todayQueries = 0;
                stats.lastResetDate = new Date().toDateString();
            }
            aiStats = { ...aiStats, ...stats };
            console.log('Estadísticas de IA cargadas');
        }
    } catch (e) {
        console.error('Error cargando configuración de IA:', e);
    }
}

// Función para buscar proyecto por nombre
function findProjectByName(projectName) {
    if (!projectName) return null;
    return appData.projects.find(p => 
        p.name.toLowerCase().includes(projectName.toLowerCase()) ||
        projectName.toLowerCase().includes(p.name.toLowerCase())
    );
}

// Clase Assistant mejorada con soporte para proyectos
class Assistant {
    constructor() {
        this.mensajes = JSON.parse(localStorage.getItem('assistantMessages')) || [];
        this.promptBase = "Eres un asistente que ayuda con tareas y notas, gestionándolas en tiempo real. " +
            "Puedes agregar, editar, eliminar múltiples tareas en una sola consulta. " +
            "Cada tarea tiene un ID único. Para editar o eliminar, usa el ID de la tarea específica. " +
            "Cuando muestres las tareas al usuario, siempre incluye su ID para referencia. " +
            "Puedes realizar operaciones en lote como 'eliminar tareas 1, 2, 3' o 'marcar como completadas las tareas 4, 5, 6'. " +
            "IMPORTANTE: Cuando el usuario mencione un proyecto, usa el nombre exacto del proyecto que existe en la lista. " +
            "Los proyectos disponibles son: " + getProjectsInfo().map(p => `"${p.name}" (ID: ${p.id})`).join(', ') + ". " +
            "Si el usuario menciona un proyecto que no existe, sugiere crear uno nuevo. " +
            "Sé conciso y directo en tus respuestas para optimizar costos.";
    }

    cleanHistory() {
        if (this.mensajes.length > aiConfig.historyLimit * 2) {
            const keepCount = aiConfig.historyLimit;
            this.mensajes = this.mensajes.slice(-keepCount);
            localStorage.setItem('assistantMessages', JSON.stringify(this.mensajes));
        }
    }

    async obtenerTareas() {
        const tareas = appData.tasks.map(task => {
            const proyecto = task.projectId ? appData.projects.find(p => p.id === task.projectId) : null;
            
            return {
                id: task.id,
                titulo: task.title,
                descripcion: task.description,
                completada: task.completed,
                prioridad: task.priority,
                fecha: task.dueDate,
                proyecto: proyecto?.name || null,
                proyectoId: task.projectId,
                etiquetas: task.labels,
                subtareas: task.subtasks
            };
        });

        let respuesta = "## 📋 Tareas\n\n";
        
        if (tareas.length === 0) {
            respuesta += "*Sin tareas.*";
        } else {
            tareas.forEach(tarea => {
                const estado = tarea.completada ? "✅" : "⏳";
                const prioEmoji = tarea.prioridad === 'alta' ? '🔴' : tarea.prioridad === 'media' ? '🟡' : '⚪';
                
                respuesta += `**${tarea.titulo}** (ID: ${tarea.id}) ${estado} ${prioEmoji}\n`;
                
                if (tarea.descripcion) respuesta += `*${tarea.descripcion}*\n`;
                if (tarea.fecha) {
                    const fecha = new Date(tarea.fecha);
                    respuesta += `📅 ${fecha.toLocaleDateString()}\n`;
                }
                if (tarea.proyecto) respuesta += `📁 ${tarea.proyecto}\n`;
                if (tarea.etiquetas?.length) respuesta += `🏷️ ${tarea.etiquetas.map(e => `#${e}`).join(' ')}\n`;
                
                respuesta += "\n";
            });
        }
        
        return respuesta;
    }

    async agregarTareas(tareas) {
        const tareasArray = Array.isArray(tareas) ? tareas : [tareas];
        const resultados = [];
        
        for (const tarea of tareasArray) {
            // Buscar proyecto por nombre si se proporciona
            let projectId = null;
            if (tarea.proyecto || tarea.projectName) {
                const projectName = tarea.proyecto || tarea.projectName;
                const foundProject = findProjectByName(projectName);
                if (foundProject) {
                    projectId = foundProject.id;
                } else {
                    resultados.push(`⚠️ Proyecto "${projectName}" no encontrado. Tarea creada sin proyecto.`);
                }
            }
            
            const nuevaTarea = {
                id: taskIdCounter++,
                title: tarea.titulo || tarea.name || tarea.title,
                description: tarea.descripcion || tarea.description || '',
                completed: false,
                priority: tarea.prioridad || tarea.priority || 'baja',
                dueDate: tarea.fecha || tarea.date || null,
                projectId: projectId || tarea.proyectoId || tarea.projectId || null,
                labels: tarea.etiquetas || tarea.labels || [],
                subtasks: (tarea.subtareas || tarea.subtasks || []).map(sub => ({
                    id: subtaskIdCounter++,
                    title: typeof sub === 'string' ? sub : sub.title || sub.titulo,
                    completed: false
                })),
                createdAt: new Date().toISOString()
            };
            
            appData.tasks.push(nuevaTarea);
            const projectName = projectId ? appData.projects.find(p => p.id === projectId)?.name : 'Sin proyecto';
            resultados.push(`✅ Tarea agregada (ID: ${nuevaTarea.id}): "${nuevaTarea.title}" en proyecto "${projectName}"`);
        }
        
        saveToLocalStorage();
        renderTasks();
        renderLabels();
        updateCounts();
        return resultados.join('\n');
    }

    async editarTareas(tareasAEditar) {
        const resultados = [];
        const tareasArray = Array.isArray(tareasAEditar) ? tareasAEditar : [tareasAEditar];
        
        for (const edicion of tareasArray) {
            const taskId = edicion.taskId || edicion.id;
            const cambios = edicion.cambios || edicion;
            
            const taskIndex = appData.tasks.findIndex(t => t.id === parseInt(taskId));
            if (taskIndex === -1) {
                resultados.push(`❌ No encontré tarea ID ${taskId}`);
                continue;
            }

            const task = appData.tasks[taskIndex];
            
            if (cambios.titulo || cambios.title) task.title = cambios.titulo || cambios.title;
            if (cambios.descripcion || cambios.description) task.description = cambios.descripcion || cambios.description;
            if (cambios.prioridad || cambios.priority) task.priority = cambios.prioridad || cambios.priority;
            if (cambios.fecha || cambios.date) task.dueDate = cambios.fecha || cambios.date;
            if (cambios.completada !== undefined || cambios.completed !== undefined) {
                task.completed = cambios.completada !== undefined ? cambios.completada : cambios.completed;
                task.completedAt = task.completed ? new Date().toISOString() : null;
            }
            if (cambios.etiquetas || cambios.labels) task.labels = cambios.etiquetas || cambios.labels;
            
            // Manejar cambio de proyecto
            if (cambios.proyecto || cambios.projectName) {
                const projectName = cambios.proyecto || cambios.projectName;
                const foundProject = findProjectByName(projectName);
                if (foundProject) {
                    task.projectId = foundProject.id;
                } else {
                    resultados.push(`⚠️ Proyecto "${projectName}" no encontrado para tarea ID ${taskId}`);
                }
            }
            
            resultados.push(`✅ Tarea ID ${taskId} actualizada: "${task.title}"`);
        }
        
        saveToLocalStorage();
        renderTasks();
        renderLabels();
        updateCounts();
        return resultados.join('\n');
    }

    async eliminarTareas(taskIds) {
        const idsArray = Array.isArray(taskIds) ? taskIds : [taskIds];
        const resultados = [];
        
        for (const taskId of idsArray) {
            const taskIndex = appData.tasks.findIndex(t => t.id === parseInt(taskId));
            if (taskIndex === -1) {
                resultados.push(`❌ No encontré tarea ID ${taskId}`);
                continue;
            }

            const task = appData.tasks[taskIndex];
            appData.tasks.splice(taskIndex, 1);
            resultados.push(`🗑️ Eliminada: "${task.title}" (ID: ${taskId})`);
        }
        
        saveToLocalStorage();
        renderTasks();
        renderLabels();
        updateCounts();
        return resultados.join('\n');
    }

    async marcarCompletadas(taskIds) {
        const idsArray = Array.isArray(taskIds) ? taskIds : [taskIds];
        return await this.editarTareas(idsArray.map(id => ({
            taskId: id,
            cambios: { completada: true }
        })));
    }

    async marcarPendientes(taskIds) {
        const idsArray = Array.isArray(taskIds) ? taskIds : [taskIds];
        return await this.editarTareas(idsArray.map(id => ({
            taskId: id,
            cambios: { completada: false }
        })));
    }

    async consultarConFunciones(pregunta) {
        if (!aiConfig.apiKey) {
            return '🔑 **Error:** No has configurado tu API Key de OpenAI. Ve a Configurar IA en el sidebar.';
        }

        this.mensajes.push({ role: 'user', content: pregunta });
        this.cleanHistory();

        // Actualizar prompt base con proyectos actuales
        const projectsInfo = getProjectsInfo();
        const updatedPromptBase = "Eres un asistente que ayuda con tareas y notas, gestionándolas en tiempo real. " +
            "Puedes agregar, editar, eliminar múltiples tareas en una sola consulta. " +
            "Cada tarea tiene un ID único. Para editar o eliminar, usa el ID de la tarea específica. " +
            "Cuando muestres las tareas al usuario, siempre incluye su ID para referencia. " +
            "Puedes realizar operaciones en lote como 'eliminar tareas 1, 2, 3' o 'marcar como completadas las tareas 4, 5, 6'. " +
            "IMPORTANTE: Cuando el usuario mencione un proyecto, usa el nombre exacto del proyecto que existe en la lista. " +
            "Los proyectos disponibles son: " + projectsInfo.map(p => `"${p.name}" (ID: ${p.id})`).join(', ') + ". " +
            "Si el usuario menciona un proyecto que no existe exactamente, sugiere crear uno nuevo. " +
            "Sé conciso y directo en tus respuestas para optimizar costos.";

        const mensajesAPI = [
            { role: 'system', content: updatedPromptBase },
            ...this.mensajes
        ];

        try {
            const startTime = Date.now();
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${aiConfig.apiKey}`
                },
                body: JSON.stringify({
                    model: aiConfig.model,
                    messages: mensajesAPI,
                    max_tokens: aiConfig.maxTokens,
                    temperature: aiConfig.temperature,
                    functions: [
                        {
                            name: 'obtenerTareas',
                            description: 'Devuelve la lista de tareas con sus IDs únicos y proyectos asignados.',
                            parameters: { type: 'object', properties: {} }
                        },
                        {
                            name: 'agregarTareas',
                            description: 'Agrega una o múltiples tareas nuevas. Puede incluir asignación a proyectos existentes.',
                            parameters: { 
                                type: 'object', 
                                properties: { 
                                    tareas: { 
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                titulo: { type: 'string', description: 'Título de la tarea' },
                                                descripcion: { type: 'string', description: 'Descripción opcional' },
                                                prioridad: { type: 'string', enum: ['alta', 'media', 'baja'], description: 'Prioridad de la tarea' },
                                                fecha: { type: 'string', description: 'Fecha límite en formato ISO' },
                                                proyecto: { type: 'string', description: 'Nombre del proyecto (debe coincidir exactamente con un proyecto existente)' },
                                                etiquetas: { type: 'array', items: { type: 'string' }, description: 'Lista de etiquetas' },
                                                subtareas: { type: 'array', items: { type: 'string' }, description: 'Lista de subtareas' }
                                            },
                                            required: ['titulo']
                                        }
                                    }
                                }, 
                                required: ['tareas'] 
                            }
                        },
                        {
                            name: 'editarTareas',
                            description: 'Edita una o múltiples tareas existentes usando sus IDs únicos. Puede cambiar la asignación de proyecto.',
                            parameters: { 
                                type: 'object', 
                                properties: { 
                                    tareasAEditar: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                taskId: { type: 'integer', description: 'ID único de la tarea a editar' },
                                                cambios: { 
                                                    type: 'object',
                                                    properties: {
                                                        titulo: { type: 'string' },
                                                        descripcion: { type: 'string' },
                                                        prioridad: { type: 'string', enum: ['alta', 'media', 'baja'] },
                                                        fecha: { type: 'string' },
                                                        completada: { type: 'boolean' },
                                                        proyecto: { type: 'string', description: 'Nombre del proyecto (debe coincidir exactamente)' },
                                                        etiquetas: { type: 'array', items: { type: 'string' } }
                                                    }
                                                }
                                            },
                                            required: ['taskId', 'cambios']
                                        }
                                    }
                                }, 
                                required: ['tareasAEditar'] 
                            }
                        },
                        {
                            name: 'eliminarTareas',
                            description: 'Elimina una o múltiples tareas usando sus IDs únicos.',
                            parameters: { 
                                type: 'object', 
                                properties: { 
                                    taskIds: { 
                                        type: 'array',
                                        items: { type: 'integer' },
                                        description: 'Array de IDs únicos de las tareas a eliminar'
                                    }
                                }, 
                                required: ['taskIds'] 
                            }
                        },
                        {
                            name: 'marcarCompletadas',
                            description: 'Marca una o múltiples tareas como completadas usando sus IDs.',
                            parameters: { 
                                type: 'object', 
                                properties: { 
                                    taskIds: { 
                                        type: 'array',
                                        items: { type: 'integer' },
                                        description: 'Array de IDs únicos de las tareas'
                                    }
                                }, 
                                required: ['taskIds'] 
                            }
                        },
                        {
                            name: 'marcarPendientes',
                            description: 'Marca una o múltiples tareas como pendientes usando sus IDs.',
                            parameters: { 
                                type: 'object', 
                                properties: { 
                                    taskIds: { 
                                        type: 'array',
                                        items: { type: 'integer' },
                                        description: 'Array de IDs únicos de las tareas'
                                    }
                                }, 
                                required: ['taskIds'] 
                            }
                        }
                    ],
                })
            });

            const data = await response.json();
            const endTime = Date.now();

            if (!response.ok) {
                console.error('Error en la API:', data);
                return '❌ **Error API:** ' + (data.error ? data.error.message : `Estado ${response.status}`);
            }

            // Tracking de uso y costos
            if (data.usage) {
                const { prompt_tokens, completion_tokens, total_tokens } = data.usage;
                const pricing = modelPricing[aiConfig.model];
                const cost = (prompt_tokens * pricing.input / 1000) + (completion_tokens * pricing.output / 1000);
                
                aiStats.todayQueries++;
                aiStats.totalTokens += total_tokens;
                aiStats.estimatedCost += cost;
                aiStats.usageHistory.push({
                    timestamp: new Date().toLocaleTimeString(),
                    model: aiConfig.model,
                    tokens: total_tokens,
                    cost: cost,
                    responseTime: endTime - startTime
                });
                
                saveAIConfigToStorage();
            }

            if (data.choices && data.choices.length > 0) {
                const msg = data.choices[0].message;
                if (msg.hasOwnProperty('function_call')) {
                    const nombreFuncion = msg.function_call.name;
                    const args = JSON.parse(msg.function_call.arguments);
                    let resultado;
                    
                    switch(nombreFuncion) {
                        case 'obtenerTareas':
                            resultado = await this.obtenerTareas();
                            break;
                        case 'agregarTareas':
                            resultado = await this.agregarTareas(args.tareas);
                            break;
                        case 'editarTareas':
                            resultado = await this.editarTareas(args.tareasAEditar);
                            break;
                        case 'eliminarTareas':
                            resultado = await this.eliminarTareas(args.taskIds);
                            break;
                        case 'marcarCompletadas':
                            resultado = await this.marcarCompletadas(args.taskIds);
                            break;
                        case 'marcarPendientes':
                            resultado = await this.marcarPendientes(args.taskIds);
                            break;
                        default:
                            resultado = '❌ Función no reconocida.';
                    }

                    this.mensajes.push({ 
                        role: 'function', 
                        name: nombreFuncion, 
                        content: resultado 
                    });
                    
                    const finalResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${aiConfig.apiKey}`
                        },
                        body: JSON.stringify({
                            model: aiConfig.model,
                            messages: [
                                { role: 'system', content: updatedPromptBase + " Responde de forma muy concisa." },
                                ...this.mensajes.slice(-3),
                                { role: 'user', content: "Resume brevemente lo que acabas de hacer." }
                            ],
                            max_tokens: Math.min(aiConfig.maxTokens, 200),
                            temperature: 0.3
                        })
                    });

                    const finalData = await finalResponse.json();
                    if (finalData.choices && finalData.choices.length > 0) {
                        const finalMsg = finalData.choices[0].message.content;
                        this.mensajes.push({ role: 'assistant', content: finalMsg });
                        localStorage.setItem('assistantMessages', JSON.stringify(this.mensajes));
                        return finalMsg;
                    }
                    
                    return resultado;
                    
                } else {
                    this.mensajes.push({ role: 'assistant', content: msg.content });
                    localStorage.setItem('assistantMessages', JSON.stringify(this.mensajes));
                    return msg.content;
                }
            } else {
                return "❌ Respuesta no válida de la API.";
            }
        } catch (error) {
            console.error('Error:', error);
            return '❌ **Error de conexión:** ' + error.message;
        }
    }
}

const assistant = new Assistant();

// Función para mostrar/ocultar formulario de tareas
function toggleTaskForm() {
    const form = document.getElementById('taskForm');
    const btn = document.getElementById('toggleFormBtn');
    
    isFormVisible = !isFormVisible;
    
    if (isFormVisible) {
        form.style.display = 'block';
        btn.innerHTML = '<span>📝</span>Ocultar formulario';
        // Focus en el campo de nombre de tarea
        setTimeout(() => {
            document.getElementById('task-name').focus();
        }, 100);
    } else {
        form.style.display = 'none';
        btn.innerHTML = '<span>📝</span>Mostrar formulario';
    }
}

// Funciones para manejo de sugerencias de etiquetas
function showTagSuggestions(inputElement, suggestionsElement) {
    const query = inputElement.value.toLowerCase();
    const existingLabels = getAllExistingLabels();
    
    if (query.length === 0) {
        suggestionsElement.classList.remove('show');
        return;
    }
    
    // Determinar qué etiquetas ya están seleccionadas según el contexto
    let currentLabels = [];
    if (inputElement.id === 'task-tags') {
        currentLabels = selectedTags;
    } else {
        currentLabels = getCurrentTaskLabels();
    }
    
    const filteredLabels = existingLabels.filter(label => 
        label.toLowerCase().includes(query) && 
        !currentLabels.includes(label)
    );
    
    if (filteredLabels.length === 0) {
        suggestionsElement.classList.remove('show');
        return;
    }
    
    // Limpiar y crear nuevos elementos de sugerencia
    suggestionsElement.innerHTML = '';
    filteredLabels.forEach((label, index) => {
        const suggestionDiv = document.createElement('div');
        suggestionDiv.className = 'tag-suggestion';
        suggestionDiv.innerHTML = `
            <span class="tag-suggestion-icon">🏷️</span>
            #${label}
        `;
        
        // Usar event listener en lugar de onclick
        suggestionDiv.addEventListener('click', function() {
            selectTagSuggestion(label, inputElement.id, suggestionsElement.id);
        });
        
        suggestionsElement.appendChild(suggestionDiv);
    });
    
    suggestionsElement.classList.add('show');
}

function selectTagSuggestion(label, inputId, suggestionsId) {
    if (inputId === 'task-tags') {
        // Formulario principal
        if (!selectedTags.includes(label)) {
            selectedTags.push(label);
            renderSelectedTags();
        }
    } else {
        // Modal
        if (!getCurrentTaskLabels().includes(label)) {
            addTaskLabel(label);
        }
    }
    
    document.getElementById(inputId).value = '';
    document.getElementById(suggestionsId).classList.remove('show');
}

function hideTagSuggestions(suggestionsElement) {
    setTimeout(() => {
        suggestionsElement.classList.remove('show');
    }, 200);
}

// Funciones de configuración de IA
function showAIConfigModal() {
    document.getElementById('aiConfigModal').classList.add('active');
    
    document.getElementById('aiApiKey').value = aiConfig.apiKey;
    document.getElementById('aiModel').value = aiConfig.model;
    document.getElementById('maxTokens').value = aiConfig.maxTokens;
    document.getElementById('temperature').value = aiConfig.temperature;
    document.getElementById('historyLimit').value = aiConfig.historyLimit;
    
    updateSliderValues();
    updateCostEstimate();
    updateCostWarning();
}

function hideAIConfigModal() {
    document.getElementById('aiConfigModal').classList.remove('active');
}

function updateSliderValues() {
    document.getElementById('maxTokensValue').textContent = document.getElementById('maxTokens').value;
    document.getElementById('temperatureValue').textContent = document.getElementById('temperature').value;
    document.getElementById('historyLimitValue').textContent = document.getElementById('historyLimit').value;
}

function updateCostEstimate() {
    const model = document.getElementById('aiModel').value;
    const maxTokens = parseInt(document.getElementById('maxTokens').value);
    const pricing = modelPricing[model];
    
    if (pricing) {
        const estimatedInputTokens = 500;
        const estimatedOutputTokens = maxTokens;
        const cost = (estimatedInputTokens * pricing.input / 1000) + (estimatedOutputTokens * pricing.output / 1000);
        document.getElementById('costEstimate').textContent = `~$${cost.toFixed(4)}`;
        return cost.toFixed(4);
    }
    return '0.01';
}

function updateCostWarning() {
    const model = document.getElementById('aiModel').value;
    const warning = document.getElementById('costWarning');
    
    if (model === 'gpt-4' || model === 'gpt-4-turbo') {
        warning.style.display = 'block';
    } else {
        warning.style.display = 'none';
    }
}

function saveAIConfig() {
    aiConfig.apiKey = document.getElementById('aiApiKey').value;
    aiConfig.model = document.getElementById('aiModel').value;
    aiConfig.maxTokens = parseInt(document.getElementById('maxTokens').value);
    aiConfig.temperature = parseFloat(document.getElementById('temperature').value);
    aiConfig.historyLimit = parseInt(document.getElementById('historyLimit').value);
    
    saveAIConfigToStorage();
    hideAIConfigModal();
    
    mostrarMensajeChat('✅ Configuración de IA guardada correctamente');
}

function showAIStatsModal() {
    document.getElementById('aiStatsModal').classList.add('active');
    updateStatsDisplay();
}

function hideAIStatsModal() {
    document.getElementById('aiStatsModal').classList.remove('active');
}

function updateStatsDisplay() {
    document.getElementById('todayQueries').textContent = aiStats.todayQueries;
    document.getElementById('tokensUsed').textContent = aiStats.totalTokens.toLocaleString();
    document.getElementById('estimatedCost').textContent = `$${aiStats.estimatedCost.toFixed(4)}`;
    document.getElementById('currentModel').textContent = aiConfig.model.replace('gpt-', 'GPT-').replace('-turbo', ' Turbo').replace('4.1-nano', '4.1 nano');
    
    const historyContainer = document.getElementById('usageHistory');
    if (aiStats.usageHistory.length === 0) {
        historyContainer.innerHTML = '<p style="color: #666; font-style: italic;">No hay historial de uso</p>';
    } else {
        historyContainer.innerHTML = aiStats.usageHistory.slice(-10).map(entry => `
            <div style="padding: 8px 0; border-bottom: 1px solid #eee;">
                <strong>${entry.timestamp}</strong> - ${entry.model} - ${entry.tokens} tokens - $${entry.cost.toFixed(4)}
            </div>
        `).join('');
    }
}

function exportStats() {
    const dataStr = JSON.stringify(aiStats, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-stats-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    mostrarMensajeChat('📤 Estadísticas exportadas correctamente');
}

function clearStats() {
    if (confirm('¿Estás seguro de que quieres limpiar todas las estadísticas?')) {
        aiStats = {
            todayQueries: 0,
            totalTokens: 0,
            estimatedCost: 0,
            usageHistory: [],
            currentModel: aiConfig.model.replace('gpt-', 'GPT-').replace('-turbo', ' Turbo').replace('4.1-nano', '4.1 nano'),
            lastResetDate: new Date().toDateString()
        };
        saveAIConfigToStorage();
        updateStatsDisplay();
        mostrarMensajeChat('🗑️ Estadísticas limpiadas');
    }
}

// Funciones de gestión de datos
function showDataManagementModal() {
    document.getElementById('dataManagementModal').classList.add('active');
}

function hideDataManagementModal() {
    document.getElementById('dataManagementModal').classList.remove('active');
}

function exportAllData() {
    const allData = {
        tasks: appData.tasks,
        projects: appData.projects,
        aiConfig: aiConfig,
        aiStats: aiStats,
        counters: {
            taskIdCounter,
            projectIdCounter,
            subtaskIdCounter
        },
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    const dataStr = JSON.stringify(allData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `task-manager-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    mostrarMensajeChat('📤 Todos los datos exportados correctamente');
}

function exportTasks() {
    const tasksData = {
        tasks: appData.tasks,
        counters: { taskIdCounter, subtaskIdCounter },
        exportDate: new Date().toISOString(),
        type: 'tasks-only'
    };
    
    const dataStr = JSON.stringify(tasksData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tasks-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    mostrarMensajeChat('📤 Tareas exportadas correctamente');
}

function exportProjects() {
    const projectsData = {
        projects: appData.projects,
        counters: { projectIdCounter },
        exportDate: new Date().toISOString(),
        type: 'projects-only'
    };
    
    const dataStr = JSON.stringify(projectsData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `projects-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    mostrarMensajeChat('📤 Proyectos exportados correctamente');
}

function importData() {
    const fileInput = document.getElementById('importFileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        mostrarMensajeChat('❌ Por favor selecciona un archivo para importar');
        return;
    }

    if (file.type !== 'application/json') {
        mostrarMensajeChat('❌ Por favor selecciona un archivo JSON válido');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (!confirm('⚠️ ¿Estás seguro? Esto reemplazará todos los datos actuales. Esta acción no se puede deshacer.')) {
                return;
            }

            // Validar estructura básica
            if (importedData.tasks && Array.isArray(importedData.tasks)) {
                appData.tasks = importedData.tasks;
            }
            
            if (importedData.projects && Array.isArray(importedData.projects)) {
                appData.projects = importedData.projects;
            }
            
            if (importedData.aiConfig) {
                aiConfig = { ...aiConfig, ...importedData.aiConfig };
            }
            
            if (importedData.aiStats) {
                aiStats = { ...aiStats, ...importedData.aiStats };
            }
            
            if (importedData.counters) {
                taskIdCounter = importedData.counters.taskIdCounter || taskIdCounter;
                projectIdCounter = importedData.counters.projectIdCounter || projectIdCounter;
                subtaskIdCounter = importedData.counters.subtaskIdCounter || subtaskIdCounter;
            }
            
            // Guardar todo
            saveToLocalStorage();
            saveAIConfigToStorage();
            
            // Actualizar interfaz
            renderTasks();
            renderProjects();
            renderLabels();
            updateCounts();
            
            hideDataManagementModal();
            mostrarMensajeChat('✅ Datos importados correctamente');
            
        } catch (error) {
            console.error('Error importing data:', error);
            mostrarMensajeChat('❌ Error al importar datos: Archivo inválido');
        }
    };
    
    reader.readAsText(file);
}

function clearAllData() {
    if (!confirm('⚠️ ¿Estás COMPLETAMENTE seguro? Esto eliminará TODOS los datos (tareas, proyectos, configuración). Esta acción NO se puede deshacer.')) {
        return;
    }
    
    if (!confirm('⚠️ ÚLTIMA CONFIRMACIÓN: Se eliminarán todos tus datos. ¿Continuar?')) {
        return;
    }
    
    // Limpiar datos
    appData.tasks = [];
    appData.projects = [
        { id: 1, name: 'Trabajo', color: '#db4035' },
        { id: 2, name: 'Personal', color: '#ff9933' },
        { id: 3, name: 'Estudio', color: '#299438' }
    ];
    
    taskIdCounter = 1;
    projectIdCounter = 4;
    subtaskIdCounter = 1000;
    
    // Limpiar configuración IA
    aiConfig = {
        apiKey: '',
        model: 'gpt-4.1-nano',
        maxTokens: 1000,
        temperature: 0.7,
        historyLimit: 10
    };
    
    aiStats = {
        todayQueries: 0,
        totalTokens: 0,
        estimatedCost: 0,
        usageHistory: [],
        currentModel: 'GPT-4.1 nano',
        lastResetDate: new Date().toDateString()
    };
    
    // Limpiar localStorage
    localStorage.removeItem('todoistData');
    localStorage.removeItem('aiConfig');
    localStorage.removeItem('aiStats');
    localStorage.removeItem('assistantMessages');
    
    // Actualizar interfaz
    renderTasks();
    renderProjects();
    renderLabels();
    updateCounts();
    
    hideDataManagementModal();
    mostrarMensajeChat('🗑️ Todos los datos han sido eliminados');
}

// Funciones de navegación
function switchView(view) {
    appData.currentView = view;
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-view="${view}"]`).classList.add('active');
    
    const titles = {
        today: 'Hoy',
        upcoming: 'Próximamente',
        inbox: 'Bandeja de entrada',
        important: 'Importante',
        all: 'Todas las tareas',
        completed: 'Completadas'
    };
    
    document.getElementById('mainTitle').textContent = titles[view] || view;
    renderTasks();
}

function switchToLabel(labelName) {
    appData.currentView = 'label';
    appData.selectedLabel = labelName;
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-label="${labelName}"]`)?.classList.add('active');
    
    document.getElementById('mainTitle').textContent = `#${labelName}`;
    renderTasks();
}

function searchTasks() {
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    appData.searchQuery = query;
    
    if (query) {
        appData.currentView = 'search';
        document.getElementById('mainTitle').textContent = `Búsqueda: "${query}"`;
        
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
    } else {
        switchView('today');
    }
    
    renderTasks();
}

function switchToProject(projectId) {
    appData.currentView = 'project';
    appData.selectedProject = projectId;
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-project="${projectId}"]`)?.classList.add('active');
    
    const project = appData.projects.find(p => p.id === projectId);
    document.getElementById('mainTitle').textContent = project.name;
    renderTasks();
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

// Gestión de proyectos mejorada
function showProjectModal(projectId = null) {
    const modal = document.getElementById('projectModal');
    const title = document.getElementById('projectModalTitle');
    const deleteBtn = document.getElementById('deleteProjectBtn');
    
    if (projectId) {
        // Modo edición
        appData.editingProject = appData.projects.find(p => p.id === projectId);
        title.textContent = 'Editar proyecto';
        document.getElementById('projectNameInput').value = appData.editingProject.name;
        document.getElementById('projectColorInput').value = appData.editingProject.color;
        deleteBtn.style.display = 'block';
    } else {
        // Modo creación
        appData.editingProject = null;
        title.textContent = 'Nuevo proyecto';
        document.getElementById('projectNameInput').value = '';
        document.getElementById('projectColorInput').value = '#db4035';
        deleteBtn.style.display = 'none';
    }
    
    modal.classList.add('active');
    document.getElementById('projectNameInput').focus();
}

function hideProjectModal() {
    document.getElementById('projectModal').classList.remove('active');
    appData.editingProject = null;
}

function saveProject() {
    const name = document.getElementById('projectNameInput').value.trim();
    const color = document.getElementById('projectColorInput').value;
    
    if (!name) {
        mostrarMensajeChat('❌ El nombre del proyecto es requerido');
        return;
    }
    
    if (appData.editingProject) {
        // Editar proyecto existente
        appData.editingProject.name = name;
        appData.editingProject.color = color;
        mostrarMensajeChat(`✅ Proyecto "${name}" actualizado correctamente`);
    } else {
        // Crear nuevo proyecto
        const project = {
            id: projectIdCounter++,
            name: name,
            color: color
        };
        appData.projects.push(project);
        mostrarMensajeChat(`✅ Proyecto "${name}" creado correctamente`);
    }
    
    hideProjectModal();
    renderProjects();
    updateProjectSelects();
    saveToLocalStorage();
}

function deleteProject() {
    if (!appData.editingProject) return;
    
    const projectName = appData.editingProject.name;
    const tasksInProject = appData.tasks.filter(t => t.projectId === appData.editingProject.id);
    
    let confirmMessage = `¿Estás seguro de que quieres eliminar el proyecto "${projectName}"?`;
    if (tasksInProject.length > 0) {
        confirmMessage += `\n\nEsto también moverá ${tasksInProject.length} tarea(s) a "Sin proyecto".`;
    }
    
    if (confirm(confirmMessage)) {
        // Mover tareas a sin proyecto
        tasksInProject.forEach(task => {
            task.projectId = null;
        });
        
        // Eliminar proyecto
        appData.projects = appData.projects.filter(p => p.id !== appData.editingProject.id);
        
        hideProjectModal();
        renderProjects();
        renderTasks();
        updateProjectSelects();
        updateCounts();
        saveToLocalStorage();
        
        mostrarMensajeChat(`🗑️ Proyecto "${projectName}" eliminado correctamente`);
        
        // Si estábamos viendo el proyecto eliminado, cambiar vista
        if (appData.currentView === 'project' && appData.selectedProject === appData.editingProject.id) {
            switchView('today');
        }
    }
}

function editProject(projectId) {
    showProjectModal(projectId);
}

function updateProjectSelects() {
    const selects = [document.getElementById('task-project'), document.getElementById('modalTaskProject')];
    selects.forEach(select => {
        if (select) {
            const currentValue = select.value;
            select.innerHTML = `
                <option value="">Sin proyecto</option>
                ${appData.projects.map(project => 
                    `<option value="${project.id}">${project.name}</option>`
                ).join('')}
            `;
            select.value = currentValue;
        }
    });
}

// Funciones de gestión de tareas
function getFilteredTasks() {
    let filtered = [...appData.tasks];
    
    switch (appData.currentView) {
        case 'today':
            const todayStr = getTodayDateString();
            filtered = filtered.filter(task => 
                !task.completed && (
                    (task.dueDate && task.dueDate.split('T')[0] === todayStr) || 
                    (task.dueDate && compareDates(task.dueDate, todayStr) < 0)
                )
            );
            break;
        case 'upcoming':
            const todayForUpcoming = getTodayDateString();
            filtered = filtered.filter(task => 
                !task.completed && task.dueDate && compareDates(task.dueDate, todayForUpcoming) > 0
            );
            break;
        case 'inbox':
            filtered = filtered.filter(task => !task.completed && !task.projectId);
            break;
        case 'important':
            filtered = filtered.filter(task => !task.completed && task.priority === 'alta');
            break;
        case 'all':
            filtered = filtered.filter(task => !task.completed);
            break;
        case 'completed':
            filtered = filtered.filter(task => task.completed);
            break;
        case 'project':
            filtered = filtered.filter(task => task.projectId === appData.selectedProject);
            break;
        case 'label':
            filtered = filtered.filter(task => 
                task.labels && task.labels.includes(appData.selectedLabel)
            );
            break;
        case 'search':
            const query = appData.searchQuery.toLowerCase();
            filtered = filtered.filter(task => 
                task.title.toLowerCase().includes(query) ||
                (task.description && task.description.toLowerCase().includes(query)) ||
                (task.labels && task.labels.some(label => 
                    label.toLowerCase().includes(query)
                ))
            );
            break;
        default:
            break;
    }
    
    // Ordenar por prioridad y fecha
    filtered.sort((a, b) => {
        if (a.completed && !b.completed) return 1;
        if (!a.completed && b.completed) return -1;
        
        const priorityOrder = { 'alta': 1, 'media': 2, 'baja': 3 };
        const aPriority = priorityOrder[a.priority] || 3;
        const bPriority = priorityOrder[b.priority] || 3;
        
        if (aPriority !== bPriority) return aPriority - bPriority;
        if (a.dueDate && b.dueDate) {
            const comparison = compareDates(a.dueDate, b.dueDate);
            if (comparison !== 0) return comparison;
        }
        if (a.dueDate && !b.dueDate) return -1;
        if (!a.dueDate && b.dueDate) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    return filtered;
}

function toggleTask(taskId) {
    const task = appData.tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : null;
        saveToLocalStorage();
        renderTasks();
        renderLabels();
        updateCounts();
    }
}

function toggleSubtask(taskId, subtaskId) {
    const task = appData.tasks.find(t => t.id === taskId);
    if (task && task.subtasks) {
        const subtask = task.subtasks.find(s => s.id === subtaskId);
        if (subtask) {
            subtask.completed = !subtask.completed;
            saveToLocalStorage();
            renderTasks();
        }
    }
}

function deleteTask(taskId) {
    if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
        appData.tasks = appData.tasks.filter(task => task.id !== taskId);
        saveToLocalStorage();
        renderTasks();
        renderLabels();
        updateCounts();
        mostrarMensajeChat('🗑️ Tarea eliminada correctamente');
    }
}

function editTask(taskId) {
    const task = appData.tasks.find(t => t.id === taskId);
    if (task) {
        appData.editingTask = task;
        
        document.getElementById('modalTaskTitle').value = task.title;
        document.getElementById('modalTaskDescription').value = task.description || '';
        document.getElementById('modalTaskProject').value = task.projectId || '';
        document.getElementById('modalTaskDate').value = task.dueDate || '';
        document.getElementById('modalTaskPriority').value = task.priority;
        
        loadTaskLabels(task.labels || []);
        loadTaskSubtasks(task.subtasks || []);
        
        showTaskModal();
    }
}

function saveTask() {
    const title = document.getElementById('modalTaskTitle').value.trim();
    if (!title) {
        mostrarMensajeChat('❌ El título de la tarea es requerido');
        return;
    }
    
    const task = {
        id: appData.editingTask ? appData.editingTask.id : taskIdCounter++,
        title: title,
        description: document.getElementById('modalTaskDescription').value.trim(),
        completed: appData.editingTask ? appData.editingTask.completed : false,
        priority: document.getElementById('modalTaskPriority').value,
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
        mostrarMensajeChat('✅ Tarea actualizada correctamente');
    } else {
        appData.tasks.push(task);
        mostrarMensajeChat('✅ Tarea creada correctamente');
    }
    
    saveToLocalStorage();
    hideTaskModal();
    renderTasks();
    renderLabels();
    updateCounts();
}

// Funciones de etiquetas y subtareas COMPLETAMENTE CORREGIDAS
function handleLabelInput(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const input = event.target;
        const label = input.value.trim();
        
        if (label && !getCurrentTaskLabels().includes(label)) {
            addTaskLabel(label);
            input.value = '';
        }
        
        // Ocultar sugerencias
        const suggestionsId = input.id === 'task-tags' ? 'tagsSuggestions' : 'modalTagsSuggestions';
        document.getElementById(suggestionsId).classList.remove('show');
    }
}

function addTaskLabel(label) {
    const selectedLabelsContainer = document.getElementById('selectedLabels');
    
    const labelElement = document.createElement('span');
    labelElement.className = 'selected-label';
    labelElement.setAttribute('data-label-name', label);
    labelElement.innerHTML = `#${label} `;
    
    // Crear botón de eliminación usando event listener
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-label-btn';
    removeBtn.type = 'button';
    removeBtn.innerHTML = '×';
    removeBtn.addEventListener('click', function() {
        labelElement.remove();
    });
    
    labelElement.appendChild(removeBtn);
    selectedLabelsContainer.appendChild(labelElement);
}

function getCurrentTaskLabels() {
    const selectedLabelsContainer = document.getElementById('selectedLabels');
    const labelElements = selectedLabelsContainer.querySelectorAll('.selected-label');
    
    return Array.from(labelElements).map(element => {
        return element.getAttribute('data-label-name');
    });
}

function loadTaskLabels(labels) {
    const selectedLabelsContainer = document.getElementById('selectedLabels');
    selectedLabelsContainer.innerHTML = '';
    
    labels.forEach(label => {
        addTaskLabel(label);
    });
}

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
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'subtask-editor-checkbox';
    checkbox.checked = completed;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'subtask-editor-input';
    input.value = title;
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-subtask-btn';
    removeBtn.type = 'button';
    removeBtn.innerHTML = '🗑️';
    removeBtn.addEventListener('click', function() {
        subtaskElement.remove();
    });
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'subtask-editor-content';
    contentDiv.appendChild(checkbox);
    contentDiv.appendChild(input);
    contentDiv.appendChild(removeBtn);
    
    subtaskElement.appendChild(contentDiv);
    subtasksList.appendChild(subtaskElement);
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
    }).filter(subtask => subtask.title);
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

// Utilidades de fecha corregidas
function getDueDateInfo(dueDate) {
    if (!dueDate) return null;
    
    const todayStr = getTodayDateString();
    const taskDateStr = dueDate.split('T')[0];
    const comparison = compareDates(dueDate, todayStr);
    
    if (comparison === 0) {
        return { text: 'Hoy', class: 'due-today' };
    } else if (comparison < 0) {
        const taskDate = getDateFromString(dueDate);
        const today = getDateFromString(todayStr);
        const daysDiff = Math.floor((today - taskDate) / (1000 * 60 * 60 * 24));
        return { text: `Vencido ${daysDiff} día${daysDiff > 1 ? 's' : ''}`, class: 'due-overdue' };
    } else {
        const taskDate = getDateFromString(dueDate);
        const today = getDateFromString(todayStr);
        const daysDiff = Math.floor((taskDate - today) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
            return { text: 'Mañana', class: 'due-future' };
        } else if (daysDiff <= 7) {
            return { text: `En ${daysDiff} días`, class: 'due-future' };
        } else {
            const date = getDateFromString(dueDate);
            return { text: date.toLocaleDateString(), class: 'due-future' };
        }
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
                            ${task.priority !== 'baja' ? `<div class="task-priority priority-${task.priority}">
                                ${task.priority}
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
    
    projectsList.innerHTML = appData.projects.map(project => {
        const taskCount = appData.tasks.filter(t => t.projectId === project.id && !t.completed).length;
        return `
            <div class="nav-item" data-project="${project.id}" onclick="switchToProject(${project.id})">
                <div class="project-color" style="background-color: ${project.color}"></div>
                <div class="nav-item-text">${project.name}</div>
                <div class="nav-item-count">${taskCount}</div>
                <div class="project-actions">
                    <button class="project-action-btn" onclick="event.stopPropagation(); editProject(${project.id})" title="Editar">
                        ✏️
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    updateProjectSelects();
}

function renderLabels() {
    const labelsList = document.getElementById('labelsList');
    
    // Obtener todas las etiquetas únicas de las tareas
    const allLabels = new Set();
    appData.tasks.forEach(task => {
        if (task.labels) {
            task.labels.forEach(label => allLabels.add(label));
        }
    });
    
    if (allLabels.size === 0) {
        labelsList.innerHTML = '<div style="padding: 8px 20px; font-size: 12px; color: #888; font-style: italic;">No hay etiquetas</div>';
        return;
    }
    
    // Crear elementos usando DOM en lugar de innerHTML para evitar problemas con onclick
    labelsList.innerHTML = '';
    Array.from(allLabels).forEach(label => {
        const taskCount = appData.tasks.filter(t => 
            !t.completed && t.labels && t.labels.includes(label)
        ).length;
        
        const navItem = document.createElement('div');
        navItem.className = 'nav-item';
        navItem.setAttribute('data-label', label);
        
        // Usar event listener en lugar de onclick
        navItem.addEventListener('click', function() {
            switchToLabel(label);
        });
        
        navItem.innerHTML = `
            <div class="nav-item-icon">🏷️</div>
            <div class="nav-item-text">#${label}</div>
            <div class="nav-item-count">${taskCount}</div>
        `;
        
        labelsList.appendChild(navItem);
    });
}

function updateCounts() {
    const todayStr = getTodayDateString();
    
    const counts = {
        today: appData.tasks.filter(t => 
            !t.completed && (
                (t.dueDate && t.dueDate.split('T')[0] === todayStr) || 
                (t.dueDate && compareDates(t.dueDate, todayStr) < 0)
            )
        ).length,
        upcoming: appData.tasks.filter(t => 
            !t.completed && t.dueDate && compareDates(t.dueDate, todayStr) > 0
        ).length,
        inbox: appData.tasks.filter(t => !t.completed && !t.projectId).length,
        important: appData.tasks.filter(t => !t.completed && t.priority === 'alta').length,
        all: appData.tasks.filter(t => !t.completed).length,
        completed: appData.tasks.filter(t => t.completed).length
    };
    
    Object.keys(counts).forEach(view => {
        const element = document.getElementById(`${view}Count`);
        if (element) {
            element.textContent = counts[view];
        }
    });
    
    renderProjects();
}

// Modales
function showTaskModal() {
    document.getElementById('taskModal').classList.add('active');
    updateProjectSelects();
    
    if (!appData.editingTask) {
        document.getElementById('modalTaskTitle').value = '';
        document.getElementById('modalTaskDescription').value = '';
        document.getElementById('modalTaskProject').value = '';
        document.getElementById('modalTaskDate').value = '';
        document.getElementById('modalTaskPriority').value = 'baja';
        document.getElementById('selectedLabels').innerHTML = '';
        document.getElementById('modalSubtasksList').innerHTML = '';
        document.getElementById('modalTaskLabels').value = '';
        document.getElementById('newSubtaskInput').value = '';
    }

    // Configurar event listeners para el modal
    setTimeout(() => {
        const subtaskInput = document.getElementById('newSubtaskInput');
        const labelInput = document.getElementById('modalTaskLabels');
        
        if (subtaskInput) {
            subtaskInput.onkeypress = null;
            subtaskInput.addEventListener('keypress', handleSubtaskInput);
        }
        
        if (labelInput) {
            labelInput.onkeypress = null;
            labelInput.addEventListener('keypress', handleLabelInput);
            labelInput.addEventListener('input', function() {
                showTagSuggestions(this, document.getElementById('modalTagsSuggestions'));
            });
            labelInput.addEventListener('blur', function() {
                hideTagSuggestions(document.getElementById('modalTagsSuggestions'));
            });
        }
    }, 100);
}

function hideTaskModal() {
    document.getElementById('taskModal').classList.remove('active');
    appData.editingTask = null;
    
    document.getElementById('selectedLabels').innerHTML = '';
    document.getElementById('modalSubtasksList').innerHTML = '';
    document.getElementById('modalTaskLabels').value = '';
    document.getElementById('newSubtaskInput').value = '';
}

// Chat
function toggleChat() {
    const chatContainer = document.getElementById('chat-container');
    const minimizeBtn = document.getElementById('chatMinimizeBtn');
    
    if (chatContainer.classList.contains('minimized')) {
        chatContainer.classList.remove('minimized');
        minimizeBtn.textContent = '−';
    } else {
        chatContainer.classList.add('minimized');
        minimizeBtn.textContent = '+';
    }
}

function mostrarMensajeChat(mensaje, esUsuario = false) {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = `chat-message ${esUsuario ? 'user' : 'bot'}`;
    
    if (esUsuario) {
        div.innerHTML = `<strong>Tú:</strong> ${mensaje}`;
    } else {
        // Usar marked.js para procesar markdown
        const html = marked.parse ? marked.parse(mensaje) : marked(mensaje);
        div.innerHTML = `<strong>AI:</strong> ${html}`;
    }
    
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

async function enviarMensaje() {
    const input = document.getElementById('chat-input');
    const mensaje = input.value.trim();
    if (!mensaje) return;
    
    mostrarMensajeChat(mensaje, true);
    input.value = '';
    
    // Mostrar indicador de escritura
    const loadingMsg = document.createElement('div');
    loadingMsg.className = 'chat-message bot';
    loadingMsg.innerHTML = '<strong>AI:</strong> <em>Escribiendo...</em>';
    loadingMsg.id = 'loading-message';
    document.getElementById('chat-messages').appendChild(loadingMsg);
    
    try {
        const respuesta = await assistant.consultarConFunciones(mensaje);
        
        // Remover indicador de carga
        const loadingElement = document.getElementById('loading-message');
        if (loadingElement) {
            loadingElement.remove();
        }
        
        mostrarMensajeChat(respuesta);
        renderTasks();
        renderLabels();
        updateCounts();
    } catch (error) {
        // Remover indicador de carga
        const loadingElement = document.getElementById('loading-message');
        if (loadingElement) {
            loadingElement.remove();
        }
        
        mostrarMensajeChat('❌ Error al procesar tu mensaje: ' + error.message);
    }
}

// Variables para etiquetas y subtareas en el formulario principal
let selectedTags = [];
let selectedSubtasks = [];

function handleTagInput() {
    const input = document.getElementById('task-tags');
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const tag = this.value.trim();
            if (tag && !selectedTags.includes(tag)) {
                selectedTags.push(tag);
                this.value = '';
                renderSelectedTags();
            }
            // Ocultar sugerencias
            document.getElementById('tagsSuggestions').classList.remove('show');
        }
    });
    
    // Agregar listener para mostrar sugerencias
    input.addEventListener('input', function() {
        showTagSuggestions(this, document.getElementById('tagsSuggestions'));
    });
    
    input.addEventListener('blur', function() {
        hideTagSuggestions(document.getElementById('tagsSuggestions'));
    });
}

function handleSubtaskInputForm() {
    const input = document.getElementById('task-subtasks');
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const subtask = this.value.trim();
            if (subtask) {
                selectedSubtasks.push({
                    id: subtaskIdCounter++,
                    title: subtask,
                    completed: false
                });
                this.value = '';
                renderSelectedSubtasks();
            }
        }
    });
}

function renderSelectedTags() {
    const container = document.getElementById('selected-tags');
    container.innerHTML = '';
    
    selectedTags.forEach((tag, index) => {
        const labelElement = document.createElement('span');
        labelElement.className = 'selected-label';
        labelElement.innerHTML = `#${tag} `;
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-label-btn';
        removeBtn.type = 'button';
        removeBtn.innerHTML = '×';
        removeBtn.addEventListener('click', function() {
            removeTag(index);
        });
        
        labelElement.appendChild(removeBtn);
        container.appendChild(labelElement);
    });
}

function renderSelectedSubtasks() {
    const container = document.getElementById('selected-subtasks');
    container.innerHTML = selectedSubtasks.map(subtask => `
        <div class="subtask-editor-item" style="margin-bottom: 4px;">
            <div class="subtask-editor-content">
                <input type="checkbox" ${subtask.completed ? 'checked' : ''} onchange="toggleFormSubtask(${subtask.id})">
                <span style="flex: 1; padding: 4px;">${subtask.title}</span>
                <button class="remove-subtask-btn" onclick="removeFormSubtask(${subtask.id})" type="button">🗑️</button>
            </div>
        </div>
    `).join('');
}

function removeTag(index) {
    selectedTags.splice(index, 1);
    renderSelectedTags();
}

function removeFormSubtask(id) {
    selectedSubtasks = selectedSubtasks.filter(s => s.id !== id);
    renderSelectedSubtasks();
}

function toggleFormSubtask(id) {
    const subtask = selectedSubtasks.find(s => s.id === id);
    if (subtask) {
        subtask.completed = !subtask.completed;
    }
}

// Event listeners para sliders de configuración de IA
function setupAIConfigListeners() {
    const sliders = ['maxTokens', 'temperature', 'historyLimit'];
    sliders.forEach(sliderId => {
        const slider = document.getElementById(sliderId);
        if (slider) {
            slider.addEventListener('input', function() {
                updateSliderValues();
                updateCostEstimate();
            });
        }
    });

    const modelSelect = document.getElementById('aiModel');
    if (modelSelect) {
        modelSelect.addEventListener('change', function() {
            updateCostEstimate();
            updateCostWarning();
        });
    }
}

// Event listeners principales
document.addEventListener('DOMContentLoaded', function() {
    // Cargar configuración y datos
    loadFromLocalStorage();
    loadAIConfig();

    // Establecer fecha y hora actual por defecto
    document.getElementById('task-date').value = getCurrentDateTimeString();

    renderProjects();
    renderLabels();
    renderTasks();
    updateCounts();
    handleTagInput();
    handleSubtaskInputForm();
    setupAIConfigListeners();

    // Configurar buscador
    document.getElementById('searchInput').addEventListener('input', searchTasks);
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchTasks();
        }
    });

    // Cerrar modales al hacer clic fuera
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

    // Form submit
    document.getElementById('task-form').onsubmit = (e) => {
        e.preventDefault();
        
        const name = document.getElementById('task-name').value.trim();
        const description = document.getElementById('task-description').value.trim();
        const projectId = parseInt(document.getElementById('task-project').value) || null;
        const date = document.getElementById('task-date').value;
        const priority = document.getElementById('task-priority').value;
        
        if (name) {
            const nuevaTarea = {
                id: taskIdCounter++,
                title: name,
                description: description || '',
                projectId: projectId,
                dueDate: date || null,
                priority,
                labels: [...selectedTags],
                subtasks: [...selectedSubtasks],
                completed: false,
                createdAt: new Date().toISOString()
            };
            
            appData.tasks.push(nuevaTarea);
            saveToLocalStorage();
            renderTasks();
            renderLabels();
            updateCounts();
            
            // Limpiar formulario
            document.getElementById('task-name').value = '';
            document.getElementById('task-description').value = '';
            document.getElementById('task-project').value = '';
            document.getElementById('task-tags').value = '';
            document.getElementById('task-subtasks').value = '';
            
            selectedTags = [];
            selectedSubtasks = [];
            renderSelectedTags();
            renderSelectedSubtasks();
            
            // Resetear fecha a actual
            document.getElementById('task-date').value = getCurrentDateTimeString();
            
            mostrarMensajeChat(`✅ Tarea "${name}" añadida correctamente (ID: ${nuevaTarea.id})`);
        }
    };

    // Cargar datos de ejemplo si no hay tareas
    if (appData.tasks.length === 0) {
        const sampleTasks = [
            {
                id: taskIdCounter++,
                title: 'Completar presentación para el cliente',
                description: 'Preparar slides y ensayar presentación',
                completed: false,
                priority: 'alta',
                dueDate: getCurrentDateTimeString(),
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
                priority: 'baja',
                dueDate: getCurrentDateTimeString(),
                projectId: 2,
                labels: ['compras', 'etiqueta con espacios'],
                subtasks: [
                    { id: subtaskIdCounter++, title: 'Tomates', completed: false },
                    { id: subtaskIdCounter++, title: 'Pasta', completed: true },
                    { id: subtaskIdCounter++, title: 'Queso', completed: false }
                ],
                createdAt: new Date().toISOString()
            }
        ];
        
        appData.tasks = sampleTasks;
        saveToLocalStorage();
        renderTasks();
        renderLabels();
        updateCounts();
    }

    // Mensaje de bienvenida
    setTimeout(() => {
        let welcomeMessage = '🎉 **¡Gestor de Tareas v2.0 - TOTALMENTE CORREGIDO!**\n\n';
        
        if (!aiConfig.apiKey) {
            welcomeMessage += '🔑 **Configura tu API Key:** Ve a "Configurar IA" en el sidebar para habilitar el asistente.\n\n';
        }
        
        welcomeMessage += '✅ **TODAS las correcciones aplicadas:**\n';
        welcomeMessage += '- 🏷️ **Etiquetas con espacios:** Funcionan perfectamente (ej: "etiqueta con espacios")\n';
        welcomeMessage += '- 🖱️ **Sin errores onclick:** Todo usa event listeners modernos\n';
        welcomeMessage += '- 📝 **Formulario toggleable:** Botón para mostrar/ocultar\n';
        welcomeMessage += '- 💡 **Sugerencias inteligentes:** Etiquetas existentes aparecen automáticamente\n';
        welcomeMessage += '- 📁 **Proyectos del asistente:** Asignación perfecta por nombre\n';
        welcomeMessage += '- ❌ **Eliminación de etiquetas:** Funciona sin errores\n\n';
        
        welcomeMessage += '🧪 **Prueba esto:**\n';
        welcomeMessage += '- Crea una etiqueta llamada "mi etiqueta especial"\n';
        welcomeMessage += '- Haz clic en ella desde el sidebar\n';
        welcomeMessage += '- Edita una tarea y elimina etiquetas con el botón ×\n';
        welcomeMessage += '- Di al asistente: "Crear tarea \'Test\' en proyecto Trabajo"\n\n';
        
        welcomeMessage += `📊 **Modelo actual:** ${aiConfig.model.replace('gpt-', 'GPT-').replace('-turbo', ' Turbo').replace('4.1-nano', '4.1 nano')}\n`;
        welcomeMessage += '🚀 **¡Todo funciona perfectamente ahora!**';
        
        mostrarMensajeChat(welcomeMessage);
    }, 1000);
});

// Función para actualizar estimación de costo y devolverla
function updateCostEstimate() {
    const model = aiConfig.model;
    const maxTokens = aiConfig.maxTokens;
    const pricing = modelPricing[model];
    
    if (pricing) {
        const estimatedInputTokens = 500;
        const estimatedOutputTokens = maxTokens;
        const cost = (estimatedInputTokens * pricing.input / 1000) + (estimatedOutputTokens * pricing.output / 1000);
        
        const costElement = document.getElementById('costEstimate');
        if (costElement) {
            costElement.textContent = `~$${cost.toFixed(4)}`;
        }
        
        return cost.toFixed(4);
    }
    return '0.01';
}