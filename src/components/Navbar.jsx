import { Link } from 'react-router-dom'
import { Moon, Sun, Zap } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

export default function Navbar() {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-bg/90 backdrop-blur-md border-b border-border-theme">
      <div className="container-custom h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-text-theme">
            Resolve<span className="text-primary">X</span>
          </span>
        </Link>

        {/* Theme toggle only */}
        <button
          onClick={toggleTheme}
          className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-bg-alt transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'light'
            ? <Moon className="h-4 w-4 text-muted-theme" />
            : <Sun className="h-4 w-4 text-muted-theme" />}
        </button>
      </div>
    </header>
  )
}