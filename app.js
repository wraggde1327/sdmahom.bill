// Инициализация данных
let transactions = JSON.parse(localStorage.getItem("transactions")) || [
  { id: 1, category: "Зарплата", account: "Основной", amount: 50000, description: "Оклад", date: "2025-06-18" },
  { id: 2, category: "Продукты", account: "Основной", amount: -1200, description: "Покупки", date: "2025-06-17" },
  { id: 3, category: "Транспорт", account: "Накопления", amount: -400, description: "Бензин", date: "2025-06-17" }
];

let accounts = JSON.parse(localStorage.getItem("accounts")) || ["Основной", "Накопления"];
let incomeCategories = JSON.parse(localStorage.getItem("incomeCategories")) || ["Зарплата", "Подарки", "Возврат"];
let expenseCategories = JSON.parse(localStorage.getItem("expenseCategories")) || ["Продукты", "Транспорт", "Здоровье"];

const transactionForm = {
  category: "",
  account: "",
  amount: "",
  description: "",
  type: "income"
};

let editTransactionId = null;

// DOM Elements
const modalAdd = document.getElementById("modal-add");
const addBtn = document.getElementById("add-btn");
const saveBtn = document.getElementById("save-btn");
const cancelBtn = document.getElementById("cancel-btn");
const refreshBtn = document.getElementById("refresh-btn");

const balanceValueEl = document.getElementById("balance-value");
const incomeValueEl = document.getElementById("income-value");
const expenseValueEl = document.getElementById("expense-value");
const transactionHistoryEl = document.getElementById("transaction-history");
const accountSelectEl = document.getElementById("account-select");
const categorySelectEl = document.getElementById("category-select");
const descriptionInputEl = document.getElementById("description-input");
const amountInputEl = document.getElementById("amount-input");

const accountListModalEl = document.getElementById("account-list-modal");
const newAccountInputEl = document.getElementById("new-account-input");
const addAccountBtn = document.getElementById("add-account-btn");

const incomeCategoryListEl = document.getElementById("income-categories-list");
const expenseCategoryListEl = document.getElementById("expense-categories-list");
const newIncomeCategoryInputEl = document.getElementById("new-income-category");
const newExpenseCategoryInputEl = document.getElementById("new-expense-category");
const addIncomeCategoryBtn = document.getElementById("add-income-category-btn");
const addExpenseCategoryBtn = document.getElementById("add-expense-category-btn");

const accountListEl = document.getElementById("account-list");

const balanceBoxEl = document.getElementById("balance-box");
const expandedBalanceEl = document.getElementById("expanded-balance");

// Текущие категории формы
let selectedType = "income";

document.addEventListener("DOMContentLoaded", () => {
  render();
});

function render() {
  updateStats();
  renderTransactions();
  populateAccountSelect();
  populateCategorySelect(selectedType);
  renderAccountListModal();
  renderCategoryModals();
  renderExpandedBalance();
}

function updateStats() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const filtered = transactions.filter(t => {
    const tDate = new Date(t.date);
    return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
  });

  const totalIncome = filtered
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const totalExpense = Math.abs(
    filtered
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0)
  );

  const balance = totalIncome - totalExpense;

  balanceValueEl.textContent = formatCurrency(balance);
  incomeValueEl.textContent = formatCurrency(totalIncome);
  expenseValueEl.textContent = formatCurrency(totalExpense);
}

function renderTransactions() {
  transactionHistoryEl.innerHTML = "";
  const grouped = groupByDate(transactions);
  Object.entries(grouped).forEach(([date, txs]) => {
    const group = document.createElement("div");
    group.classList.add("transaction-group");

    const heading = document.createElement("h3");
    heading.textContent = date;
    group.appendChild(heading);

    txs.forEach(tx => {
      const div = document.createElement("div");
      div.className = "transaction";
      div.innerHTML = `
        <div>
          <p>${tx.description}</p>
          <small>${tx.category} • ${tx.account}</small>
        </div>
        <span class="${tx.amount >= 0 ? 'amount-green' : 'amount-red'}">${formatCurrency(tx.amount)} ₽</span>
      `;
      group.appendChild(div);
    });

    transactionHistoryEl.appendChild(group);
  });
}

function groupByDate(transactions) {
  return transactions.reduce((groups, tx) => {
    const date = new Date(tx.date).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long"
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(tx);
    return groups;
  }, {});
}

function populateAccountSelect() {
  accountSelectEl.innerHTML = `<option value="">Выберите</option>`;
  accounts.forEach(acc => {
    const option = document.createElement("option");
    option.value = acc;
    option.textContent = acc;
    accountSelectEl.appendChild(option);
  });
}

function populateCategorySelect(type) {
  categorySelectEl.innerHTML = `<option value="">Выберите</option>`;
  const categories = type === "income" ? incomeCategories : expenseCategories;
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categorySelectEl.appendChild(option);
  });
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("ru-RU").format(amount);
}

// --- Modal Logic ---

addBtn.onclick = () => {
  resetForm();
  modalAdd.classList.remove("hidden");
};

cancelBtn.onclick = () => {
  modalAdd.classList.add("hidden");
};

document.getElementById("type-income").onclick = () => {
  selectedType = "income";
  populateCategorySelect(selectedType);
  document.getElementById("type-income").classList.add("active");
  document.getElementById("type-expense").classList.remove("active");
};

