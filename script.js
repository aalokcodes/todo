// Initialize tasks from localStorage or start with empty arrays
let tasks = JSON.parse(localStorage.getItem('tasks')) || {
    today: [],
    thisWeek: [],
    nextWeek: []
};

// Function to save tasks to localStorage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    updateTaskCounts();
}

// Function to format date
function formatDate(date) {
    if (!date) return '';
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(date).toLocaleDateString('en-US', options);
}

// Function to update task counts with animation
function updateTaskCounts() {
    ['today', 'thisWeek', 'nextWeek'].forEach(category => {
        const totalTasks = tasks[category].length;
        const completedTasks = tasks[category].filter(t => t.completed).length;
        const countElement = document.getElementById(`${category}-count`);
        
        // Animate count change
        const currentCount = countElement.textContent.split('/')[0];
        if (currentCount !== completedTasks.toString()) {
            countElement.style.transform = 'scale(1.2)';
            setTimeout(() => {
                countElement.textContent = `${completedTasks}/${totalTasks}`;
                countElement.style.transform = 'scale(1)';
            }, 150);
        } else {
            countElement.textContent = `${completedTasks}/${totalTasks}`;
        }
    });

    // Update function group counts with animation
    document.querySelectorAll('.function-group').forEach(group => {
        const category = group.id.split('-')[0];
        const functionName = group.id.split('-')[1];
        const functionTasks = tasks[category].filter(t => t.function === functionName);
        const totalTasks = functionTasks.length;
        const completedTasks = functionTasks.filter(t => t.completed).length;
        const countElement = group.querySelector('.group-count');
        
        countElement.style.transform = 'scale(1.1)';
        setTimeout(() => {
            countElement.textContent = totalTasks > 0 ? 
                `${completedTasks}/${totalTasks} tasks` : 
                'No tasks';
            countElement.style.transform = 'scale(1)';
        }, 150);
    });
}

// Function to create a task element with enhanced animations
function createTaskElement(task, category) {
    const taskElement = document.createElement('div');
    taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;
    taskElement.setAttribute('data-id', task.id);
    taskElement.setAttribute('draggable', true);
    
    const priorityClass = task.priority || 'medium';
    const priorityIcon = {
        high: '🔴',
        medium: '🟡',
        low: '🟢'
    }[priorityClass];

    taskElement.innerHTML = `
        <div class="task-content">
            <div class="task-name">${task.text}</div>
        </div>
        <div class="task-metadata">
            <div class="metadata-item">
                <div class="task-poc">
                    <i class="fas fa-user"></i>
                    ${task.poc}
                </div>
            </div>
            <div class="metadata-item">
                <div class="task-priority ${priorityClass}">
                    ${priorityIcon} ${task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Medium'}
                </div>
            </div>
            ${task.dueDate ? `
                <div class="metadata-item task-due-date">
                    <i class="far fa-calendar"></i>
                    ${formatDate(task.dueDate)}
                </div>
            ` : ''}
        </div>
        <div class="task-actions">
            <button class="complete" onclick="toggleComplete('${category}', ${task.id})" title="${task.completed ? 'Mark as incomplete' : 'Mark as complete'}">
                <i class="fas ${task.completed ? 'fa-undo' : 'fa-check'}"></i>
            </button>
            <button class="edit" onclick="editTask('${category}', ${task.id})" title="Edit task">
                <i class="fas fa-edit"></i>
            </button>
            <button class="delete" onclick="deleteTask('${category}', ${task.id})" title="Delete task">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

    // Add drag event listeners
    taskElement.addEventListener('dragstart', handleDragStart);
    taskElement.addEventListener('dragend', handleDragEnd);

    // Add entrance animation
    taskElement.style.opacity = '0';
    taskElement.style.transform = 'translateY(10px)';
    setTimeout(() => {
        taskElement.style.opacity = '1';
        taskElement.style.transform = 'translateY(0)';
    }, 50);

    return taskElement;
}

// Function to format function name for display
function formatFunctionName(functionName) {
    return functionName
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase());
}

// Function to render tasks with smooth animations
function renderTasks() {
    for (const category in tasks) {
        const functionGroups = {
            insideSales: [],
            marketing: [],
            performanceMarketing: []
        };

        tasks[category].forEach(task => {
            functionGroups[task.function].push(task);
        });

        for (const functionName in functionGroups) {
            const functionElement = document.querySelector(`#${category}-${functionName} .task-list`);
            if (functionElement) {
                // Remove old tasks with fade-out animation
                const oldTasks = functionElement.children;
                Array.from(oldTasks).forEach((task, index) => {
                    task.style.opacity = '0';
                    task.style.transform = 'translateY(-10px)';
                    setTimeout(() => task.remove(), 200);
                });

                // Add new tasks with fade-in animation
                setTimeout(() => {
                    functionElement.innerHTML = '';
                    functionGroups[functionName].forEach((task, index) => {
                        const taskElement = createTaskElement(task, category);
                        functionElement.appendChild(taskElement);
                    });
                }, 250);
            }
        }
    }
    
    updateTaskCounts();
}

