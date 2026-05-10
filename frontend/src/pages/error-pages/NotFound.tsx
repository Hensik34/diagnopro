export function NotFound() {
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded p-8 text-center">
        <h1 className="text-foreground text-lg mb-1">404 - Page Not Found</h1>
        <p className="text-muted-foreground text-sm">The page you're looking for doesn't exist.</p>
      </div>
    </div>
  );
}
