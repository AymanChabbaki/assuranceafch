// src/hooks/useContractInfo.ts
// Polls the backend API for live contract state every 15 seconds.

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_URL } from "../config/contract";
import type { ContractInfo } from "../types";

export function useContractInfo() {
  const [info, setInfo] = useState<ContractInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      const res = await axios.get<ContractInfo>(`${API_URL}/api/contract-info`);
      setInfo(res.data);
      setError(null);
    } catch {
      setError("Could not reach backend API");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 15_000);
    return () => clearInterval(interval);
  }, [fetch]);

  return { info, loading, error, refetch: fetch };
}
