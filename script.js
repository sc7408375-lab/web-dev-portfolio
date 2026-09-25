/**
 * ============================================================================
 * TaskFlow — Smart Task Manager
 * Production-Quality Vanilla JavaScript (ES6+) Application
 * ============================================================================
 */

'use strict';

// ----------------------------------------------------------------------------
// 1. Constants & Configuration
// ----------------------------------------------------------------------------
const STORAGE_KEY_TASKS = 'taskflow_tasks';
const STORAGE_KEY_THEME = 'taskflow_theme';

const DEFAULT_DEMO_TASKS = [
  {
    id: 'demo-task-1',
    title: 'Review frontend architecture & component documentation',
    completed: true,
    createdAt: Date.now() - 3600000 * 26, // Yesterday
    priority: 'high',
    category: 'Work'
  },
  {
    id: 'demo-task-2',
    title: 'Implement accessible keyboard navigation & ARIA attributes',
    completed: true,
    createdAt: Date.now() - 3600000 * 18,
    priority: 'medium',
    category: 'Work'
  },
  {
    id: 'demo-task-3',
    title: 'Prepare presentation slides for upcoming technical interview',
    completed: false,
    createdAt: Date.now() - 3600000 * 6,
    priority: 'high',
    category: 'Study'
  },
  {
    id: 'demo-task-4',
    title: 'Verify cross-browser responsive layout on mobile and desktop',
    completed: false,
    createdAt: Date.now() - 3600000 * 2,
    priority: 'medium',
    category: 'General'
  },
  {
    id: 'demo-task-5',
    title: 'Backup database and verify client-side LocalStorage persistence',
    completed: false,
    createdAt: Date.now() - 1800000,
    priority: 'low',
    category: 'Personal'
  }
];

// ----------------------------------------------------------------------------
// 2. Application State (Single Source of Truth)
// ----------------------------------------------------------------------------
const AppState = {
  tasks: [],
  currentFilter: 'all', // 'all' | 'active' | 'completed'
  searchQuery: '',
  currentSort: 'date-desc', // 'date-desc' | 'date-asc' | 'priority' | 'alpha'
  editingTaskId: null,
  pendingModalAction: null // { type: 'delete' | 'clear-completed', targetId: string | null }
};

// ----------------------------------------------------------------------------
// 3. DOM Elements Cache
// ----------------------------------------------------------------------------
const DOM = {
  // Theme & Date
  themeToggleBtn: document.getElementById('themeToggleBtn'),
  dateText: document.getElementById('dateText'),

  // Creator Form
  addTaskForm: document.getElementById('addTaskForm'),
  taskInput: document.getElementById('taskInput'),
  prioritySelect: document.getElementById('prioritySelect'),
  categorySelect: document.getElementById('categorySelect'),
  clearInputBtn: document.getElementById('clearInputBtn'),
  inputValidationMsg: document.getElementById('inputValidationMsg'),

  // Controls & Filters
  searchInput: document.getElementById('searchInput'),
  clearSearchBtn: document.getElementById('clearSearchBtn'),
  filterTabs: document.querySelectorAll('.filter-tab'),
  sortSelect: document.getElementById('sortSelect'),
  clearCompletedBtn: document.getElementById('clearCompletedBtn'),

  // Counts & Stats
  statTotal: document.getElementById('statTotal'),
  statActive: document.getElementById('statActive'),
  statCompleted: document.getElementById('statCompleted'),
  statRate: document.getElementById('statRate'),
  progressFraction: document.getElementById('progressFraction'),
  progressFill: document.getElementById('progressFill'),
  progressTrack: document.getElementById('progressTrack'),
  countAll: document.getElementById('countAll'),
  countActive: document.getElementById('countActive'),
  countCompleted: document.getElementById('countCompleted'),

  // Task List & Empty State
  taskList: document.getElementById('taskList'),
  listHeading: document.getElementById('listHeading'),
  activeQueryBadge: document.getElementById('activeQueryBadge'),
  emptyState: document.getElementById('emptyState'),
  emptyIconWrapper: document.getElementById('emptyIconWrapper'),
  emptyTitle: document.getElementById('emptyTitle'),
  emptyDescription: document.getElementById('emptyDescription'),

  // Confirmation Modal
  confirmModal: document.getElementById('confirmModal'),
  modalTitle: document.getElementById('modalTitle'),
  modalMessage: document.getElementById('modalMessage'),
  modalCancelBtn: document.getElementById('modalCancelBtn'),
  modalConfirmBtn: document.getElementById('modalConfirmBtn'),

  // Notifications
  toastContainer: document.getElementById('toastContainer'),
  resetDemoBtn: document.getElementById('resetDemoBtn')
};

