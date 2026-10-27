import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type WorkoutsSection = "sessions" | "programmes" | "exercises";

type Queries = Record<WorkoutsSection, string>;

type ContextValue = {
  queries: Queries;
  setQuery: (section: WorkoutsSection, query: string) => void;
  setFilterHandler: (section: WorkoutsSection, handler: (() => void) | null) => void;
  openFilter: (section: WorkoutsSection) => void;
};

const EMPTY: Queries = { sessions: "", programmes: "", exercises: "" };

const WorkoutsSearchContext = createContext<ContextValue | undefined>(undefined);

export function WorkoutsSearchProvider({ children }: { children: React.ReactNode }) {
  const [queries, setQueries] = useState<Queries>(EMPTY);
  const handlers = useRef<Partial<Record<WorkoutsSection, () => void>>>({});

  const setQuery = useCallback((section: WorkoutsSection, query: string) => {
    setQueries((prev) => (prev[section] === query ? prev : { ...prev, [section]: query }));
  }, []);

  const setFilterHandler = useCallback(
    (section: WorkoutsSection, handler: (() => void) | null) => {
      if (handler) handlers.current[section] = handler;
      else delete handlers.current[section];
    },
    [],
  );

  const openFilter = useCallback((section: WorkoutsSection) => {
    handlers.current[section]?.();
  }, []);

  const value = useMemo(
    () => ({ queries, setQuery, setFilterHandler, openFilter }),
    [queries, setQuery, setFilterHandler, openFilter],
  );

  return (
    <WorkoutsSearchContext.Provider value={value}>
      {children}
    </WorkoutsSearchContext.Provider>
  );
}

function useWorkoutsSearch() {
  const context = useContext(WorkoutsSearchContext);
  if (!context) {
    throw new Error("useWorkoutsSearch must be used within a WorkoutsSearchProvider");
  }
  return context;
}

export function useWorkoutsSearchBar() {
  return useWorkoutsSearch();
}

export function useSectionQuery(
  section: WorkoutsSection,
  onFilterPress?: () => void,
): string {
  const { queries, setFilterHandler } = useWorkoutsSearch();

  useEffect(() => {
    if (!onFilterPress) return;
    setFilterHandler(section, onFilterPress);
    return () => setFilterHandler(section, null);
  }, [section, onFilterPress, setFilterHandler]);

  return queries[section];
}
