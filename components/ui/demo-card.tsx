export function DemoCard() {
  return (
    <div className="card p-6 space-y-6">
      <h3 className="text-lg font-semibold">Theme System Demo</h3>
      
      {/* Color Palette */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-primary-500 text-white p-4 rounded-xl text-center">
          Primary
        </div>
        <div className="bg-success-500 text-white p-4 rounded-xl text-center">
          Success
        </div>
        <div className="bg-warning-500 text-white p-4 rounded-xl text-center">
          Warning
        </div>
        <div className="bg-error-500 text-white p-4 rounded-xl text-center">
          Error
        </div>
      </div>
      
      {/* Button Variants */}
      <div className="flex flex-wrap gap-3">
        <button className="btn btn-primary btn-md">Primary</button>
        <button className="btn btn-secondary btn-md">Secondary</button>
        <button className="btn btn-ghost btn-md">Ghost</button>
        <button className="btn btn-destructive btn-md">Destructive</button>
      </div>
      
      {/* Badge Variants */}
      <div className="flex flex-wrap gap-2">
        <span className="badge badge-primary">Primary</span>
        <span className="badge badge-success">Success</span>
        <span className="badge badge-warning">Warning</span>
        <span className="badge badge-error">Error</span>
      </div>
      
      {/* Input Demo */}
      <input 
        type="text" 
        placeholder="Enter text here..." 
        className="input"
      />
    </div>
  )
}