// ----------------------------------------------------------------------------
// 4. Utility Functions (Security, Formatting, Unique ID)
// ----------------------------------------------------------------------------

/**
 * Generates an RFC4122-compliant unique identifier.
 * Uses native crypto.randomUUID() when available with a robust fallback.
 * @returns {string} Unique ID
 */
function generateUniqueId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'task-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9);
}

/**
 * Escapes potentially unsafe HTML entities to prevent XSS attacks.
 * @param {string} str - Raw string
 * @returns {string} Safe HTML string
 */
function escapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Formats a UNIX timestamp into a human-readable string.
 * @param {number} timestamp 
 * @returns {string} Formatted timestamp
 */
function formatTimestamp(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
  const formattedTime = date.toLocaleTimeString(undefined, timeOptions);

  if (isToday) {
    return `Today at ${formattedTime}`;
  } else if (isYesterday) {
    return `Yesterday at ${formattedTime}`;
  } else {
    const dateOptions = { month: 'short', day: 'numeric' };
    return `${date.toLocaleDateString(undefined, dateOptions)} at ${formattedTime}`;
  }
}

// ----------------------------------------------------------------------------
// 5. Toast Notification System
// ----------------------------------------------------------------------------
/**
 * Displays a non-intrusive floating toast notification.
 * @param {string} message - Notification text
 * @param {'success'|'danger'|'warning'|'info'} [type='info'] - Notification style
 * @param {number} [duration=3000] - Duration in milliseconds
 */