document.getElementById("type-expense").onclick = () => {
  selectedType = "expense";
  populateCategorySelect(selectedType);
  document.getElementById("type-expense").classList.add("active");
  document.getElementById("type-income").classList.remove("active");
};

saveBtn.onclick = () => {
  const category = categorySelectEl.value;
  const account = accountSelectEl.value;
  const description = descriptionInputEl.value;
  const amount = parseFloat(amountInputEl.value);

  if (!category || !account || !description || isNaN(amount)) {
    alert("Заполните все поля!");
    return;
  }

  const finalAmount =
    selectedType === "income" ? amount : -Math.abs(amount);

  const transaction = {
    id: Date.now(),
    category,
    account,
    amount: finalAmount,
    description,
    date: new Date().toISOString().split("T")[0]
  };

  transactions.unshift(transaction);
  localStorage.setItem("transactions", JSON.stringify(transactions));
  modalAdd.classList.add("hidden");
  render();
};

function resetForm() {
  categorySelectEl.selectedIndex = 0;
  accountSelectEl.selectedIndex = 0;
  descriptionInputEl.value = "";
  amountInputEl.value = "";
  selectedType = "income";
  document.getElementById("type-income").classList.add("active");
  document.getElementById("type-expense").classList.remove("active");
  populateCategorySelect("income");
}

// --- Account Modal ---
document.getElementById("accounts-btn").onclick = toggleAccountsModal;
function toggleAccountsModal() {
  document.getElementById("modal-accounts").classList.toggle("hidden");
}

document.getElementById("add-account-btn").onclick = () => {
  const name = newAccountInputEl.value.trim();
  if (name && !accounts.includes(name)) {
    accounts.push(name);
    localStorage.setItem("accounts", JSON.stringify(accounts));
    newAccountInputEl.value = "";
    render();
  }
};

function renderAccountListModal() {
  accountListModalEl.innerHTML = "";
  accounts.forEach((acc, i) => {
    const li = document.createElement("li");
    li.innerHTML = `${acc} <button onclick="deleteAccount(${i})">Удалить</button>`;
    accountListModalEl.appendChild(li);
  });
}

window.deleteAccount = function(index) {
  accounts.splice(index, 1);
  localStorage.setItem("accounts", JSON.stringify(accounts));
  render();
};

// --- Category Modal ---
document.getElementById("categories-btn").onclick = toggleCategoriesModal;
function toggleCategoriesModal() {
  document.getElementById("modal-categories").classList.toggle("hidden");
}

function renderCategoryModals() {
  // Доходы
  incomeCategoryListEl.innerHTML = "";
  incomeCategories.forEach((cat, i) => {
    const li = document.createElement("li");
    li.innerHTML = `${cat} <button onclick="deleteIncomeCategory(${i})">Удалить</button>`;
    incomeCategoryListEl.appendChild(li);
  });

  // Расходы
  expenseCategoryListEl.innerHTML = "";
  expenseCategories.forEach((cat, i) => {
    const li = document.createElement("li");
    li.innerHTML = `${cat} <button onclick="deleteExpenseCategory(${i})">Удалить</button>`;
    expenseCategoryListEl.appendChild(li);
  });
}

addIncomeCategoryBtn.onclick = () => {
  const val = newIncomeCategoryInputEl.value.trim();
  if (val && !incomeCategories.includes(val)) {
    incomeCategories.push(val);
    localStorage.setItem("incomeCategories", JSON.stringify(incomeCategories));
    newIncomeCategoryInputEl.value = "";
    render();
  }
};

addExpenseCategoryBtn.onclick = () => {
  const val = newExpenseCategoryInputEl.value.trim();
  if (val && !expenseCategories.includes(val)) {
    expenseCategories.push(val);
    localStorage.setItem("expenseCategories", JSON.stringify(expenseCategories));
    newExpenseCategoryInputEl.value = "";
    render();
  }
};

window.deleteIncomeCategory = function(i) {
  incomeCategories.splice(i, 1);
  localStorage.setItem("incomeCategories", JSON.stringify(incomeCategories));
  render();
};

window.deleteExpenseCategory = function(i) {
  expenseCategories.splice(i, 1);
  localStorage.setItem("expenseCategories", JSON.stringify(expenseCategories));
  render();
};

function renderExpandedBalance() {
  accountListEl.innerHTML = "";
  accounts.forEach(acc => {
    const sum = transactions
      .filter(t => t.account === acc)
      .reduce((s, t) => s + t.amount, 0);
    const li = document.createElement("li");
    li.innerHTML = `<strong>${acc}</strong>: ${formatCurrency(sum)} ₽`;
    accountListEl.appendChild(li);
  });
}

balanceBoxEl.onclick = () => {
  expandedBalanceEl.classList.toggle("hidden");
};

function renderCategorySelect(type = "income") {
  categorySelectEl.innerHTML = '<option value="">Выберите</option>';
  const list = type === "income" ? incomeCategories : expenseCategories;
  list.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categorySelectEl.appendChild(option);
  });
}

function renderAll() {
  render();
  populateAccountSelect();
  populateCategorySelect(selectedType);
  renderAccountListModal();
  renderCategoryModals();
  renderExpandedBalance();
}
