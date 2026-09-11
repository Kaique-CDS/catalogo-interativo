import { Skeleton } from '@/components/ui/skeleton'

export default function StorefrontLoading() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6 flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-xl" />
          <Skeleton className="h-7 w-48" />
        </div>
      </div>
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-3 flex-wrap mb-8">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border overflow-hidden">
              <Skeleton className="h-52 w-full" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}