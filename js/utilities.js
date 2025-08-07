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

// Modo oscuro
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    window.darkModeEnabled = isDark;
    
    showNotification(isDark ? '🌙 Modo oscuro activado' : '☀️ Modo claro activado');
}