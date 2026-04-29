import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OrderQueue } from "./pages/OrderQueue";
import { ProductEditor } from "./pages/ProductEditor";
import { AnalyticsSummary } from "./components/AnalyticsSummary";
import "./index.css";

const queryClient = new QueryClient();

function App() {
  // Simple role-based routing (in production, use a proper router like TanStack Router)
  const userRole = localStorage.getItem("user_role") || "tailor";
  const currentView = new URLSearchParams(window.location.search).get("view") || "orders";

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Jhaz-imprints Admin</h1>
              <div className="text-sm text-muted">
                Logged in as: <span className="font-semibold capitalize">{userRole}</span>
              </div>
            </div>

            {/* Navigation */}
            <nav className="mt-4 flex gap-4">
              {userRole === "tailor" && (
                <a
                  href="?view=orders"
                  className={`px-4 py-2 rounded ${
                    currentView === "orders" ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Order Queue
                </a>
              )}
              {userRole === "admin" && (
                <>
                  <a
                    href="?view=analytics"
                    className={`px-4 py-2 rounded ${
                      currentView === "analytics"
                        ? "bg-primary text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    Analytics
                  </a>
                  <a
                    href="?view=products"
                    className={`px-4 py-2 rounded ${
                      currentView === "products"
                        ? "bg-primary text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    Products
                  </a>
                </>
              )}
            </nav>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {currentView === "orders" && userRole === "tailor" && <OrderQueue />}
          {currentView === "analytics" && userRole === "admin" && <AnalyticsSummary />}
          {currentView === "products" && userRole === "admin" && <ProductEditor />}
        </main>
      </div>
    </QueryClientProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