// Function to add a new task with validation and feedback
function addTask() {
    const taskInput = document.getElementById('taskInput');
    const pocInput = document.getElementById('pocInput');
    const taskCategory = document.getElementById('taskCategory');
    const taskFunction = document.getElementById('taskFunction');
    const taskPriority = document.getElementById('taskPriority');
    const dueDate = document.getElementById('dueDate');
    
    if (taskInput.value.trim() === '') {
        showNotification('Please enter a task name', 'error');
        taskInput.focus();
        return;
    }

    if (pocInput.value.trim() === '') {
        showNotification('Please enter a Point of Contact', 'error');
        pocInput.focus();
        return;
    }

    const newTask = {
        id: Date.now(),
        text: taskInput.value.trim(),
        poc: pocInput.value.trim(),
        function: taskFunction.value,
        priority: taskPriority.value,
        dueDate: dueDate.value,
        completed: false
    };

    // Add task with animation
    tasks[taskCategory.value].push(newTask);
    saveTasks();
    renderTasks();
    
    // Clear inputs with animation
    [taskInput, pocInput, dueDate].forEach(input => {
        input.style.transition = 'all 0.2s ease';
        input.style.backgroundColor = 'var(--success-soft)';
        setTimeout(() => {
            input.value = '';
            input.style.backgroundColor = '';
        }, 200);
    });
    
    showNotification('Task added successfully!', 'success');
    taskInput.focus();
}

// Function to toggle task completion with animation
function toggleComplete(category, taskId) {
    const task = tasks[category].find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        
        // Animate completion state
        const taskElement = document.querySelector(`[data-id="${taskId}"]`);
        if (taskElement) {
            taskElement.style.transform = 'scale(0.95)';
            setTimeout(() => {
                taskElement.style.transform = 'scale(1)';
                saveTasks();
                renderTasks();
            }, 150);
        }
        
        showNotification(
            task.completed ? 'Task completed!' : 'Task marked as incomplete',
            'success'
        );
    }
}

