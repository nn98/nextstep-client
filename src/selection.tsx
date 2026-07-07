import { createContext, useContext, useState, type ReactNode } from "react";

// 마지막으로 본 물건 → 하단 '상세' 탭이 가리킬 대상
const Ctx = createContext<{ unitId?: string; select: (id?: string) => void }>({
  select: () => {},
});

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [unitId, setUnitId] = useState<string | undefined>();
  return <Ctx.Provider value={{ unitId, select: setUnitId }}>{children}</Ctx.Provider>;
}

export const useSelection = () => useContext(Ctx);
