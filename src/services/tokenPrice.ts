import axiosServices from "@/util/axios";

export interface TokenPrice {
  price: number; // QDoge price in QUBIC (e.g., 10 means 1 QDoge = 10 QUBIC)
  timestamp: number;
}

let cachedPrice: TokenPrice | null = null;
let cacheExpiry = 0;
let priceFetchFailCount = 0;
const CACHE_DURATION = 30000; // 30 seconds cache

export const fetchQDogePrice = async (): Promise<TokenPrice> => {
  const now = Date.now();
  
  // Return cached price if still valid
  if (cachedPrice && now < cacheExpiry) {
    return cachedPrice;
  }

  try {
    const response = await axiosServices.get("/token-price/qdoge");
    const priceData: TokenPrice = {
      price: Number(response.data.price) || 1,
      timestamp: response.data.timestamp || now,
    };
    
    // Cache the result
    cachedPrice = priceData;
    cacheExpiry = now + CACHE_DURATION;
    priceFetchFailCount = 0;
    
    return priceData;
  } catch (error: any) {
    priceFetchFailCount++;
    // Only log first failure and every 10th to avoid console spam
    if (priceFetchFailCount === 1) {
      const msg = error?.response?.data?.message || error?.message || "Unknown error";
      console.warn("QDoge price fetch failed (will retry silently):", msg);
    } else if (priceFetchFailCount % 10 === 0) {
      console.warn(`QDoge price fetch still failing after ${priceFetchFailCount} attempts`);
    }
    
    // Return cached price if available, otherwise default to 1
    if (cachedPrice) {
      return cachedPrice;
    }
    
    // Default price if no cache and API fails
    return {
      price: 1,
      timestamp: now,
    };
  }
};

export const convertQDogeToQubic = (qdogeAmount: number, price: number): number => {
  return Math.floor(qdogeAmount * price);
};

export const convertQubicToQDoge = (qubicAmount: number, price: number): number => {
  return Math.floor(qubicAmount / price);
};
