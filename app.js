// ==================== Model ====================

class Task {
    constructor(description) {
        this.id = Date.now() + Math.random();
        this.description = description;
        this.completed = false;
        this.createdAt = new Date().toISOString();
    }
}

// ==================== Controller ====================

class TaskManager {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = 'all';
        this.currentSort = null;

        // DOM references
        this.input = document.getElementById('taskInput');
        this.addBtn = document.getElementById('addBtn');
        this.taskListEl = document.getElementById('taskList');
        this.taskCountEl = document.getElementById('taskCount');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.sortBtns = document.querySelectorAll('.sort-btn');

        this.bindEvents();
        this.render();
    }

    // ---------- Persistence (localStorage) ----------

    loadTasks() {
        const data = localStorage.getItem('tasks');
        return data ? JSON.parse(data) : [];
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    // ---------- Event Binding ----------

    bindEvents() {
        this.addBtn.addEventListener('click', () => this.addTask());
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.render();
            });
        });

        this.sortBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentSort = btn.dataset.sort;
                this.render();
            });
        });
    }

    // ---------- CRUD Operations ----------

    addTask() {
        const desc = this.input.value.trim();
        if (!desc) return;
        const task = new Task(desc);
        this.tasks.push(task);
        this.saveTasks();
        this.input.value = '';
        this.input.focus();
        this.render();
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.render();
        }
    }

    deleteTask(id) {
        const li = this.taskListEl.querySelector(`[data-id="${id}"]`);
        if (li) {
            li.classList.add('removing');
            setTimeout(() => {
                this.tasks = this.tasks.filter(t => t.id !== id);
                this.saveTasks();
                this.render();
            }, 350);
        }
    }

    startEdit(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        const li = this.taskListEl.querySelector(`[data-id="${id}"]`);
        const contentDiv = li.querySelector('.task-content');
        const actionsDiv = li.querySelector('.task-actions');

        // Replace content with input
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'edit-input';
        input.value = task.description;
        contentDiv.replaceWith(input);
        input.focus();
        input.select();

        // Replace action buttons
        actionsDiv.innerHTML = `
            <button class="save-btn" title="Save">&#10004;</button>
            <button class="cancel-btn" title="Cancel">&#10060;</button>
        `;

        actionsDiv.querySelector('.save-btn').addEventListener('click', () => this.saveEdit(id, input.value));
        actionsDiv.querySelector('.cancel-btn').addEventListener('click', () => this.render());
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.saveEdit(id, input.value);
            if (e.key === 'Escape') this.render();
        });
    }

    saveEdit(id, newDesc) {
        const desc = newDesc.trim();
        if (!desc) return;
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.description = desc;
            this.saveTasks();
        }
        this.render();
    }

    // ---------- Filtering & Sorting ----------

    getFilteredTasks() {
        let filtered = [...this.tasks];

        if (this.currentFilter === 'completed') {
            filtered = filtered.filter(t => t.completed);
        } else if (this.currentFilter === 'incomplete') {
            filtered = filtered.filter(t => !t.completed);
        }

        if (this.currentSort === 'alpha') {
            filtered.sort((a, b) => a.description.localeCompare(b.description));
        } else if (this.currentSort === 'time') {
            filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        return filtered;
    }

    // ---------- View (Rendering) ----------

    render() {
        const tasks = this.getFilteredTasks();
        this.taskListEl.innerHTML = '';

        tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-item' + (task.completed ? ' completed' : '');
            li.dataset.id = task.id;

            const toggleIcon = task.completed ? '&#9745;' : '&#9744;';
            const date = new Date(task.createdAt);
            const timestamp = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            li.innerHTML = `
                <button class="toggle-btn" title="Toggle complete">${toggleIcon}</button>
                <div class="task-content">
                    <div class="task-text">${this.escapeHtml(task.description)}</div>
                    <div class="task-timestamp">${timestamp}</div>
                </div>
                <div class="task-actions">
                    <button class="edit-btn" title="Edit">&#9998;</button>
                    <button class="delete-btn" title="Delete">&#128465;</button>
                </div>
            `;

            li.querySelector('.toggle-btn').addEventListener('click', () => this.toggleTask(task.id));
            li.querySelector('.edit-btn').addEventListener('click', () => this.startEdit(task.id));
            li.querySelector('.delete-btn').addEventListener('click', () => this.deleteTask(task.id));

            this.taskListEl.appendChild(li);
        });

        // Update count
        const total = this.tasks.length;
        const done = this.tasks.filter(t => t.completed).length;
        this.taskCountEl.textContent = `${done} of ${total} tasks completed`;
    }

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

// ==================== Initialize ====================

document.addEventListener('DOMContentLoaded', () => {
    new TaskManager();
});
