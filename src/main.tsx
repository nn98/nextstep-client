import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import Home from "./pages/Home";
import MapPage from "./pages/Map";
import Unit from "./pages/Unit";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

// 상세는 맵에서 슬라이드 커버로 진입(즉시 교체) — 그 외는 페이드
function AnimatedRoutes() {
  const location = useLocation();
  const isDetail = location.pathname.startsWith("/units/");
  return (
    <div key={location.pathname} className={isDetail ? "" : "page-enter"}>
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/units/:unitId" element={<Unit />} />
      </Routes>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
