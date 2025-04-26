import { AnalyticsDashboard } from './components/AnalyticsDashboard'
import { useAnalytics } from './hooks/useAnalytics'
import './App.css'

function App() {
  // Initialize analytics tracking
  useAnalytics()

  return (
    <div className="min-h-screen bg-blue-50">
      <AnalyticsDashboard />
    </div>
  )
}

export default App
