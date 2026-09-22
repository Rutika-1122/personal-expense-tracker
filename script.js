// Initial Application State
let expenses = JSON.parse(localStorage.getItem('expenses')) || [
    { id: '1', amount: 45.50, category: 'Food & Dining', date: '2026-09-20', description: 'Grocery shopping' },
    { id: '2', amount: 12.00, category: 'Transportation', date: '2026-09-21', description: 'Bus pass' },
    { id: '3', amount: 120.00, category: 'Bills & Utilities', date: '2026-09-15', description: 'Electricity bill' },
    { id: '4', amount: 65.00, category: 'Entertainment', date: '2026-09-18', description: 'Concert ticket' }
];

let categoryChart = null;
let trendChart = null;

// DOM Elements
const navBtns = document.querySelectorAll('.nav-btn');
const viewTabs = document.querySelectorAll('.view-tab');
const pageTitle = document.getElementById('page-title');
const modal = document.getElementById('expense-modal');
const addExpenseBtn = document.getElementById('add-expense-btn');
const closeModalBtn = document.querySelector('.close-btn');
const cancelBtn = document.querySelector('.cancel-btn');
const expenseForm = document.getElementById('expense-form');
const viewAllBtn = document.getElementById('view-all-btn');

// Filter & Search Controls
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const sortBy = document.getElementById('sort-by');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initModal();
    initForm();
    initFilters();
    renderApp();
});

// Save to LocalStorage
function saveExpenses() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

// Navigation Handling
function initNavigation() {
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            
            navBtns.forEach(b => b.classList.remove('active'));
            viewTabs.forEach(v => v.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(`${targetTab}-view`).classList.add('active');
            
            pageTitle.textContent = btn.textContent.trim();
            renderApp();
        });
    });

    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', () => {
            document.querySelector('[data-tab="transactions"]').click();
        });
    }
}

// Modal Handling
function initModal() {
    addExpenseBtn.addEventListener('click', () => openModal());
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

function openModal(expense = null) {
    if (expense) {
        document.getElementById('modal-title').textContent = 'Edit Expense';
        document.getElementById('expense-id').value = expense.id;
        document.getElementById('amount').value = expense.amount;
        document.getElementById('category').value = expense.category;
        document.getElementById('expense-date').value = expense.date;
        document.getElementById('description').value = expense.description;
    } else {
        document.getElementById('modal-title').textContent = 'Add New Expense';
        expenseForm.reset();
        document.getElementById('expense-id').value = '';
        document.getElementById('expense-date').value = new Date().toISOString().split('T')[0];
    }
    modal.classList.add('active');
}

function closeModal() {
    modal.classList.remove('active');
    expenseForm.reset();
}

// Form Submission
function initForm() {
    expenseForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const id = document.getElementById('expense-id').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const category = document.getElementById('category').value;
        const date = document.getElementById('expense-date').value;
        const description = document.getElementById('description').value;

        if (id) {
            // Edit
            const index = expenses.findIndex(e => e.id === id);
            if (index !== -1) {
                expenses[index] = { id, amount, category, date, description };
            }
        } else {
            // Add
            const newExpense = {
                id: Date.now().toString(),
                amount,
                category,
                date,
                description
            };
            expenses.push(newExpense);
        }

        saveExpenses();
        closeModal();
        renderApp();
    });
}

// Filter Event Listeners
function initFilters() {
    searchInput.addEventListener('input', renderFullTransactions);
    categoryFilter.addEventListener('change', renderFullTransactions);
    sortBy.addEventListener('change', renderFullTransactions);
}

// Global App Render
function renderApp() {
    calculateSummary();
    renderRecentTransactions();
    renderFullTransactions();
    renderCharts();
}

// Stats Calculation
function calculateSummary() {
    const total = expenses.reduce((sum, item) => sum + item.amount, 0);
    
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthTotal = expenses
        .filter(item => item.date.startsWith(currentMonth))
        .reduce((sum, item) => sum + item.amount, 0);

    document.getElementById('total-spending').textContent = `$${total.toFixed(2)}`;
    document.getElementById('month-spending').textContent = `$${monthTotal.toFixed(2)}`;
    document.getElementById('total-count').textContent = expenses.length;
}

