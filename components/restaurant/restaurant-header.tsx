import Image from "next/image";

interface RestaurantHeaderProps {
  name: string;
  logoUrl: string | null;
  tableLabel: string | null;
  tableNumber: number;
}

export function RestaurantHeader({
  name,
  logoUrl,
  tableLabel,
  tableNumber,
}: RestaurantHeaderProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-4">
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={name}
          width={44}
          height={44}
          className="rounded-xl object-cover"
        />
      ) : (
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md"
          style={{ backgroundColor: "var(--r-primary)" }}
        >
          {name.charAt(0)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="font-semibold text-gray-900 text-base truncate">{name}</h1>
        <p className="text-xs text-gray-500">
          {tableLabel || `Mesa ${tableNumber}`}
        </p>
      </div>
    </div>
  );
}
