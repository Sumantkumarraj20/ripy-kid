import type { Metadata } from 'next'
import { DemoCard } from '@/components/ui/demo-card'

export const metadata: Metadata = {
  title: 'Kid Track - Child Safety & Location Tracking',
  description: 'Keep your children safe with real-time location tracking and safety features',
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="section-padding">
        <div className="container-custom">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Beautiful, Consistent Design
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A robust theme system with dark mode support, animations, and reusable components.
            </p>
          </div>

          {/* Theme Demo */}
          <div className="max-w-4xl mx-auto animate-slide-up">
            <DemoCard />
          </div>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="card p-6 text-center animate-scale-in">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                🎨
              </div>
              <h3 className="font-semibold mb-2">Design System</h3>
              <p className="text-muted-foreground text-sm">
                Consistent colors, typography, and spacing throughout your app.
              </p>
            </div>

            <div className="card p-6 text-center animate-scale-in" style={{ animationDelay: '100ms' }}>
              <div className="w-12 h-12 bg-success-100 text-success-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                🌙
              </div>
              <h3 className="font-semibold mb-2">Dark Mode</h3>
              <p className="text-muted-foreground text-sm">
                Seamless dark/light mode switching with automatic system preference detection.
              </p>
            </div>

            <div className="card p-6 text-center animate-scale-in" style={{ animationDelay: '200ms' }}>
              <div className="w-12 h-12 bg-warning-100 text-warning-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                ⚡
              </div>
              <h3 className="font-semibold mb-2">Performance</h3>
              <p className="text-muted-foreground text-sm">
                Optimized CSS with PurgeCSS and minimal runtime overhead.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}