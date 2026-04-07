import { formatCOP } from "@/lib/utils/currency";

interface BillSummaryProps {
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  tipPercentage: number | null;
}

export function BillSummary({ subtotal, tax, tip, total, tipPercentage }: BillSummaryProps) {
  return (
    <div className="space-y-2 pt-3">
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">Subtotal</span>
        <span className="text-gray-700 tabular-nums">{formatCOP(subtotal)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">IVA</span>
        <span className="text-gray-700 tabular-nums">{formatCOP(tax)}</span>
      </div>
      {tip > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">
            Propina{tipPercentage ? ` (${tipPercentage}%)` : ""}
          </span>
          <span className="text-gray-700 tabular-nums">{formatCOP(tip)}</span>
        </div>
      )}
      <div className="flex justify-between pt-3 border-t border-gray-200">
        <span className="text-base font-bold text-gray-900">Total</span>
        <span className="text-base font-bold text-gray-900 tabular-nums">
          {formatCOP(total)}
        </span>
      </div>
    </div>
  );
}
