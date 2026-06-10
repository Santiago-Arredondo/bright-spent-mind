import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { AddExpenseDialog } from "@/components/AddExpenseDialog";
import { AddIncomeDialog } from "@/components/AddIncomeDialog";
import { EditExpenseDialog } from "@/components/EditExpenseDialog";
import { useExpenses } from "@/hooks/useExpenses";
import { useIncome } from "@/hooks/useIncome";
import type { Expense } from "@/components/ExpenseList";
import Dashboard from "./Dashboard";
import Insights from "./Insights";
import History from "./History";
import IncomePage from "./Income";
import Monthly from "./Monthly";
import Categories from "./Categories";
import SearchPage from "./Search";
import Trash from "./Trash";
import NotFound from "./NotFound";

const Index = () => {
  const [openExpense, setOpenExpense] = useState(false);
  const [openIncome, setOpenIncome] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const { expenses, loading, addExpense, updateExpense, deleteExpense, deleteExpensesBulk } = useExpenses();
  const { income, loading: incomeLoading, addIncome, updateIncome, deleteIncome, deleteIncomeBulk } = useIncome();

  return (
    <AppShell
      onAddClick={() => setOpenExpense(true)}
      onAddIncomeClick={() => setOpenIncome(true)}
      expenses={expenses}
    >
      <Routes>
        <Route
          path="/"
          element={
            <Dashboard
              expenses={expenses}
              income={income}
              loading={loading}
              onDelete={deleteExpense}
              onEdit={setEditingExpense}
              onAddIncome={() => setOpenIncome(true)}
            />
          }
        />
        <Route path="/insights" element={<Insights expenses={expenses} />} />
        <Route
          path="/history"
          element={
            <History
              expenses={expenses}
              income={income}
              loading={loading || incomeLoading}
              onDeleteExpense={deleteExpense}
              onDeleteIncome={deleteIncome}
              onUpdateExpense={updateExpense}
              onUpdateIncome={updateIncome}
              onDeleteExpensesBulk={deleteExpensesBulk}
              onDeleteIncomeBulk={deleteIncomeBulk}
            />
          }
        />
        <Route
          path="/income"
          element={
            <IncomePage
              income={income}
              loading={incomeLoading}
              onAdd={addIncome}
              onUpdate={updateIncome}
              onDelete={deleteIncome}
              onDeleteBulk={deleteIncomeBulk}
            />
          }
        />
        <Route path="/monthly" element={<Monthly />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/trash" element={<Trash />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      <AddExpenseDialog open={openExpense} onOpenChange={setOpenExpense} onAdd={addExpense} />
      <AddIncomeDialog open={openIncome} onOpenChange={setOpenIncome} onAdd={addIncome} />
      <EditExpenseDialog
        expense={editingExpense}
        onOpenChange={(o) => !o && setEditingExpense(null)}
        onUpdate={updateExpense}
      />
    </AppShell>
  );
};

export default Index;
