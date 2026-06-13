import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { InspirationSquare } from "@/pages/InspirationSquare";
import { CollectionBox } from "@/pages/CollectionBox";
import { InspirationDetail } from "@/pages/InspirationDetail";
import { ExperimentPlan } from "@/pages/ExperimentPlan";
import { Retrospective } from "@/pages/Retrospective";
import { Dashboard } from "@/pages/Dashboard";

function AppLayout() {
  const location = useLocation();
  const isDetailPage = location.pathname.startsWith('/inspiration/') || location.pathname.startsWith('/retrospective/');

  return (
    <div className="flex min-h-screen">
      {!isDetailPage && <Sidebar />}
      <main className={isDetailPage ? "flex-1 min-w-0" : "flex-1 min-w-0 overflow-hidden"}>
        <Routes>
          <Route path="/" element={<InspirationSquare />} />
          <Route path="/collection" element={<CollectionBox />} />
          <Route path="/inspiration/:id" element={<InspirationDetail />} />
          <Route path="/experiments" element={<ExperimentPlan />} />
          <Route path="/retrospective/:experimentId" element={<Retrospective />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}
