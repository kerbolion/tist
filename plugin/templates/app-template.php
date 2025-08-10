<?php
/**
 * Template para la aplicación del Framework Modular
 */

// Evitar acceso directo
if (!defined('ABSPATH')) {
    exit;
}
?>

<div class="app-container">
    <!-- Sidebar -->
    <div class="sidebar" id="sidebar">
        <div class="sidebar-header">
            <div class="user-info">
                <div class="user-avatar"><?php echo strtoupper(substr(wp_get_current_user()->display_name, 0, 1)); ?></div>
                <div>
                    <div style="font-weight: 600; font-size: 14px;"><?php echo wp_get_current_user()->display_name; ?></div>
                    <div style="font-size: 12px; color: #888;">Framework Modular</div>
                </div>
            </div>

            <div class="search-box" style="position: relative; margin-top: 16px;">
                <input type="text" class="search-input" placeholder="Buscar..." id="searchInput" style="width: 100%; padding: 8px 12px 8px 36px; border: 1px solid #e1e1e1; border-radius: 6px; font-size: 14px; background-color: #f8f8f8;">
                <div class="search-icon" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #888;">🔍</div>
            </div>
        </div>

        <nav class="sidebar-nav">
            <!-- Sección de Espacios de Trabajo (Módulos) -->
            <div class="nav-section">
                <div class="nav-section-title">Espacios de Trabajo</div>
                <div id="modulesList">
                    <!-- Los módulos se cargarán dinámicamente -->
                </div>
            </div>

            <!-- Navegación específica del módulo actual -->
            <div id="moduleNavigation">
                <!-- Se cargará dinámicamente según el módulo activo -->
            </div>

            <!-- Configuración Global -->
            <div class="nav-section">
                <div class="nav-section-title">Configuración</div>
                <div class="nav-item" onclick="showGlobalConfigModal()">
                    <div class="nav-item-icon">⚙️</div>
                    <div class="nav-item-text">Configuración Global</div>
                </div>
                <div class="nav-item" onclick="showGlobalDataManagementModal()">
                    <div class="nav-item-icon">💾</div>
                    <div class="nav-item-text">Gestión de Datos</div>
                </div>
            </div>
        </nav>
    </div>

    <!-- Main Content -->
    <div class="main-content">
        <header class="main-header">
            <div style="display: flex; align-items: center; gap: 16px;">
                <button class="mobile-menu-btn" onclick="toggleSidebar()">☰</button>
                <h1 class="main-title" id="mainTitle">Framework Modular</h1>
            </div>
            <div class="header-actions">
                <!-- Selector de Espacio (Módulo) -->
                <div class="space-selector">
                    <select id="spaceSelect" class="space-select" onchange="switchSpace(this.value)">
                        <option value="">Seleccionar Espacio...</option>
                    </select>
                    <button class="space-btn" onclick="showSpaceConfigModal()" title="Configurar Espacios">
                        ⚙️
                    </button>
                </div>

                <!-- Acciones específicas del módulo -->
                <div id="moduleActions">
                    <!-- Se cargarán dinámicamente según el módulo activo -->
                </div>
            </div>
        </header>

        <!-- Contenido del módulo actual -->
        <div class="module-container" id="moduleContainer">
            <!-- Se cargará dinámicamente el contenido del módulo -->
            <div class="welcome-screen">
                <div class="welcome-icon">🚀</div>
                <div class="welcome-title">Bienvenido al Framework Modular</div>
                <div class="welcome-description">Selecciona un espacio de trabajo para comenzar</div>
            </div>
        </div>
    </div>
</div>

<!-- Modal de Configuración Global -->
<div class="modal" id="globalConfigModal">
    <div class="modal-content">
        <div class="modal-header">
            <h2 class="modal-title">⚙️ Configuración Global</h2>
            <button class="modal-close" onclick="hideGlobalConfigModal()">×</button>
        </div>
        <div class="form-group">
            <label class="form-label">Tema</label>
            <select class="form-select" id="globalTheme">
                <option value="light">Claro</option>
                <option value="dark">Oscuro</option>
                <option value="auto">Automático</option>
            </select>
        </div>
        <div class="form-group">
            <label class="form-label">Idioma</label>
            <select class="form-select" id="globalLanguage">
                <option value="es">Español</option>
                <option value="en">English</option>
            </select>
        </div>
        <div class="form-group">
            <button class="btn btn-primary" onclick="saveGlobalConfig()" style="width: 100%;">Guardar Configuración</button>
        </div>
    </div>
