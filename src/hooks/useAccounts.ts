import { useCallback, useEffect, useState } from "react";
import { listMarketAccounts, type MarketAccount } from "@/lib/store";

export function useAccounts() {
  const [accounts, setAccounts] = useState<MarketAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listMarketAccounts();
      setAccounts(Array.isArray(data) ? data : []);
    } catch {
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { accounts, loading, reload };
}
