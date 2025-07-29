import { createContext, useContext, useState } from 'react';

type UnsavedChangesContextType = {
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (value: boolean) => void;
};

const UnsavedChangesContext = createContext<UnsavedChangesContextType>({
  hasUnsavedChanges: false,
  setHasUnsavedChanges: () => {},
});

export const useUnsavedChanges = () => useContext(UnsavedChangesContext);

export const UnsavedChangesProvider = ({ children }: { children: React.ReactNode }) => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  return (
    //Define amostragem de mudanças não salvas -> Modal
    <UnsavedChangesContext.Provider value={{ hasUnsavedChanges, setHasUnsavedChanges }}>
      {children}
    </UnsavedChangesContext.Provider>
  );
};