</div>

<!-- Modal de Gestión de Datos Global -->
<div class="modal" id="globalDataManagementModal">
    <div class="modal-content" style="max-width: 650px;">
        <div class="modal-header">
            <h2 class="modal-title">💾 Gestión de Datos del Sistema Completo</h2>
            <button class="modal-close" onclick="hideGlobalDataManagementModal()">×</button>
        </div>

        <div class="system-info-box" style="background: #e3f2fd; border: 1px solid #2196f3; border-radius: 6px; padding: 16px; margin-bottom: 20px;">
            <h4 style="margin: 0 0 8px 0; color: #1976d2;">🌐 Gestión Global del Framework</h4>
            <p style="margin: 0; font-size: 14px; color: #1565c0;">
                Esta sección gestiona <strong>TODOS los módulos</strong> del sistema: Tasks, Notes y cualquier otro módulo instalado.
            </p>
        </div>

        <div class="form-group">
            <h3 style="margin-bottom: 12px;">📤 Exportar Sistema Completo</h3>
            <p style="color: #666; margin-bottom: 16px; font-size: 14px;">
                Exporta <strong>todos los datos de todos los módulos</strong> (Tasks + Notes + configuración global) en un solo archivo.
            </p>
            <div class="data-actions">
                <button class="btn btn-primary" onclick="exportAllData()" style="background: #4caf50;">
                    📦 Exportar Sistema Completo
                </button>
                <button class="btn btn-secondary" onclick="exportCurrentSpace()">
                    📋 Solo Módulo Actual
                </button>
            </div>
        </div>

        <div class="form-group">
            <h3 style="margin-bottom: 12px;">📥 Importar Sistema Completo</h3>
            <p style="color: #666; margin-bottom: 16px; font-size: 14px;">
                Importa un backup completo del sistema. <strong>⚠️ Advertencia:</strong> Esto reemplazará <strong>TODOS los datos de TODOS los módulos</strong>.
            </p>
            <input type="file" id="importFileInput" accept=".json" style="margin-bottom: 16px;" />
            <div class="data-actions">
                <button class="btn btn-primary" onclick="importData()" style="background: #ff9800;">
                    📥 Importar Sistema Completo
                </button>
                <button class="btn btn-danger" onclick="clearAllData()">
                    🗑️ Eliminar Todo el Sistema
                </button>
            </div>
        </div>

        <div class="warning-box" style="background: #fff3e0; border: 1px solid #ff9800;">
            <h4 style="color: #f57c00;">⚠️ Diferencias Importantes</h4>
            <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 14px; color: #ef6c00;">
                <li><strong>Gestión Global:</strong> Maneja TODOS los módulos (Tasks + Notes + otros)</li>
                <li><strong>Gestión Individual:</strong> Cada módulo tiene su propia gestión de datos</li>
                <li><strong>Backup Completo:</strong> Usa esta opción para respaldar todo el sistema</li>
                <li><strong>Backup Específico:</strong> Usa la gestión individual de cada módulo</li>
            </ul>
        </div>
    </div>
</div>

<!-- Modal de Configuración de Espacios -->
<div class="modal" id="spaceConfigModal">
    <div class="modal-content">
        <div class="modal-header">
            <h2 class="modal-title">🏢 Configuración de Espacios</h2>
            <button class="modal-close" onclick="hideSpaceConfigModal()">×</button>
        </div>
        
        <div class="form-group">
            <h3 style="margin-bottom: 12px;">📋 Espacios Disponibles</h3>
            <div id="spacesList" class="spaces-list">
                <!-- Los espacios se cargarán dinámicamente -->
            </div>
        </div>

        <div class="form-group">
            <h3 style="margin-bottom: 12px;">📊 Información del Espacio Actual</h3>
            <div class="space-info-card">
                <div class="space-info-item">
                    <strong>Nombre:</strong> <span id="currentSpaceName">-</span>
                </div>
                <div class="space-info-item">
                    <strong>Tipo:</strong> <span id="currentSpaceType">-</span>
                </div>
                <div class="space-info-item">
                    <strong>Estado:</strong> <span id="currentSpaceStatus">-</span>
                </div>
            </div>
        </div>
    </div>
</div>