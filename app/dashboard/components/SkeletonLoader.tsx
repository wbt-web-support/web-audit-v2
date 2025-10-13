'use client'

import { motion } from 'framer-motion'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'rectangular' | 'circular' | 'card'
  width?: string | number
  height?: string | number
  lines?: number
}

export function Skeleton({ 
  className = '', 
  variant = 'rectangular', 
  width, 
  height, 
  lines = 1 
}: SkeletonProps) {
  const baseClasses = 'bg-gray-200 rounded animate-pulse'
  
  const variantClasses = {
    text: 'h-4',
    rectangular: 'h-4',
    circular: 'rounded-full',
    card: 'h-32'
  }

  const style = {
    width: width || '100%',
    height: height || undefined
  }

  if (lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <motion.div
            key={index}
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={index === lines - 1 ? { width: '75%' } : style}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1 }}
          />
        ))}
      </div>
    )
  }

  return (
    <motion.div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    />
  )
}

// Project Card Skeleton
export function ProjectCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg  border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <Skeleton variant="rectangular" width={120} height={24} />
          <Skeleton variant="circular" width={60} height={24} />
          <Skeleton variant="rectangular" width={80} height={16} />
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <Skeleton variant="rectangular" width={40} height={32} />
            <Skeleton variant="rectangular" width={30} height={16} className="mt-1" />
          </div>
          <Skeleton variant="circular" width={32} height={32} />
        </div>
      </div>
      
      <Skeleton variant="rectangular" width="100%" height={16} className="mb-3" />
      
      <div className="flex items-center space-x-6">
        <Skeleton variant="rectangular" width={80} height={16} />
        <Skeleton variant="rectangular" width={80} height={16} />
        <Skeleton variant="rectangular" width={80} height={16} />
        <Skeleton variant="rectangular" width={100} height={16} />
      </div>
    </motion.div>
  )
}

// Recent Project Item Skeleton
export function RecentProjectSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="group flex items-center justify-between p-4 rounded-lg border border-gray-100"
    >
      <div className="flex-1">
        <div className="flex items-center mb-2">
          <Skeleton variant="rectangular" width={120} height={20} />
          <Skeleton variant="circular" width={60} height={20} className="ml-3" />
        </div>
        <Skeleton variant="rectangular" width={100} height={16} className="mb-2" />
        <div className="flex items-center space-x-4">
          <Skeleton variant="rectangular" width={80} height={16} />
          <Skeleton variant="rectangular" width={100} height={16} />
        </div>
      </div>
      <div className="flex flex-col items-end space-y-2">
        <div className="text-right">
          <Skeleton variant="rectangular" width={40} height={16} />
          <Skeleton variant="rectangular" width={80} height={8} className="mt-1" />
        </div>
        <Skeleton variant="rectangular" width={100} height={16} />
      </div>
    </motion.div>
  )
}

// Stats Card Skeleton
export function StatsCardSkeleton() {
  return (
    <div className="bg-white rounded-lg  border border-gray-200 p-4">
      <div className="flex items-center">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="ml-3">
          <Skeleton variant="rectangular" width={100} height={16} />
          <Skeleton variant="rectangular" width={60} height={24} className="mt-1" />
        </div>
      </div>
    </div>
  )
}