function showToast(message, type = 'info', duration = 3000) {
  if (!DOM.toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'status');

  const icons = {
    success: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
    danger: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
    warning: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
    info: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`
  };

  toast.innerHTML = `
    ${icons[type] || icons.info}
    <span class="toast-message">${escapeHTML(message)}</span>
    <button type="button" class="toast-close" aria-label="Dismiss">&times;</button>
  `;

  DOM.toastContainer.appendChild(toast);

  const dismissToast = () => {
    toast.classList.add('toast-leave');
    setTimeout(() => {
      if (toast.parentElement) {
        toast.parentElement.removeChild(toast);
      }
    }, 200);
  };

  const closeBtn = toast.querySelector('.toast-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', dismissToast);
  }

  const timer = setTimeout(dismissToast, duration);
  toast.addEventListener('mouseenter', () => clearTimeout(timer));
}

// ----------------------------------------------------------------------------
// 6. LocalStorage Data Persistence Layer
// ----------------------------------------------------------------------------
/**
 * Loads tasks from Browser LocalStorage.
 * Handles corrupted, invalid JSON or missing storage safely without crashing.
 */
function loadTasks() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY_TASKS);
    if (!rawData) {
      // First time visiting: Load default interactive demo tasks
      AppState.tasks = [...DEFAULT_DEMO_TASKS];
      saveTasks();
      return;
    }

    const parsed = JSON.parse(rawData);
    if (Array.isArray(parsed)) {
      // Ensure all loaded tasks adhere to data contract
      AppState.tasks = parsed.filter(t => t && typeof t === 'object' && t.id && t.title);
    } else {
      console.warn('LocalStorage data is not an array. Resetting to empty state.');
      AppState.tasks = [];
    }
  } catch (error) {
    console.error('Failed to parse tasks from LocalStorage:', error);
    showToast('Could not load saved tasks (corrupted data). Starting fresh.', 'warning', 4000);
    AppState.tasks = [];
  }
}

/**
 * Saves current tasks array into Browser LocalStorage.
 */
function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(AppState.tasks));
  } catch (error) {
    console.error('Failed to save tasks to LocalStorage:', error);
    showToast('Failed to save to LocalStorage (Storage quota exceeded).', 'danger', 4000);
  }
}

// ----------------------------------------------------------------------------
// 7. Core Task Management Operations (State & Business Logic)
// ----------------------------------------------------------------------------

/**
 * Validates and adds a new task to the state.
 * @param {string} rawTitle - Raw title from input
 * @param {string} priority - Priority ('high'|'medium'|'low')
 * @param {string} category - Category string
 * @returns {boolean} True if task was added, false if validation failed
 */
function addTask(rawTitle, priority = 'medium', category = 'General') {
  const trimmedTitle = (rawTitle || '').trim();

  // Validate non-empty and non-whitespace
  if (!trimmedTitle) {
    showInputValidationError('Please enter a valid task title. Tasks cannot be empty.');
    return false;
  }

  hideInputValidationError();

  const newTask = {
    id: generateUniqueId(),
    title: trimmedTitle,
    completed: false,
    createdAt: Date.now(),
    priority: ['high', 'medium', 'low'].includes(priority) ? priority : 'medium',
    category: category ? category.trim() : 'General'
  };

  // Prepend new task so it appears at top
  AppState.tasks.unshift(newTask);
  saveTasks();
  updateStatistics();
  renderTasks();

  showToast(`Task added: "${trimmedTitle.length > 30 ? trimmedTitle.slice(0, 30) + '...' : trimmedTitle}"`, 'success');
  return true;
}

/**
 * Toggles a task's completed state.
 * @param {string} taskId 
 */
function toggleTask(taskId) {
  const task = AppState.tasks.find(t => t.id === taskId);
  if (!task) return;

  task.completed = !task.completed;
  saveTasks();
  updateStatistics();
  renderTasks();

  if (task.completed) {
    showToast('Task marked as completed!', 'success', 2000);
  }
}

/**
 * Saves edited task details.
 * @param {string} taskId 
 * @param {string} newTitle 
 * @param {string} newPriority 
 * @param {string} newCategory 
 * @returns {boolean} True if saved
 */
function editTask(taskId, newTitle, newPriority, newCategory) {
  const trimmedTitle = (newTitle || '').trim();

  if (!trimmedTitle) {
    showToast('Task title cannot be empty.', 'danger');
    return false;
  }

  const task = AppState.tasks.find(t => t.id === taskId);
  if (!task) return false;

  task.title = trimmedTitle;
  if (newPriority) task.priority = newPriority;
  if (newCategory) task.category = newCategory;

  AppState.editingTaskId = null;
  saveTasks();
  renderTasks();

  showToast('Task updated successfully.', 'success');
  return true;
}

/**
 * Cancels editing mode for the active task.
 */
function cancelEditing() {
  AppState.editingTaskId = null;
  renderTasks();
}

/**
 * Deletes a single task by ID.
 * @param {string} taskId 
 */
function deleteTask(taskId) {
  const index = AppState.tasks.findIndex(t => t.id === taskId);
  if (index === -1) return;

  const [removedTask] = AppState.tasks.splice(index, 1);
  if (AppState.editingTaskId === taskId) {
    AppState.editingTaskId = null;
  }

  saveTasks();
  updateStatistics();
  renderTasks();

  showToast(`Task deleted: "${removedTask.title.slice(0, 25)}..."`, 'info');
}

/**
 * Removes all completed tasks.
 */
function clearCompleted() {
  const initialCount = AppState.tasks.length;
  AppState.tasks = AppState.tasks.filter(t => !t.completed);
  const removedCount = initialCount - AppState.tasks.length;

  saveTasks();
  updateStatistics();
  renderTasks();

  showToast(`Cleared ${removedCount} completed ${removedCount === 1 ? 'task' : 'tasks'}.`, 'info');
}

// ----------------------------------------------------------------------------
// 8. Sorting & Filtering
// ----------------------------------------------------------------------------

/**
 * Changes active task filter status and updates UI.
 * @param {'all'|'active'|'completed'} filterName 
 */
function filterTasks(filterName) {
  if (!['all', 'active', 'completed'].includes(filterName)) return;
  AppState.currentFilter = filterName;

  DOM.filterTabs.forEach(tab => {
    if (tab.getAttribute('data-filter') === filterName) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  renderTasks();
}

/**
 * Returns filtered and sorted tasks based on AppState.
 * @returns {Array<object>} Processed tasks array
 */
function getFilteredAndSortedTasks() {
  // 1. Filter by status
  let result = AppState.tasks.filter(task => {
    if (AppState.currentFilter === 'active') return !task.completed;
    if (AppState.currentFilter === 'completed') return task.completed;
    return true; // 'all'
  });

  // 2. Filter by search query
  if (AppState.searchQuery.trim()) {
    const query = AppState.searchQuery.trim().toLowerCase();
    result = result.filter(task => {
      const matchTitle = task.title.toLowerCase().includes(query);
      const matchCategory = task.category && task.category.toLowerCase().includes(query);
      return matchTitle || matchCategory;
    });
  }

  // 3. Sort tasks
  const priorityWeight = { high: 3, medium: 2, low: 1 };

  result.sort((a, b) => {
    switch (AppState.currentSort) {
      case 'date-asc':
        return (a.createdAt || 0) - (b.createdAt || 0);
      case 'priority': {
        const diff = (priorityWeight[b.priority] || 2) - (priorityWeight[a.priority] || 2);
        return diff !== 0 ? diff : (b.createdAt || 0) - (a.createdAt || 0);
      }
      case 'alpha':
        return a.title.localeCompare(b.title);
      case 'date-desc':
      default:
        return (b.createdAt || 0) - (a.createdAt || 0);
    }
  });

  return result;
}

// ----------------------------------------------------------------------------
// 9. Statistics & Progress Bar
// ----------------------------------------------------------------------------
/**
 * Recalculates metrics and updates DOM counters & visual progress bar.
 */
function updateStatistics() {
  const total = AppState.tasks.length;
  const completed = AppState.tasks.filter(t => t.completed).length;
  const active = total - completed;
  const ratePercentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  // Update Stats Cards
  DOM.statTotal.textContent = total;
  DOM.statActive.textContent = active;
  DOM.statCompleted.textContent = completed;
  DOM.statRate.textContent = `${ratePercentage}%`;

  // Update Filter Nav Tab Counters
  DOM.countAll.textContent = total;
  DOM.countActive.textContent = active;
  DOM.countCompleted.textContent = completed;

  // Update Progress Bar & Fraction
  DOM.progressFraction.textContent = `${completed} of ${total} ${total === 1 ? 'task' : 'tasks'} completed (${ratePercentage}%)`;
  DOM.progressFill.style.width = `${ratePercentage}%`;
  DOM.progressTrack.setAttribute('aria-valuenow', ratePercentage);

  // Enable/Disable "Clear Completed" button gracefully
  if (completed === 0) {
    DOM.clearCompletedBtn.setAttribute('disabled', 'true');
    DOM.clearCompletedBtn.title = 'No completed tasks to clear';
  } else {
    DOM.clearCompletedBtn.removeAttribute('disabled');
    DOM.clearCompletedBtn.title = `Clear ${completed} completed ${completed === 1 ? 'task' : 'tasks'}`;
  }
}

// ----------------------------------------------------------------------------
// 10. DOM Rendering
// ----------------------------------------------------------------------------
/**
 * Renders the task list into the DOM with animations and inline edit states.
 */
function renderTasks() {
  const processedTasks = getFilteredAndSortedTasks();
  DOM.taskList.innerHTML = '';

  // Update header and badge
  const filterNames = { all: 'All Tasks', active: 'Active Tasks', completed: 'Completed Tasks' };
  DOM.listHeading.textContent = filterNames[AppState.currentFilter] || 'Tasks';

  if (AppState.searchQuery.trim()) {
    DOM.activeQueryBadge.style.display = 'inline-block';
    DOM.activeQueryBadge.textContent = `Matching: "${AppState.searchQuery.trim()}" (${processedTasks.length})`;
  } else {
    DOM.activeQueryBadge.style.display = 'none';
  }

  // Handle Empty State
  if (processedTasks.length === 0) {
    renderEmptyState();
    DOM.emptyState.style.display = 'flex';
    return;
  }

  DOM.emptyState.style.display = 'none';

  // Render Task Items
  const fragment = document.createDocumentFragment();

  processedTasks.forEach(task => {
    const isEditing = AppState.editingTaskId === task.id;
    const taskLi = document.createElement('li');
    taskLi.className = `task-item priority-${task.priority || 'medium'} ${task.completed ? 'completed' : ''} ${isEditing ? 'is-editing' : ''}`;
    taskLi.dataset.id = task.id;

    if (isEditing) {
      taskLi.innerHTML = renderInlineEditTemplate(task);
    } else {
      taskLi.innerHTML = renderTaskItemTemplate(task);
    }

    fragment.appendChild(taskLi);
  });

  DOM.taskList.appendChild(fragment);

  // If in edit mode, autofocus the inline input
  if (AppState.editingTaskId) {
    const inlineInput = DOM.taskList.querySelector('.inline-edit-input');
    if (inlineInput) {
      inlineInput.focus();
      inlineInput.select();
    }
  }
}

/**
 * Returns HTML template for standard task item.
 * @param {object} task 
 * @returns {string} HTML string
 */
function renderTaskItemTemplate(task) {
  const safeTitle = escapeHTML(task.title);
  const safeCategory = escapeHTML(task.category || 'General');
  const formattedTime = formatTimestamp(task.createdAt);
  const priorityCapitalized = (task.priority || 'medium').charAt(0).toUpperCase() + (task.priority || 'medium').slice(1);

  return `
    <div class="task-left">
      <input 
        type="checkbox" 
        class="custom-checkbox" 
        ${task.completed ? 'checked' : ''} 
        aria-label="Mark task as ${task.completed ? 'incomplete' : 'completed'}"
        title="${task.completed ? 'Mark incomplete' : 'Mark complete'}"
      />
      <div class="task-details">
        <span class="task-title">${safeTitle}</span>
        <div class="task-meta-bar">
          <span class="meta-badge meta-badge-priority ${task.priority || 'medium'}">
            ${priorityCapitalized}
          </span>
          <span class="meta-badge meta-badge-category">
            ${safeCategory}
          </span>
          <span class="task-timestamp">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            ${formattedTime}
          </span>
        </div>
      </div>
    </div>
    <div class="task-actions">
      <button type="button" class="btn-task-action btn-edit" title="Edit task" aria-label="Edit task: ${safeTitle}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      </button>
      <button type="button" class="btn-task-action btn-delete" title="Delete task" aria-label="Delete task: ${safeTitle}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          <line x1="10" y1="11" x2="10" y2="17"></line>
          <line x1="14" y1="11" x2="14" y2="17"></line>
        </svg>
      </button>
    </div>
  `;
}

/**
 * Returns HTML template for inline editing mode.
 * @param {object} task 
 * @returns {string} HTML string
 */
function renderInlineEditTemplate(task) {
  const safeTitle = escapeHTML(task.title);
  const safeCategory = escapeHTML(task.category || 'General');

  return `
    <form class="inline-edit-form" novalidate>
      <input 
        type="text" 
        class="inline-edit-input" 
        value="${safeTitle}" 
        maxlength="200" 
        placeholder="Edit task title..." 
        required 
      />
      <div class="inline-edit-meta">
        <div class="inline-meta-controls">
          <select class="meta-select inline-edit-priority" title="Select priority">
            <option value="high" ${task.priority === 'high' ? 'selected' : ''}>High Priority</option>
            <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Medium Priority</option>
            <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low Priority</option>
          </select>
          <select class="meta-select inline-edit-category" title="Select category">
            <option value="General" ${safeCategory === 'General' ? 'selected' : ''}>General</option>
            <option value="Work" ${safeCategory === 'Work' ? 'selected' : ''}>Work</option>
            <option value="Personal" ${safeCategory === 'Personal' ? 'selected' : ''}>Personal</option>
            <option value="Urgent" ${safeCategory === 'Urgent' ? 'selected' : ''}>Urgent</option>
            <option value="Study" ${safeCategory === 'Study' ? 'selected' : ''}>Study</option>
          </select>
        </div>
        <div class="inline-edit-buttons">
          <button type="button" class="btn btn-secondary btn-mini btn-inline-cancel">Cancel (Esc)</button>
          <button type="submit" class="btn btn-primary btn-mini btn-inline-save">Save (Enter)</button>
        </div>
      </div>
    </form>
  `;
}

/**
 * Renders tailored empty states according to search query and active filter.
 */
function renderEmptyState() {
  const hasSearch = AppState.searchQuery.trim().length > 0;

  if (hasSearch) {
    DOM.emptyIconWrapper.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        <line x1="8" y1="11" x2="14" y2="11"></line>
      </svg>
    `;
    DOM.emptyTitle.textContent = 'No matching tasks found';
    DOM.emptyDescription.textContent = `No tasks matched your query "${AppState.searchQuery.trim()}". Try checking your spelling or clearing search.`;
    return;
  }

  if (AppState.currentFilter === 'active') {
    DOM.emptyIconWrapper.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
    `;
    DOM.emptyTitle.textContent = 'All caught up!';
    DOM.emptyDescription.textContent = 'You have no pending tasks right now. Great job keeping up with your goals!';
    return;
  }

  if (AppState.currentFilter === 'completed') {
    DOM.emptyIconWrapper.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 14 14"></polyline>
      </svg>
    `;
    DOM.emptyTitle.textContent = 'No completed tasks yet';
    DOM.emptyDescription.textContent = 'Complete tasks by checking them off from the Active or All tasks view.';
    return;
  }

  // All Tasks empty
  DOM.emptyIconWrapper.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
    </svg>
  `;
  DOM.emptyTitle.textContent = 'Your task list is empty';
  DOM.emptyDescription.textContent = 'Add your first task using the input field above, or click "Load Demo Tasks" below.';
}

// ----------------------------------------------------------------------------
// 11. Input Validation UI Helpers
// ----------------------------------------------------------------------------
function showInputValidationError(msg) {
  DOM.inputValidationMsg.innerHTML = `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
    <span>${escapeHTML(msg)}</span>
  `;
  DOM.inputValidationMsg.classList.add('show');
  DOM.taskInput.focus();
}

function hideInputValidationError() {
  DOM.inputValidationMsg.innerHTML = '';
  DOM.inputValidationMsg.classList.remove('show');
}

// ----------------------------------------------------------------------------
// 12. Custom Confirmation Modal Handler
// ----------------------------------------------------------------------------
/**
 * Opens custom confirmation modal.
 * @param {string} title 
 * @param {string} message 
 * @param {object} action - { type: 'delete'|'clear-completed', targetId: string|null }
 */
function openConfirmModal(title, message, action) {
  AppState.pendingModalAction = action;
  DOM.modalTitle.textContent = title;
  DOM.modalMessage.textContent = message;
  DOM.confirmModal.style.display = 'flex';
  DOM.modalConfirmBtn.focus();
}

function closeConfirmModal() {
  DOM.confirmModal.style.display = 'none';
  AppState.pendingModalAction = null;
}

function executePendingModalAction() {
  if (!AppState.pendingModalAction) return;

  const { type, targetId } = AppState.pendingModalAction;

  if (type === 'delete' && targetId) {
    deleteTask(targetId);
  } else if (type === 'clear-completed') {
    clearCompleted();
  }

  closeConfirmModal();
}

// ----------------------------------------------------------------------------
// 13. Theme Management (Light / Dark)
// ----------------------------------------------------------------------------
function initTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEY_THEME);
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const activeTheme = savedTheme || (prefersDark ? 'dark' : 'light');

  document.documentElement.setAttribute('data-theme', activeTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const nextTheme = current === 'dark' ? 'light' : 'dark';

  document.documentElement.setAttribute('data-theme', nextTheme);
  localStorage.setItem(STORAGE_KEY_THEME, nextTheme);

  showToast(`Switched to ${nextTheme} mode`, 'info', 1800);
}

// ----------------------------------------------------------------------------
// 14. Event Listeners Setup
// ----------------------------------------------------------------------------
function attachEventListeners() {
  // Theme Toggle
  DOM.themeToggleBtn.addEventListener('click', toggleTheme);

  // Add Task Form Submission (Enter key or Add Button)
  DOM.addTaskForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const title = DOM.taskInput.value;
    const priority = DOM.prioritySelect.value;
    const category = DOM.categorySelect.value;

    const added = addTask(title, priority, category);
    if (added) {
      DOM.taskInput.value = '';
      DOM.clearInputBtn.style.display = 'none';
      DOM.taskInput.focus();
    }
  });

  // Task Input Input Event (Validation clear & clear button visibility)
  DOM.taskInput.addEventListener('input', () => {
    hideInputValidationError();
    DOM.clearInputBtn.style.display = DOM.taskInput.value.length > 0 ? 'flex' : 'none';
  });

  DOM.clearInputBtn.addEventListener('click', () => {
    DOM.taskInput.value = '';
    DOM.clearInputBtn.style.display = 'none';
    DOM.taskInput.focus();
  });

  // Real-time Search Input
  DOM.searchInput.addEventListener('input', (event) => {
    AppState.searchQuery = event.target.value;
    DOM.clearSearchBtn.style.display = AppState.searchQuery.length > 0 ? 'inline-block' : 'none';
    renderTasks();
  });

  DOM.clearSearchBtn.addEventListener('click', () => {
    DOM.searchInput.value = '';
    AppState.searchQuery = '';
    DOM.clearSearchBtn.style.display = 'none';
    renderTasks();
    DOM.searchInput.focus();
  });

  // Filter Tabs Navigation
  DOM.filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const selectedFilter = tab.getAttribute('data-filter');
      filterTasks(selectedFilter);
    });
  });

  // Sort Select Change
  DOM.sortSelect.addEventListener('change', (event) => {
    AppState.currentSort = event.target.value;
    renderTasks();
  });

  // Clear Completed Tasks Button
  DOM.clearCompletedBtn.addEventListener('click', () => {
    const completedCount = AppState.tasks.filter(t => t.completed).length;
    if (completedCount === 0) {
      showToast('No completed tasks to clear.', 'info');
      return;
    }

    openConfirmModal(
      'Clear Completed Tasks?',
      `Are you sure you want to permanently delete all ${completedCount} completed ${completedCount === 1 ? 'task' : 'tasks'}?`,
      { type: 'clear-completed', targetId: null }
    );
  });

  // Event Delegation for Task List items (Checkbox, Edit, Delete, Save/Cancel Inline)
  DOM.taskList.addEventListener('change', (event) => {
    if (event.target.classList.contains('custom-checkbox')) {
      const taskItem = event.target.closest('.task-item');
      if (taskItem && taskItem.dataset.id) {
        toggleTask(taskItem.dataset.id);
      }
    }
  });

  DOM.taskList.addEventListener('click', (event) => {
    const taskItem = event.target.closest('.task-item');
    if (!taskItem || !taskItem.dataset.id) return;
    const taskId = taskItem.dataset.id;

    // Delete Button Click
    const deleteBtn = event.target.closest('.btn-delete');
    if (deleteBtn) {
      const task = AppState.tasks.find(t => t.id === taskId);
      const title = task ? task.title : 'this task';
      openConfirmModal(
        'Delete Task?',
        `Are you sure you want to delete "${title.slice(0, 35)}${title.length > 35 ? '...' : ''}"? This action cannot be undone.`,
        { type: 'delete', targetId: taskId }
      );
      return;
    }

    // Edit Button Click
    const editBtn = event.target.closest('.btn-edit');
    if (editBtn) {
      AppState.editingTaskId = taskId;
      renderTasks();
      return;
    }

    // Inline Cancel Button Click
    const inlineCancelBtn = event.target.closest('.btn-inline-cancel');
    if (inlineCancelBtn) {
      cancelEditing();
      return;
    }
  });

  // Inline Form Submit & Keydown handler
  DOM.taskList.addEventListener('submit', (event) => {
    const form = event.target.closest('.inline-edit-form');
    if (!form) return;
    event.preventDefault();

    const taskItem = form.closest('.task-item');
    if (!taskItem || !taskItem.dataset.id) return;

    const input = form.querySelector('.inline-edit-input');
    const prioritySelect = form.querySelector('.inline-edit-priority');
    const categorySelect = form.querySelector('.inline-edit-category');

    if (input) {
      editTask(
        taskItem.dataset.id,
        input.value,
        prioritySelect ? prioritySelect.value : null,
        categorySelect ? categorySelect.value : null
      );
    }
  });

  // Escape Key to cancel inline editing
  DOM.taskList.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && AppState.editingTaskId) {
      cancelEditing();
    }
  });

  // Modal Actions
  DOM.modalCancelBtn.addEventListener('click', closeConfirmModal);
  DOM.modalConfirmBtn.addEventListener('click', executePendingModalAction);

  // Close modal when clicking outside backdrop or pressing Escape
  DOM.confirmModal.addEventListener('click', (event) => {
    if (event.target === DOM.confirmModal) {
      closeConfirmModal();
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && DOM.confirmModal.style.display !== 'none') {
      closeConfirmModal();
    }
  });

  // Reset Demo Tasks
  DOM.resetDemoBtn.addEventListener('click', () => {
    AppState.tasks = JSON.parse(JSON.stringify(DEFAULT_DEMO_TASKS));
    saveTasks();
    updateStatistics();
    renderTasks();
    showToast('Loaded demo tasks successfully!', 'success');
  });
}

/**
 * Initializes and formats today's live date in the header.
 */
function initLiveDate() {
  if (!DOM.dateText) return;
  const options = { weekday: 'short', month: 'short', day: 'numeric' };
  DOM.dateText.textContent = new Date().toLocaleDateString(undefined, options);
}

// ----------------------------------------------------------------------------
// 15. Application Bootstrapper
// ----------------------------------------------------------------------------
function initApp() {
  initTheme();
  initLiveDate();
  loadTasks();
  attachEventListeners();
  updateStatistics();
  renderTasks();

  console.log('TaskFlow initialized successfully.');
}

// Execute on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
