import React from 'react'

export default function StoreSlugLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark store-fixed-dark min-h-screen bg-surface-0 text-white">
      {children}
    </div>
  )
}
