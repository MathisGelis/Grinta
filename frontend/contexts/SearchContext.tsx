import React, { createContext, useState, useCallback, useContext } from "react";
import { SearchUser, UserService } from "@/services/user.service";

interface SearchContextType {
  query: string;
  results: SearchUser[];
  loading: boolean;
  searchAttempted: boolean;
  handleSearch: (text: string) => Promise<void>;
  clearSearch: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);

  const handleSearch = useCallback(async (text: string) => {
    setQuery(text);
    setSearchAttempted(true);

    if (!text.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const searchResults = await UserService.searchUsers(text);
      setResults(searchResults);
    } catch (error) {
      console.error("Error searching users:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setQuery("");
    setResults([]);
    setSearchAttempted(false);
  }, []);

  return (
    <SearchContext.Provider
      value={{
        query,
        results,
        loading,
        searchAttempted,
        handleSearch,
        clearSearch,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
}
