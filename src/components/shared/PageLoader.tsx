import { Skeleton } from '@/components/ui/skeleton'

export function PageLoader() {
  return (
    <div className="space-y-4 p-2">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
      <Skeleton className="mt-6 h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  )
}
