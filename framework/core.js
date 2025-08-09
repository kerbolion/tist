// ===== FRAMEWORK MODULAR - CORE SYSTEM =====

class ModularFramework {
    constructor() {
        this.modules = new Map();
        this.currentModule = null;
        this.data = this.loadGlobalData();
        this.init();
    }

    // ===== INICIALIZACIÓN =====
    init() {
        this.setupEventListeners();
        this.registerBuiltInModules();
        this.loadInterface();
        
        // Cargar módulo por defecto si existe
        if (this.data.currentModule && this.modules.has(this.data.currentModule)) {
            this.switchSpace(this.data.currentModule);
        }
        
        console.log('🚀 Framework Modular iniciado correctamente');
    }

    setupEventListeners() {
        // Cerrar modales al hacer clic fuera
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    this.classList.remove('active');
                }
            });
        });

        // Responsive sidebar
        document.addEventListener('click', function(e) {
            if (window.innerWidth <= 768) {
                if (!e.target.closest('.sidebar') && !e.target.closest('.mobile-menu-btn')) {
                    document.getElementById('sidebar').classList.remove('open');
                }
            }
        });
    }

    // ===== GESTIÓN DE MÓDULOS =====
    registerModule(moduleConfig) {
        if (!moduleConfig.id || !moduleConfig.name || !moduleConfig.load) {
            throw new Error('Configuración de módulo inválida');
        }

        this.modules.set(moduleConfig.id, {
            id: moduleConfig.id,
            name: moduleConfig.name,
            icon: moduleConfig.icon || '📋',
            description: moduleConfig.description || '',
            version: moduleConfig.version || '1.0.0',
            load: moduleConfig.load,
            unload: moduleConfig.unload || (() => {}),
            instance: null
        });

        this.updateModulesInterface();
        console.log(`📦 Módulo "${moduleConfig.name}" registrado`);
    }

    registerBuiltInModules() {
        // Registro del módulo de tareas (se cargará dinámicamente)
        this.registerModule({
            id: 'tasks',
            name: 'Tasks',
            icon: '📋',
            description: 'Gestión de tareas y proyectos',
            version: '3.0.0',
            load: () => this.loadTasksModule()
        });

        // Registro del módulo de notas (se cargará dinámicamente)
        this.registerModule({
            id: 'notes',
            name: 'Notes',
            icon: '📝',
            description: 'Gestión de notas y apuntes',
            version: '1.0.0',
            load: () => this.loadNotesModule()
        });
    }

    async loadTasksModule() {
        try {
            // Cargar CSS del módulo
            await this.loadModuleCSS('modules/tasks/tasks.css');
            
            // Cargar JS del módulo
            await this.loadModuleJS('modules/tasks/tasks.js');
            
            // Inicializar el módulo
            if (window.TasksModule) {
                return new window.TasksModule(this);
            } else {
                throw new Error('Módulo de tareas no encontrado');
            }
        } catch (error) {
            console.error('Error cargando módulo de tareas:', error);
            throw error;
        }
    }

    async loadNotesModule() {
        try {
            // Cargar CSS del módulo
            await this.loadModuleCSS('modules/notes/notes.css');
            
            // Cargar JS del módulo
            await this.loadModuleJS('modules/notes/notes.js');
            
            // Inicializar el módulo
            if (window.NotesModule) {
                return new window.NotesModule(this);
            } else {
                throw new Error('Módulo de notas no encontrado');
            }
        } catch (error) {
            console.error('Error cargando módulo de notas:', error);
            throw error;
        }
    }

    async loadModuleCSS(cssPath) {
        return new Promise((resolve, reject) => {
            // Verificar si el CSS ya está cargado
            const existingLink = document.querySelector(`link[href="${cssPath}"]`);
            if (existingLink) {
                resolve();
                return;
            }

            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = cssPath;
            link.onload = resolve;
            link.onerror = reject;
            document.head.appendChild(link);
        });
    }

    async loadModuleJS(jsPath) {
        return new Promise((resolve, reject) => {
            // Verificar si el script ya está cargado
            const existingScript = document.querySelector(`script[src="${jsPath}"]`);
            if (existingScript) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = jsPath;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // ===== CAMBIO DE ESPACIOS =====
    async switchSpace(moduleId) {
        if (!this.modules.has(moduleId)) {
            console.error(`Módulo "${moduleId}" no encontrado`);
            return;
        }

        // Descargar módulo actual si existe
        if (this.currentModule) {
            await this.unloadCurrentModule();
        }

        const moduleInfo = this.modules.get(moduleId);
        
        try {
            // Mostrar estado de carga
            this.showLoadingState(`Cargando ${moduleInfo.name}...`);

            // Cargar nuevo módulo
            moduleInfo.instance = await moduleInfo.load();
            
            this.currentModule = moduleId;
            this.data.currentModule = moduleId;
            this.saveGlobalData();

            // Actualizar interfaz
            this.updateSpaceSelector();
            this.updateMainTitle(moduleInfo.name);
            
            // Ocultar estado de carga
            this.hideLoadingState();

            console.log(`✅ Espacio cambiado a: ${moduleInfo.name}`);
            
        } catch (error) {
            console.error(`Error cargando módulo ${moduleInfo.name}:`, error);
            this.hideLoadingState();
            this.showError(`Error cargando ${moduleInfo.name}: ${error.message}`);
        }
    }

    async unloadCurrentModule() {
        if (this.currentModule && this.modules.has(this.currentModule)) {
            const moduleInfo = this.modules.get(this.currentModule);
            
            if (moduleInfo.instance && moduleInfo.instance.destroy) {
                await moduleInfo.instance.destroy();
            }
            
            if (moduleInfo.unload) {
                await moduleInfo.unload();
            }
            
            moduleInfo.instance = null;
        }
    }

    // ===== GESTIÓN DE DATOS =====
    loadGlobalData() {
        try {
            const savedData = localStorage.getItem('modularFrameworkData');
            if (savedData) {
                return JSON.parse(savedData);
            }
        } catch (error) {
            console.error('Error cargando datos globales:', error);
        }

        // Datos por defecto
        return {
            currentModule: null,
            globalConfig: {
                theme: 'light',
                language: 'es'
            },
            modules: {}
        };
    }

    saveGlobalData() {
        try {
            localStorage.setItem('modularFrameworkData', JSON.stringify(this.data));
        } catch (error) {
            console.error('Error guardando datos globales:', error);
        }
    }

    getModuleData(moduleId) {
        if (!this.data.modules[moduleId]) {
            this.data.modules[moduleId] = {};
        }
        return this.data.modules[moduleId];
    }

    saveModuleData(moduleId, data) {
        this.data.modules[moduleId] = data;
        this.saveGlobalData();
    }

    // ===== INTERFAZ =====
    loadInterface() {
        this.updateModulesInterface();
        this.updateSpaceSelector();
        this.loadGlobalConfig();
    }

    updateModulesInterface() {
        const modulesList = document.getElementById('modulesList');
        modulesList.innerHTML = '';

        this.modules.forEach((moduleInfo, moduleId) => {
            const moduleItem = document.createElement('div');
            moduleItem.className = `nav-item ${moduleId === this.currentModule ? 'active' : ''}`;
            moduleItem.setAttribute('data-module', moduleId);
            
            moduleItem.innerHTML = `
                <div class="nav-item-icon">${moduleInfo.icon}</div>
                <div class="nav-item-text">${moduleInfo.name}</div>
            `;
            
            moduleItem.addEventListener('click', () => {
                this.switchSpace(moduleId);
            });
            
            modulesList.appendChild(moduleItem);
        });
    }

    updateSpaceSelector() {
        const spaceSelect = document.getElementById('spaceSelect');
        spaceSelect.innerHTML = '<option value="">Seleccionar Espacio...</option>';

        this.modules.forEach((moduleInfo, moduleId) => {
            const option = document.createElement('option');
            option.value = moduleId;
            option.textContent = `${moduleInfo.icon} ${moduleInfo.name}`;
            spaceSelect.appendChild(option);
        });

        spaceSelect.value = this.currentModule || '';
    }

    updateMainTitle(title) {
        document.getElementById('mainTitle').textContent = title;
    }

    showLoadingState(message = 'Cargando...') {
        const container = document.getElementById('moduleContainer');
        container.innerHTML = `
            <div class="loading-state">
                <div class="loading-icon"></div>
                <div class="loading-message">${message}</div>
            </div>
        `;
        container.classList.add('loading');
    }

    hideLoadingState() {
        const container = document.getElementById('moduleContainer');
        container.classList.remove('loading');
    }

    showError(message) {
        const container = document.getElementById('moduleContainer');
        container.innerHTML = `
            <div class="error-state">
                <div class="error-icon">❌</div>
                <div class="error-title">Error</div>
                <div class="error-message">${message}</div>
                <button class="btn btn-primary" onclick="location.reload()">Recargar</button>
            </div>
        `;
    }

    // ===== CONFIGURACIÓN GLOBAL =====
    loadGlobalConfig() {
        const theme = this.data.globalConfig.theme || 'light';
        const language = this.data.globalConfig.language || 'es';
        
        document.getElementById('globalTheme').value = theme;
        document.getElementById('globalLanguage').value = language;
        
        this.applyTheme(theme);
    }

    saveGlobalConfig() {
        const theme = document.getElementById('globalTheme').value;
        const language = document.getElementById('globalLanguage').value;
        
        this.data.globalConfig.theme = theme;
        this.data.globalConfig.language = language;
        
        this.saveGlobalData();
        this.applyTheme(theme);
        
        this.showMessage('✅ Configuración global guardada');
    }

    applyTheme(theme) {
        document.body.className = `theme-${theme}`;
    }

    // ===== GESTIÓN DE DATOS GLOBAL =====
    exportAllData() {
        // Recopilar datos de todos los módulos
        const allModulesData = {};
        
        // Obtener datos de cada módulo registrado
        Object.keys(this.data.modules).forEach(moduleId => {
            allModulesData[moduleId] = this.data.modules[moduleId];
        });

        const exportData = {
            // Datos del framework
            framework: {
                currentModule: this.data.currentModule,
                globalConfig: this.data.globalConfig
            },
            // Datos de todos los módulos
            modules: allModulesData,
            // Metadatos de exportación
            exportDate: new Date().toISOString(),
            frameworkVersion: '1.0.0',
            exportType: 'complete-system'
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `sistema-completo-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        this.showMessage('📤 Sistema completo exportado correctamente (todos los módulos)');
    }

    exportCurrentSpace() {
        if (!this.currentModule) {
            this.showMessage('❌ No hay espacio activo para exportar');
            return;
        }

        const moduleInfo = this.modules.get(this.currentModule);
        const moduleData = this.getModuleData(this.currentModule);
        
        const exportData = {
            module: this.currentModule,
            moduleName: moduleInfo.name,
            data: moduleData,
            exportDate: new Date().toISOString()
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.currentModule}-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        this.showMessage(`📤 Datos de ${moduleInfo.name} exportados`);
    }

    importData() {
        const fileInput = document.getElementById('importFileInput');
        const file = fileInput.files[0];

        if (!file) {
            this.showMessage('❌ Selecciona un archivo para importar');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (!confirm('⚠️ ¿Estás seguro? Esto reemplazará TODOS los datos del sistema (todos los módulos).')) {
                    return;
                }

                // Verificar si es una exportación completa del sistema
                if (importedData.exportType === 'complete-system' && importedData.frameworkVersion) {
                    // Importación completa del sistema
                    this.data = {
                        currentModule: importedData.framework.currentModule,
                        globalConfig: importedData.framework.globalConfig,
                        modules: importedData.modules
                    };
                    
                    this.saveGlobalData();
                    this.showMessage('✅ Sistema completo importado correctamente');
                    setTimeout(() => location.reload(), 1500);
                    
                } else if (importedData.frameworkVersion) {
                    // Importación de formato anterior (compatibilidad)
                    this.data = { ...this.data, ...importedData };
                    this.saveGlobalData();
                    this.showMessage('✅ Datos del framework importados');
                    setTimeout(() => location.reload(), 1000);
                    
                } else if (importedData.module) {
                    // Importación de módulo específico
                    this.data.modules[importedData.module] = importedData.data;
                    this.saveGlobalData();
                    this.showMessage(`✅ Datos de ${importedData.moduleName} importados`);
                    
                } else {
                    this.showMessage('❌ Formato de archivo no válido');
                }

            } catch (error) {
                console.error('Error importando datos:', error);
                this.showMessage('❌ Error al importar: Archivo inválido');
            }
        };

        reader.readAsText(file);
    }

    clearAllData() {
        if (!confirm('⚠️ ¿Estás COMPLETAMENTE seguro? Esto eliminará TODOS los datos.')) {
            return;
        }

        if (!confirm('⚠️ ÚLTIMA CONFIRMACIÓN: Se eliminarán todos los datos. ¿Continuar?')) {
            return;
        }

        // Descargar módulo actual antes de limpiar
        if (this.currentModule) {
            this.unloadCurrentModule();
        }

        // Limpiar localStorage completamente
        localStorage.clear();
        
        // Reinicializar datos del framework
        this.data = {
            currentModule: null,
            globalConfig: {
                theme: 'light',
                language: 'es'
            },
            modules: {}
        };
        
        // Resetear estado del framework
        this.currentModule = null;
        
        // Actualizar interfaz
        this.updateModulesInterface();
        this.updateSpaceSelector();
        this.updateMainTitle('Framework Modular');
        
        // Limpiar contenedor principal
        const container = document.getElementById('moduleContainer');
        container.innerHTML = `
            <div class="welcome-state">
                <div class="welcome-icon">🚀</div>
                <div class="welcome-title">¡Bienvenido al Framework Modular!</div>
                <div class="welcome-description">Selecciona un espacio de trabajo para comenzar</div>
            </div>
        `;
        
        // Limpiar navegación y acciones del módulo
        document.getElementById('moduleNavigation').innerHTML = '';
        document.getElementById('moduleActions').innerHTML = '';
        
        this.showMessage('🗑️ Todos los datos han sido eliminados correctamente');
    }

    // ===== UTILIDADES =====
    showMessage(message) {
        // Crear un sistema simple de notificaciones
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // ===== API PÚBLICA PARA MÓDULOS =====
    getFrameworkAPI() {
        return {
            // Gestión de datos
            getModuleData: (moduleId) => this.getModuleData(moduleId),
            saveModuleData: (moduleId, data) => this.saveModuleData(moduleId, data),
            
            // UI
            updateMainTitle: (title) => this.updateMainTitle(title),
            showMessage: (message) => this.showMessage(message),
            showLoadingState: (message) => this.showLoadingState(message),
            hideLoadingState: () => this.hideLoadingState(),
            
            // Navegación
            updateModuleNavigation: (html) => {
                document.getElementById('moduleNavigation').innerHTML = html;
            },
            updateModuleActions: (html) => {
                document.getElementById('moduleActions').innerHTML = html;
            },
            updateModuleContainer: (html) => {
                document.getElementById('moduleContainer').innerHTML = html;
            },
            
            // Configuración
            getGlobalConfig: () => this.data.globalConfig,
            
            // Módulo actual
            getCurrentModule: () => this.currentModule
        };
    }
}

// ===== FUNCIONES GLOBALES =====
let framework;

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

function switchSpace(moduleId) {
    if (framework && moduleId) {
        framework.switchSpace(moduleId);
    }
}

function showGlobalConfigModal() {
    document.getElementById('globalConfigModal').classList.add('active');
}

function hideGlobalConfigModal() {
    document.getElementById('globalConfigModal').classList.remove('active');
}

function saveGlobalConfig() {
    framework.saveGlobalConfig();
    hideGlobalConfigModal();
}

function showGlobalDataManagementModal() {
    document.getElementById('globalDataManagementModal').classList.add('active');
}

function hideGlobalDataManagementModal() {
    document.getElementById('globalDataManagementModal').classList.remove('active');
}

// Mantener las funciones originales para compatibilidad (pero apuntando a las globales)
function showDataManagementModal() {
    showGlobalDataManagementModal();
}

function hideDataManagementModal() {
    hideGlobalDataManagementModal();
}

function exportAllData() {
    framework.exportAllData();
}

function exportCurrentSpace() {
    framework.exportCurrentSpace();
}

function importData() {
    framework.importData();
}

function clearAllData() {
    framework.clearAllData();
}

function showSpaceConfigModal() {
    document.getElementById('spaceConfigModal').classList.add('active');
    updateSpaceConfigModal();
}

function hideSpaceConfigModal() {
    document.getElementById('spaceConfigModal').classList.remove('active');
}

function updateSpaceConfigModal() {
    if (!framework) return;
    
    const spacesList = document.getElementById('spacesList');
    spacesList.innerHTML = '';
    
    framework.modules.forEach((moduleInfo, moduleId) => {
        const spaceItem = document.createElement('div');
        spaceItem.className = `space-item ${moduleId === framework.currentModule ? 'active' : ''}`;
        
        spaceItem.innerHTML = `
            <div class="space-info">
                <div class="space-icon">${moduleInfo.icon}</div>
                <div class="space-details">
                    <div class="space-name">${moduleInfo.name}</div>
                    <div class="space-description">${moduleInfo.description}</div>
                </div>
            </div>
            <div class="space-actions">
                <button class="space-action-btn" onclick="switchSpace('${moduleId}')" title="Activar">
                    🔄
                </button>
            </div>
        `;
        
        spacesList.appendChild(spaceItem);
    });
    
    // Actualizar información del espacio actual
    if (framework.currentModule) {
        const currentModule = framework.modules.get(framework.currentModule);
        document.getElementById('currentSpaceName').textContent = currentModule.name;
        document.getElementById('currentSpaceType').textContent = currentModule.description;
        document.getElementById('currentSpaceStatus').textContent = 'Activo';
    }
}

// ===== ESTILOS ADICIONALES PARA ESTADOS =====
const additionalStyles = `
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
}

@keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

@keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
}

.loading-state, .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    padding: 40px;
}

.loading-icon::after {
    content: '';
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #db4035;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
}

.loading-message, .error-message {
    font-size: 16px;
    color: #666;
    margin-top: 16px;
}

.error-icon {
    font-size: 48px;
    margin-bottom: 16px;
}

.error-title {
    font-size: 24px;
    font-weight: 600;
    color: #dc2626;
    margin-bottom: 8px;
}

.theme-dark {
    background: #1a1a1a;
    color: #e0e0e0;
}

.theme-dark .sidebar {
    background: #2d2d2d;
    border-color: #404040;
}

.theme-dark .main-header {
    background: #2d2d2d;
    border-color: #404040;
}

.welcome-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    padding: 60px 40px;
    color: #666;
}

.welcome-icon {
    font-size: 64px;
    margin-bottom: 24px;
    opacity: 0.8;
}

.welcome-title {
    font-size: 28px;
    font-weight: 600;
    color: #202124;
    margin-bottom: 12px;
}

.welcome-description {
    font-size: 16px;
    color: #666;
    max-width: 400px;
    line-height: 1.5;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
`;

// Agregar estilos adicionales
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    framework = new ModularFramework();
    
    // Hacer disponible globalmente para debugging
    window.Framework = framework;
    
    console.log('🎯 Framework Modular listo para usar');
});
