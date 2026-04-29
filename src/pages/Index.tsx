import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { AddExpenseDialog } from "@/components/AddExpenseDialog";
import { useExpenses } from "@/hooks/useExpenses";
import Dashboard from "./Dashboard";
import Insights from "./Insights";
import History from "./History";
import NotFound from "./NotFound";

const Index = () => {
  const [open, setOpen] = useState(false);
  const { expenses, loading, addExpense, deleteExpense } = useExpenses();

  return (
    <AppShell onAddClick={() => setOpen(true)}>
      <Routes>
        <Route
          path="/"
          element={<Dashboard expenses={expenses} loading={loading} onDelete={deleteExpense} />}
        />
        <Route path="/insights" element={<Insights expenses={expenses} />} />
        <Route
          path="/history"
          element={<History expenses={expenses} loading={loading} onDelete={deleteExpense} />}
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <AddExpenseDialog open={open} onOpenChange={setOpen} onAdd={addExpense} />
    </AppShell>
  );
};

export default Index;
