// src/ui/components/Notification.js

class Notification {
  constructor() {
    this.container = document.getElementById('notificationsContainer');
    this.queue = [];
    this.active = null;
  }

  show(text, type = 'info', duration = 2000) {
    // Если есть активное уведомление - добавляем в очередь
    if (this.active) {
      this.queue.push({ text, type, duration });
      return;
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = text;
    
    if (this.container) this.container.appendChild(notification);
    this.active = notification;

    // Анимация появления
    notification.classList.add('slide-in');

    // Таймер исчезновения
    setTimeout(() => {
      this.hide(notification);
    }, duration);
  }

  hide(notification) {
    if (!notification) return;
    
    notification.classList.remove('slide-in');
    notification.classList.add('fade-out');
    
    setTimeout(() => {
      notification.remove();
      this.active = null;
      
      // Показываем следующее из очереди
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        this.show(next.text, next.type, next.duration);
      }
    }, 200);
  }

  clearAll() {
    if (this.container) this.container.innerHTML = '';
    this.queue = [];
    this.active = null;
  }
}

export default Notification;
