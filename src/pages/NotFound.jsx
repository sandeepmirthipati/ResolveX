import { Link, useNavigate } from 'react-router-dom'
import { Home, ArrowLeft, Search, Shield } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6 py-12">
      <div className="max-w-lg w-full text-center animate-fadeUp">
        {/* Animated 404 */}
        <div className="relative mb-8">
          <div className="text-[160px] sm:text-[200px] font-black text-border-theme/40 leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-primary-light border-2 border-primary-mid/30 flex items-center justify-center animate-float">
              <Search className="w-12 h-12 text-primary" />
            </div>
          </div>
        </div>

        {/* Text */}
        <h1 className="text-3xl font-bold text-text-theme mb-3">Page not found</h1>
        <p className="text-muted-theme text-base leading-relaxed mb-8 max-w-sm mx-auto">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
          <Button size="lg" leftIcon={Home} onClick={() => navigate('/')}>
            Back to Home
          </Button>
          <Button size="lg" variant="outline" leftIcon={ArrowLeft} onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>

        {/* Quick links */}
        <div className="bg-card border border-border-theme rounded-2xl p-6 shadow-[var(--shadow-sm)]">
          <p className="text-xs font-semibold text-muted-theme uppercase tracking-wider mb-4">Helpful Links</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { to: '/', label: 'Landing Page' },
              { to: '/dashboard', label: 'Customer Dashboard' },
              { to: '/admin/dashboard', label: 'Admin Dashboard' },
            ].map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center gap-2 px-4 py-3 bg-bg-alt rounded-xl border border-border-theme text-sm font-medium text-text-theme hover:bg-primary-light hover:border-primary-mid/30 hover:text-primary transition-all duration-200"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-center gap-2 text-subtle-theme">
          <Shield className="w-3.5 h-3.5" />
          <span className="text-xs">ResolveX — Smart Complaint Management</span>
        </div>
      </div>
    </div>
  )
}
