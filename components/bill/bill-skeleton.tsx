import { Skeleton } from "@/components/ui/skeleton";

export function BillSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-11 h-11 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="space-y-3 mt-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex justify-between py-3">
            <div className="space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
      <div className="space-y-2 pt-4 border-t border-gray-100">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="flex justify-between pt-2">
          <Skeleton className="h-5 w-14" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>
      <Skeleton className="h-14 w-full rounded-2xl mt-4" />
    </div>
  );
}
