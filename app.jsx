import React, { useState, useEffect } from "react";

export default function App() {
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem("transactions");
    return saved ? JSON.parse(saved) : [
      { id: 1, category: "Зарплата", account: "Основной", amount: 50000, description: "Оклад", date: "2025-06-18" },
      { id: 2, category: "Продукты", account: "Основной", amount: -1200, description: "Покупки", date: "2025-06-17" },
      { id: 3, category: "Транспорт", account: "Накопления", amount: -400, description: "Бензин", date: "2025-06-17" },
    ];
  });

  const [accounts, setAccounts] = useState(() => {
    const saved = localStorage.getItem("accounts");
    return saved ? JSON.parse(saved) : ["Основной", "Накопления"];
  });

  const [incomeCategories, setIncomeCategories] = useState(() => {
    const saved = localStorage.getItem("incomeCategories");
    return saved ? JSON.parse(saved) : ["Зарплата", "Подарки", "Возврат"];
  });

  const [expenseCategories, setExpenseCategories] = useState(() => {
    const saved = localStorage.getItem("expenseCategories");
    return saved ? JSON.parse(saved) : ["Продукты", "Транспорт", "Здоровье"];
  });

  const [showModal, setShowModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editTransactionId, setEditTransactionId] = useState(null);
  const [expandedBalance, setExpandedBalance] = useState(false);

  const [newTransaction, setNewTransaction] = useState({
    category: "",
    account: "",
    amount: "",
    description: "",
    type: "income",
  });

  const [editingAccount, setEditingAccount] = useState("");
  const [editingCategory, setEditingCategory] = useState("");
  const [categoryTypeToAdd, setCategoryTypeToAdd] = useState("income");

  // Telegram WebApp SDK
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.setHeaderTitle("Махом!");
      window.Telegram.WebApp.enableClosingConfirmation();
    }
  }, []);

  // Сохранение в localStorage
  useEffect(() => {
    localStorage.setItem("transactions", JSON.stringify(transactions));
    localStorage.setItem("accounts", JSON.stringify(accounts));
    localStorage.setItem("incomeCategories", JSON.stringify(incomeCategories));
    localStorage.setItem("expenseCategories", JSON.stringify(expenseCategories));
  }, [transactions, accounts, incomeCategories, expenseCategories]);

  // Подсчёт данных
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const filteredMonthly = transactions.filter(t => {
    const tDate = new Date(t.date);
    return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
  });

  const totalIncome = filteredMonthly
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const totalExpense = Math.abs(
    filteredMonthly
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0)
  );

  const balance = totalIncome - totalExpense;

  // Группировка по датам
  const groupTransactionsByDate = () =>
    transactions.reduce((groups, tx) => {
      const date = new Date(tx.date).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(tx);
      return groups;
    }, {});

  const groupedTransactions = groupTransactionsByDate();

  // Обработчики событий
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewTransaction({ ...newTransaction, [name]: value });
  };

  const handleSubmit = () => {
    if (
      !newTransaction.category ||
      !newTransaction.account ||
      !newTransaction.description ||
      !newTransaction.amount
    )
      return;

    const amount =
      newTransaction.type === "income"
        ? parseFloat(newTransaction.amount)
        : -Math.abs(parseFloat(newTransaction.amount));

    const transaction = {
      id: Date.now(),
      category: newTransaction.category,
      account: newTransaction.account,
      amount,
      description: newTransaction.description,
      date: new Date().toISOString().split("T")[0],
    };

    setTransactions([transaction, ...transactions]);
    setNewTransaction({
      category: "",
      account: "",
      amount: "",
      description: "",
      type: "income",
    });
    setShowModal(false);
  };

  const handleEditTransaction = (id) => {
    const transaction = transactions.find(t => t.id === id);
    if (transaction) {
      setNewTransaction(transaction);
      setEditTransactionId(id);
      setShowModal(true);
    }
  };

  const handleSaveEditedTransaction = () => {
    if (
      !newTransaction.category ||
      !newTransaction.account ||
      !newTransaction.description ||
      !newTransaction.amount
    )
      return;

    const updatedTransactions = transactions.map(t =>
      t.id === editTransactionId ? { ...t, ...newTransaction } : t
    );

    setTransactions(updatedTransactions);
    setEditTransactionId(null);
    setShowModal(false);
  };

  const closeTelegram = () => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.close();
    } else {
      window.close();
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      {/* Header */}
      <header className="bg-white shadow p-3 flex justify-between items-center">
        <h1 className="text-lg font-bold text-gray-800">Махом!</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-yellow-500 hover:bg-yellow-600 text-white w-10 h-10 rounded-full flex items-center justify-center transition"
        >
          +
        </button>
      </header>

      {/* Stats */}
      <main className="p-3 space-y-4">
        {/* Баланс */}
        <div
          className="bg-yellow-500 text-white rounded shadow py-2 cursor-pointer text-center"
          onClick={() => setExpandedBalance(!expandedBalance)}
        >
          <p className="text-xs">Баланс</p>
          <p className="font-semibold">{balance.toLocaleString("ru-RU")} ₽</p>
        </div>

        {/* Раскрытие баланса по счетам */}
        {expandedBalance && (
          <div className="bg-white rounded shadow p-2 mb-4">
            <h3 className="text-sm font-medium mb-2">Счета:</h3>
            <ul>
              {accounts.map(account => (
                <li key={account} className="flex justify-between items-center">
                  <span>{account}</span>
                  <span>
                    {transactions
                      .filter(t => t.account === account)
                      .reduce((sum, t) => sum + t.amount, 0)
                      .toLocaleString("ru-RU")}{" "}
                    ₽
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Доходы и расходы */}
        <div className="grid grid-cols-2 gap-2 text-center text-sm">
          <div className="bg-green-500 text-white rounded shadow py-2">
            <p className="text-xs">Доход</p>
            <p className="font-semibold">{totalIncome.toLocaleString("ru-RU")} ₽</p>
          </div>
          <div className="bg-red-500 text-white rounded shadow py-2">
            <p className="text-xs">Расход</p>
            <p className="font-semibold">{totalExpense.toLocaleString("ru-RU")} ₽</p>
          </div>
        </div>

        {/* История */}
        <h2 className="text-sm font-semibold mt-4">История</h2>
        {Object.entries(groupedTransactions).map(([date, txs]) => (
          <div key={date}>
            <h3 className="text-sm font-medium mb-2">{date}</h3>
            <ul className="space-y-1">
              {txs.map((t) => (
                <li key={t.id} className="bg-white rounded shadow-sm p-2 flex justify-between items-center text-sm">
                  <div className="flex-1">
                    <p className="font-medium">{t.description}</p>
                    <p className="text-xs text-gray-500">
                      {t.category} • {t.account}
                    </p>
                  </div>
                  <p
                    className={`font-semibold ${
                      t.amount >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {t.amount.toLocaleString("ru-RU")} ₽
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditTransaction(t.id)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(t.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ❌
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </main>

      {/* Sticky Footer Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow p-2 flex justify-around items-center z-10 border-t">
        <button
          onClick={() => setShowAccountModal(true)}
          className="bg-yellow-500 text-white px-4 py-2 rounded"
        >
          Счета
        </button>
        <button
          onClick={() => setShowCategoryModal(true)}
          className="bg-yellow-500 text-white px-4 py-2 rounded"
        >
          Категории
        </button>
      </div>

      {/* Modal Add Transaction */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-4/5 max-w-md p-4 animate-fadeIn">
            <h2 className="text-base font-bold mb-3">Новая операция</h2>
            <div className="mb-2">
              <label className="block text-xs text-gray-600 mb-1">Тип</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setNewTransaction({...newTransaction, type: "income"})}
                  className={`flex-1 px-2 py-1 rounded text-sm ${newTransaction.type === "income" ? "bg-green-100 text-green-700" : "bg-gray-100"}`}
                >
                  Доход
                </button>
                <button
                  onClick={() => setNewTransaction({...newTransaction, type: "expense"})}
                  className={`flex-1 px-2 py-1 rounded text-sm ${newTransaction.type === "expense" ? "bg-red-100 text-red-700" : "bg-gray-100"}`}
                >
                  Расход
                </button>
              </div>
            </div>
            <div className="mb-2">
              <label className="block text-xs text-gray-600 mb-1">Категория</label>
              <select
                name="category"
                value={newTransaction.category}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded p-1 text-sm"
              >
                <option value="">Выберите</option>
                {newTransaction.type === "income" &&
                  incomeCategories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                {newTransaction.type === "expense" &&
                  expenseCategories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
              </select>
            </div>
            <div className="mb-2">
              <label className="block text-xs text-gray-600 mb-1">Счет</label>
              <select
                name="account"
                value={newTransaction.account}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded p-1 text-sm"
              >
                <option value="">Выберите</option>
                {accounts.map(acc => (
                  <option key={acc} value={acc}>
                    {acc}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-2">
              <label className="block text-xs text-gray-600 mb-1">Описание</label>
              <input
                type="text"
                name="description"
                value={newTransaction.description}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded p-1 text-sm"
              />
            </div>
            <div className="mb-3">
              <label className="block text-xs text-gray-600 mb-1">Сумма</label>
              <input
                type="number"
                name="amount"
                value={newTransaction.amount}
                onChange={handleChange}
                className={`w-full border border-gray-300 rounded p-1 text-sm ${
                  newTransaction.type === "income" ? "bg-green-50" : "bg-red-50"
                }`}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-3 py-1 bg-gray-200 rounded text-xs"
              >
                Отменить
              </button>
              <button
                onClick={editTransactionId ? handleSaveEditedTransaction : handleSubmit}
                className="px-3 py-1 bg-yellow-500 text-white rounded text-xs"
              >
                {editTransactionId ? "Сохранить изменения" : "Добавить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Accounts */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-4/5 max-w-md p-4 animate-fadeIn">
            <h2 className="text-base font-bold mb-3">Счета</h2>
            <ul className="mb-4">
              {accounts.map((acc, i) => (
                <li key={i} className="flex justify-between items-center mb-1">
                  <span>{acc}</span>
                  <button
                    onClick={() => setAccounts(accounts.filter(a => a !== acc))}
                    className="text-red-500 text-sm"
                  >
                    Удалить
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Новый счет"
                value={editingAccount}
                onChange={(e) => setEditingAccount(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm flex-1"
              />
              <button
                onClick={() => {
                  if (editingAccount.trim()) {
                    setAccounts([...accounts, editingAccount]);
                    setEditingAccount("");
                  }
                }}
                className="bg-yellow-500 text-white px-2 py-1 rounded text-sm"
              >
                Добавить
              </button>
            </div>
            <button
              onClick={() => setShowAccountModal(false)}
              className="mt-4 w-full text-center text-sm text-gray-500 underline"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* Modal Categories */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-4/5 max-w-md p-4 animate-fadeIn">
            <h2 className="text-base font-bold mb-3">Категории</h2>
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">Доходы</h3>
              <ul>
                {incomeCategories.map((item, i) => (
                  <li key={i} className="flex justify-between items-center mb-1">
                    <span>{item}</span>
                    <button
                      onClick={() => setIncomeCategories(incomeCategories.filter(c => c !== item))}
                      className="text-red-500 text-sm"
                    >
                      Удалить
                    </button>
                  </li>
                ))}
                <li className="flex space-x-2 mt-2">
                  <input
                    type="text"
                    placeholder="Новая категория"
                    value={editingCategory}
                    onChange={(e) => {
                      setEditingCategory(e.target.value);
                      setCategoryTypeToAdd("income");
                    }}
                    className="border border-gray-300 rounded px-2 py-1 text-sm flex-1"
                  />
                  <button
                    onClick={() => {
                      if (editingCategory.trim()) {
                        setIncomeCategories([...incomeCategories, editingCategory]);
                        setEditingCategory("");
                      }
                    }}
                    className="bg-yellow-500 text-white px-2 py-1 rounded text-sm"
                  >
                    Добавить
                  </button>
                </li>
              </ul>
            </div>
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">Расходы</h3>
              <ul>
                {expenseCategories.map((item, i) => (
                  <li key={i} className="flex justify-between items-center mb-1">
                    <span>{item}</span>
                    <button
                      onClick={() => setExpenseCategories(expenseCategories.filter(c => c !== item))}
                      className="text-red-500 text-sm"
                    >
                      Удалить
                    </button>
                  </li>
                ))}
                <li className="flex space-x-2 mt-2">
                  <input
                    type="text"
                    placeholder="Новая категория"
                    value={editingCategory}
                    onChange={(e) => {
                      setEditingCategory(e.target.value);
                      setCategoryTypeToAdd("expense");
                    }}
                    className="border border-gray-300 rounded px-2 py-1 text-sm flex-1"
                  />
                  <button
                    onClick={() => {
                      if (editingCategory.trim()) {
                        setExpenseCategories([...expenseCategories, editingCategory]);
                        setEditingCategory("");
                      }
                    }}
                    className="bg-yellow-500 text-white px-2 py-1 rounded text-sm"
                  >
                    Добавить
                  </button>
                </li>
              </ul>
            </div>
            <button
              onClick={() => setShowCategoryModal(false)}
              className="mt-4 w-full text-center text-sm text-gray-500 underline"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-4/5 max-w-xs p-4 animate-fadeIn text-center">
            <p className="mb-4">Удалить эту операцию?</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-1 bg-gray-200 rounded"
              >
                Нет
              </button>
              <button
                onClick={() => {
                  setTransactions(transactions.filter(t => t.id !== deleteConfirm));
                  setDeleteConfirm(null);
                }}
                className="px-4 py-1 bg-red-500 text-white rounded"
              >
                Да, удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
