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