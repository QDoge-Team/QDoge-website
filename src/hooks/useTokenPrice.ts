import { useEffect, useState } from "react";
import { fetchQDogePrice, TokenPrice } from "@/services/tokenPrice";

export const useTokenPrice = () => {
  const [price, setPrice] = useState<TokenPrice>({ price: 1, timestamp: Date.now() });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const loadPrice = async () => {
      try {
        setLoading(true);
        setError(null);
        const priceData = await fetchQDogePrice();
        setPrice(priceData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch token price"));
      } finally {
        setLoading(false);
      }
    };

    // Load immediately
    loadPrice();

    // Refresh every 30 seconds
    intervalId = setInterval(loadPrice, 30000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  return { price, loading, error, refresh: () => fetchQDogePrice().then(setPrice) };
};
