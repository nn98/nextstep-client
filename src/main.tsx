import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import { TabNav } from "./components/ui";
import { SelectionProvider } from "./selection";
import Home from "./pages/Home";
import MapPage from "./pages/Map";
import Unit from "./pages/Unit";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

function Header() {
  return (
    <header className="sticky top-0 z-[1001] border-b border-line bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink text-xs font-bold text-white">
            N
          </span>
          <span className="font-bold text-slate-800">NextStep</span>
        </Link>
      </div>
    </header>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SelectionProvider>
        <BrowserRouter>
          <Header />
          <main className="mx-auto max-w-5xl px-4 py-6 pb-28">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/units/:unitId" element={<Unit />} />
            </Routes>
          </main>
          <TabNav />
        </BrowserRouter>
      </SelectionProvider>
    </QueryClientProvider>
  </StrictMode>
);
