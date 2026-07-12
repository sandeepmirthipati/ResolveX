import { Outlet } from 'react-router-dom'
import Navbar from '@/components/Navbar'

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-bg text-text-theme flex flex-col">
      <Navbar />
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  )
}
