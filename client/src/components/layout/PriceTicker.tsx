import { usePrices } from "@/hooks/usePrices";
import { TrendingUp, TrendingDown } from "lucide-react";

export function PriceTicker() {
  const { yhtPrice, bnbPrice, formatPrice, formatChange } = usePrices();

  const tickerItems = [
    {
      label: "YHT/USDT:",
      price: yhtPrice ? `$${formatPrice(yhtPrice.price, 6)}` : "$0.000000",
      change: yhtPrice ? formatChange(yhtPrice.change24h) : { value: "+0.00%", isPositive: true },
    },
    {
      label: "BNB:",
      price: bnbPrice ? `$${formatPrice(bnbPrice.price, 2)}` : "$0.00",
      change: bnbPrice ? formatChange(bnbPrice.change24h) : { value: "+0.00%", isPositive: true },
    },
    {
      label: "Volume 24h:",
      price: yhtPrice?.volume24h ? `$${parseFloat(yhtPrice.volume24h).toLocaleString()}` : "$0",
      change: null,
    },
    {
      label: "Liquidity:",
      price: yhtPrice?.liquidity ? `$${parseFloat(yhtPrice.liquidity).toLocaleString()}` : "$0",
      change: null,
    },
  ];

  return (
    <div className="bg-muted/50 border-b border-border overflow-hidden">
      <div className="price-ticker flex items-center space-x-8 py-2">
        {tickerItems.map((item, index) => (
          <div key={index} className="flex items-center space-x-2 whitespace-nowrap">
            <span className="text-sm text-muted-foreground" data-testid={`ticker-label-${index}`}>
              {item.label}
            </span>
            <span 
              className={`text-sm font-medium ${
                item.change?.isPositive ? 'text-green-400' : 'text-red-400'
              }`}
              data-testid={`ticker-price-${index}`}
            >
              {item.price}
            </span>
            {item.change && (
              <span 
                className={`text-xs flex items-center space-x-1 ${
                  item.change.isPositive ? 'text-green-400' : 'text-red-400'
                }`}
                data-testid={`ticker-change-${index}`}
              >
                {item.change.isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{item.change.value}</span>
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
