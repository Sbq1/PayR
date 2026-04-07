import { formatCOP } from "@/lib/utils/currency";

interface BillItemRowProps {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export function BillItemRow({ name, quantity, unitPrice, totalPrice }: BillItemRowProps) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0 pr-3">
        <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {quantity} x {formatCOP(unitPrice)}
        </p>
      </div>
      <span className="text-sm font-semibold text-gray-900 tabular-nums">
        {formatCOP(totalPrice)}
      </span>
    </div>
  );
}
