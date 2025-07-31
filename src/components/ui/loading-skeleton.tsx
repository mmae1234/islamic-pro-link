import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface LoadingSkeletonProps {
  className?: string
  count?: number
  variant?: 'default' | 'card' | 'profile' | 'message'
}

const LoadingSkeleton = ({ 
  className, 
  count = 1, 
  variant = 'default' 
}: LoadingSkeletonProps) => {
  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <div className="p-6 space-y-4">
            <div className="flex items-start space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
            <div className="flex space-x-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-14" />
            </div>
          </div>
        )
      
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          </div>
        )
      
      case 'message':
        return (
          <div className="flex items-start space-x-3 p-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        )
      
      default:
        return <Skeleton className={cn("h-4 w-full", className)} />
    }
  }

  return (
    <div className="animate-fade-in">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={cn("mb-4 last:mb-0", className)}>
          {renderSkeleton()}
        </div>
      ))}
    </div>
  )
}

export { LoadingSkeleton }