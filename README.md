# TaskFlow — Smart Task Manager

> **"Organize your work. Track your progress. Stay productive."**

A production-quality, responsive task management web application built entirely with **HTML5, CSS3, and vanilla JavaScript (ES6+)**. Engineered to demonstrate clean frontend architecture, modern UI/UX design, accessible DOM manipulation, and robust state management without relying on external frameworks or libraries.

---

## 🌟 Key Highlights & Engineering Features

- **Zero External Dependencies**: 100% pure vanilla frontend stack (No React, Vue, jQuery, Bootstrap, or Tailwind).
- **Executive SaaS Aesthetics**: Modern glassmorphic dashboard inspired by industry tools (Linear, Notion, Things 3).
- **Persistent Client-Side State**: Powered by Browser `LocalStorage` API with resilient error handling and corrupted data recovery.
- **Dynamic Task Metrics & Visual Progress**: Real-time counter cards and an animated progress bar indicating productivity score.
- **Search & Filter Synchronization**: Real-time title search seamlessly integrated with status filters (`All`, `Active`, `Completed`) and sorting options.
- **Accessible & Interactive**:
  - Full keyboard navigation support (<kbd>Enter ↵</kbd> to add/save, <kbd>Esc</kbd> to cancel/close modals).
  - Custom accessible confirmation modal for non-destructive deletes.
  - Event delegation architecture for performant DOM updates.
  - Floating toast notification hub for instant user feedback.
- **Theming & Responsiveness**:
  - Automatic system preference detection with manual Dark/Light mode toggle.
  - Fluid mobile-first responsive layout (Desktop, Laptop, Tablet, and Mobile).

---

## 📸 Architecture & Data Structure

### 1. Data Model
Every task is stored as an immutable object conforming to a strict contract:

```javascript
{
  id: "task-lh349k-12345678",        // RFC4122 / unique identifier
  title: "Complete JavaScript project", // Sanitized task string
  completed: false,                    // Boolean state
  createdAt: 1727265600000,            // UNIX timestamp
  priority: "high",                    // "high" | "medium" | "low"
  category: "Work"                     // Category tag
}
```

### 2. State Architecture
The application uses a **Single Source of Truth** pattern:

```javascript
const AppState = {
  tasks: [],
  currentFilter: 'all',     // 'all' | 'active' | 'completed'
  searchQuery: '',          // Dynamic query string
  currentSort: 'date-desc', // 'date-desc' | 'date-asc' | 'priority' | 'alpha'
  editingTaskId: null,      // Active inline editing id
  pendingModalAction: null  // Confirmation modal payload
};
```

---

## 🚀 Core Functionalities

### 1. Task Creation & Validation
- Input field with keyboard listener (`Enter` to submit).
- **Strict Validation**: Rejects empty or whitespace-only submissions with an animated inline error message.
- Automatically trims leading and trailing whitespace.
- Priority selection (`High`, `Medium`, `Low`) and Category classification (`Work`, `Personal`, `Study`, `Urgent`, `General`).

### 2. Dynamic Task List & Event Delegation
- Task items render dynamically with custom-styled checkboxes.
- Completed tasks feature a subtle line-through animation and dimmed contrast.
- Performance-optimized via **Event Delegation**: a single event listener handles checkbox toggle, edit, and delete actions on the parent `<ul>` element.

### 3. Inline Task Editing
- Click the **Edit** (pencil) icon to convert the task card into an inline editor.
- Modify the title, priority, or category directly.
- Save via `Enter` or the "Save" button; discard changes via `Esc` or "Cancel".
- Blank edits are rejected with an alert toast.

### 4. Custom Confirmation Modal
- Deleting a task or clearing completed tasks launches an accessible, backdrop-blurred confirmation modal.
- Protects users against accidental data loss without relying on intrusive native browser `alert()` or `confirm()`.

### 5. Multi-criteria Filtering & Real-Time Search
- **Filter Tabs**: `All`, `Active`, `Completed` with dynamic count badges.
- **Instant Search**: Filters tasks in real-time as the user types; works concurrently with active status filters.
- **Sorting Options**: Sort by Newest First, Oldest First, Priority (High to Low), or Alphabetical (A-Z).

### 6. Productivity Dashboard & Live Statistics
- Dynamic counters for **Total**, **Active**, and **Completed** tasks.
- **Completion Rate %** dynamically calculated and animated.
- **Productivity Progress Bar**: Visual progress track with an animated shimmer effect indicating progress toward zero pending tasks.

### 7. Resilient LocalStorage Persistence
- Data is saved under the key `taskflow_tasks`.
- Safeguarded with `try...catch` blocks to gracefully handle quota limits, private browsing restrictions, or corrupted JSON data without application crashes.
- "Load Demo Tasks" button included to allow instant evaluation and showcase pre-populated tasks.

---

## 📂 Project Structure

```text
to do list/
│
├── index.html        # Semantic HTML5 markup, accessibility attributes & templates
├── style.css         # Pure CSS3 design system, custom properties & responsive queries
├── script.js         # Modular ES6+ JavaScript state management & DOM logic
└── README.md         # Comprehensive project documentation & architecture guide
```

---

## 🛠️ Getting Started

### Local Setup
Because this application is built with pure client-side web technologies, no build tools, bundlers, or package managers are required.

1. Clone or download the repository to your local machine.
2. Open `index.html` directly in any modern web browser (Google Chrome, Firefox, Safari, Microsoft Edge).

### Or Run with a Local Static Server
If using VS Code:
- Right click `index.html` and choose **"Open with Live Server"**.

Or using Python:
```bash
python -m http.server 8000
```
Then navigate to `http://localhost:8000` in your browser.

---

## 💡 Frontend Interview Talking Points

When demonstrating this project in an engineering interview, highlight:

1. **Separation of Concerns**: Modular decomposition into state management, storage adapter, DOM renderers, and event dispatchers.
2. **Security & Defensive Programming**: All user-provided strings are sanitized against Cross-Site Scripting (XSS) before rendering to the DOM via `escapeHTML()`.
3. **Event Delegation vs. Individual Listeners**: Instead of binding listeners to every dynamically created task item, event delegation is leveraged on `taskList` to conserve memory and handle continuous DOM mutations cleanly.
4. **Resilient Error Boundaries**: LocalStorage parsing is wrapped in defensive error handling to prevent whitescreens caused by corrupt storage payloads.
5. **CSS Architecture**: Organized around modern CSS Custom Properties for immediate theme swapping without CSS stylesheet reloading.

---

## 📄 License
MIT License. Free for personal, academic, and portfolio use.
