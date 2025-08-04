import React, { createContext, useContext, useState } from "react";

export type ViewMode = "day" | "week" | "month" | "timeline" | "list";

interface ViewModeContextProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

const ViewModeContext = createContext<ViewModeContextProps | undefined>(undefined);

export const ViewModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode }}>
      {children}
    </ViewModeContext.Provider>
  );
};

export const useViewMode = () => {
  const context = useContext(ViewModeContext);
  if (!context) throw new Error("useViewMode must be used within ViewModeProvider");
  return context;
};