// Function to edit a task with improved UI
function editTask(category, taskId) {
    const task = tasks[category].find(t => t.id === taskId);
    if (task) {
        // Create modal-like edit form
        const editForm = document.createElement('div');
        editForm.className = 'edit-form';
        editForm.innerHTML = `
            <div class="edit-form-content">
                <h3>Edit Task</h3>
                <input type="text" id="editTaskInput" value="${task.text}" placeholder="Task name">
                <input type="text" id="editPocInput" value="${task.poc}" placeholder="Point of Contact">
                <input type="date" id="editDueDate" value="${task.dueDate || ''}">
                <select id="editPriority">
                    <option value="high" ${task.priority === 'high' ? 'selected' : ''}>High Priority</option>
                    <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Medium Priority</option>
                    <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low Priority</option>
                </select>
                <div class="edit-form-actions">
                    <button class="cancel-btn">Cancel</button>
                    <button class="save-btn">Save Changes</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(editForm);
        
        // Add event listeners
        const saveBtn = editForm.querySelector('.save-btn');
        const cancelBtn = editForm.querySelector('.cancel-btn');
        
        saveBtn.addEventListener('click', () => {
            const newText = editForm.querySelector('#editTaskInput').value.trim();
            const newPoc = editForm.querySelector('#editPocInput').value.trim();
            const newDueDate = editForm.querySelector('#editDueDate').value;
            const newPriority = editForm.querySelector('#editPriority').value;
            
            if (newText && newPoc) {
                task.text = newText;
                task.poc = newPoc;
                task.dueDate = newDueDate;
                task.priority = newPriority;
                
                editForm.style.opacity = '0';
                setTimeout(() => {
                    editForm.remove();
                    saveTasks();
                    renderTasks();
                    showNotification('Task updated successfully!', 'success');
                }, 200);
            } else {
                showNotification('Please fill in all required fields', 'error');
            }
        });
        
        cancelBtn.addEventListener('click', () => {
            editForm.style.opacity = '0';
            setTimeout(() => editForm.remove(), 200);
        });
        
        // Show form with animation
        setTimeout(() => editForm.style.opacity = '1', 10);
    }
}

// Function to delete a task with confirmation
function deleteTask(category, taskId) {
    const taskElement = document.querySelector(`[data-id="${taskId}"]`);
    if (confirm('Are you sure you want to delete this task?')) {
        // Animate task removal
        taskElement.style.transform = 'scale(0.9)';
        taskElement.style.opacity = '0';
        
        setTimeout(() => {
            tasks[category] = tasks[category].filter(t => t.id !== taskId);
            saveTasks();
            renderTasks();
            showNotification('Task deleted successfully!', 'success');
        }, 200);
    }
}

// Enhanced notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    requestAnimationFrame(() => {
        notification.classList.add('show');
    });
    
    // Remove after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Enhanced drag and drop functionality
function handleDragStart(e) {
    e.target.classList.add('dragging');
    e.dataTransfer.setData('text/plain', JSON.stringify({
        id: e.target.getAttribute('data-id'),
        category: e.target.closest('.task-section').getAttribute('data-category'),
        function: e.target.closest('.function-group').querySelector('.task-list').getAttribute('data-function')
    }));
    
    // Add visual feedback
    e.target.style.opacity = '0.6';
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    e.target.style.opacity = '1';
}

// Initialize the app with enhanced sortable options
document.addEventListener('DOMContentLoaded', () => {
    renderTasks();
    
    // Initialize Sortable for all task lists
    document.querySelectorAll('.task-list').forEach(list => {
        new Sortable(list, {
            group: 'shared',
            animation: 150,
            ghostClass: 'dragging',
            dragClass: 'dragging',
            chosenClass: 'dragging',
            dragoverBubble: true,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            onStart: function(evt) {
                document.body.classList.add('dragging');
            },
            onEnd: function(evt) {
                document.body.classList.remove('dragging');
                const taskId = evt.item.getAttribute('data-id');
                const oldCategory = evt.from.closest('.task-section').getAttribute('data-category');
                const newCategory = evt.to.closest('.task-section').getAttribute('data-category');
                const newFunction = evt.to.getAttribute('data-function');
                
                if (oldCategory !== newCategory || evt.oldIndex !== evt.newIndex) {
                    const task = tasks[oldCategory].find(t => t.id === parseInt(taskId));
                    if (task) {
                        // Remove from old category
                        tasks[oldCategory] = tasks[oldCategory].filter(t => t.id !== parseInt(taskId));
                        
                        // Add to new category
                        task.function = newFunction;
                        tasks[newCategory].push(task);
                        
                        saveTasks();
                        renderTasks();
                        showNotification('Task moved successfully!', 'success');
                    }
                }
            }
        });
    });
});

// Enhanced keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Add task on Cmd/Ctrl + Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        addTask();
    }
});

// Add keyboard navigation between form fields
document.getElementById('taskInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('pocInput').focus();
    }
});

document.getElementById('pocInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        addTask();
    }
}); 