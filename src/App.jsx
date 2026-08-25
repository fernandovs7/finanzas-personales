import { Sidebar } from "./components/layout/Sidebar.jsx";
import { PageHeader } from "./components/layout/PageHeader.jsx";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import { DashboardPage } from "./pages/DashboardPage.jsx";
import { FixedExpensesPage } from "./pages/FixedExpensesPage.jsx";
import { PlannedPaymentsPage } from "./pages/PlannedPaymentsPage.jsx";
import { SavingsPage } from "./pages/SavingsPage.jsx";
import { TransactionsPage } from "./pages/TransactionsPage.jsx";
import { HousingPage } from "./pages/HousingPage.jsx";
import { FinanceProvider, useFinance } from "./state/FinanceContext.jsx";
import { AuthProvider, useAuth } from "./state/AuthContext.jsx";
import { AuthPage } from "./pages/AuthPage.jsx";

const pages = {
  dashboard: DashboardPage,
  fixed: FixedExpensesPage,
  housing: HousingPage,
  liabilities: PlannedPaymentsPage,
  savings: SavingsPage,
  history: TransactionsPage
};

function FinanceApplication() {
  const { state, syncStatus, syncError } = useFinance();
  const ActivePage = pages[state.activeView] || DashboardPage;

  if (syncStatus === "loading") {
    return (
      <main className="connection-screen">
        <span className="connection-spinner" />
        <p className="eyebrow">Conectando de forma segura</p>
        <h1>Preparando tu información financiera</h1>
        <p>Estamos comprobando tu respaldo antes de mostrar el dashboard.</p>
      </main>
    );
  }

  if (syncStatus === "error") {
    return (
      <main className="connection-screen error-state">
        <p className="eyebrow">No pudimos sincronizar</p>
        <h1>Tu copia local sigue a salvo</h1>
        <p>{syncError}</p>
        <button className="primary-btn" type="button" onClick={() => window.location.reload()}>
          Intentar de nuevo
        </button>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-transition" key={state.activeView}>
          <PageHeader />
          <ErrorBoundary resetKey={state.activeView}>
            <ActivePage />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}

function AuthGate({ children }) {
  const { hasSupabaseConfig, session, loading } = useAuth();

  if (!hasSupabaseConfig) return children;
  if (loading) {
    return (
      <main className="connection-screen">
        <span className="connection-spinner" />
        <p className="eyebrow">Acceso seguro</p>
        <h1>Verificando tu sesión</h1>
      </main>
    );
  }
  if (!session) return <AuthPage />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate>
        <FinanceProvider>
          <FinanceApplication />
        </FinanceProvider>
      </AuthGate>
    </AuthProvider>
  );
}