// Recent Transactions (Dashboard)
function renderRecentTransactions() {
    const list = document.getElementById('recent-transactions-list');
    list.innerHTML = '';

    const sorted = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

    if (sorted.length === 0) {
        list.innerHTML = '<li style="padding: 12px; color: #64748b;">No recent expenses.</li>';
        return;
    }

    sorted.forEach(item => {
        const li = document.createElement('li');
        li.className = 'transaction-item';
        li.innerHTML = `
            <div class="tx-info">
                <h4>${escapeHTML(item.description)}</h4>
                <span>${item.category} • ${item.date}</span>
            </div>
            <div class="tx-amount">$${item.amount.toFixed(2)}</div>
        `;
        list.appendChild(li);
    });
}

// Full Transactions Table with Filters & Actions
function renderFullTransactions() {
    const tbody = document.getElementById('full-transactions-list');
    tbody.innerHTML = '';

    let filtered = [...expenses];

    // Filter by Search Query
    const query = searchInput.value.toLowerCase().trim();
    if (query) {
        filtered = filtered.filter(item => item.description.toLowerCase().includes(query));
    }

    // Filter by Category
    const cat = categoryFilter.value;
    if (cat !== 'ALL') {
        filtered = filtered.filter(item => item.category === cat);
    }

    // Sorting
    const sortVal = sortBy.value;
    filtered.sort((a, b) => {
        if (sortVal === 'date-desc') return new Date(b.date) - new Date(a.date);
        if (sortVal === 'date-asc') return new Date(a.date) - new Date(b.date);
        if (sortVal === 'amount-desc') return b.amount - a.amount;
        if (sortVal === 'amount-asc') return a.amount - b.amount;
        return 0;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">No transactions found.</td></tr>';
        return;
    }

    filtered.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.date}</td>
            <td>${escapeHTML(item.description)}</td>
            <td><span class="badge">${item.category}</span></td>
            <td><strong>$${item.amount.toFixed(2)}</strong></td>
            <td>
                <button class="btn-action edit-btn" title="Edit">✏️</button>
                <button class="btn-action delete-btn" title="Delete">🗑️</button>
            </td>
        `;

        tr.querySelector('.edit-btn').addEventListener('click', () => openModal(item));
        tr.querySelector('.delete-btn').addEventListener('click', () => deleteExpense(item.id));

        tbody.appendChild(tr);
    });
}

// Delete Expense
function deleteExpense(id) {
    if (confirm('Are you sure you want to delete this expense?')) {
        expenses = expenses.filter(e => e.id !== id);
        saveExpenses();
        renderApp();
    }
}

// Render Analytics Charts
function renderCharts() {
    // 1. Category Doughnut Chart
    const categoryTotals = {};
    expenses.forEach(item => {
        categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.amount;
    });

    const catCtx = document.getElementById('categoryChart').getContext('2d');
    if (categoryChart) categoryChart.destroy();

    categoryChart = new Chart(catCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categoryTotals),
            datasets: [{
                data: Object.values(categoryTotals),
                backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // 2. Trend Bar Chart
    const dateTotals = {};
    const sorted = [...expenses].sort((a, b) => new Date(a.date) - new Date(b.date));
    sorted.forEach(item => {
        dateTotals[item.date] = (dateTotals[item.date] || 0) + item.amount;
    });

    const trendCtx = document.getElementById('trendChart').getContext('2d');
    if (trendChart) trendChart.destroy();

    trendChart = new Chart(trendCtx, {
        type: 'bar',
        data: {
            labels: Object.keys(dateTotals),
            datasets: [{
                label: 'Daily Spending ($)',
                data: Object.values(dateTotals),
                backgroundColor: '#3b82f6'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// Helper: Escape HTML string
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}
