import { Skeleton } from "@/components/ui/skeleton";

const SkeletonResults = () => (
  <div className="space-y-4">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="rounded-lg border border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>
    ))}
  </div>
);

export default SkeletonResults;
