import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas p-6 text-center">
      <p className="font-display text-6xl font-bold text-primary">404</p>
      <h1 className="mt-3 font-display text-xl font-semibold text-ink">Page not found</h1>
      <p className="mt-1 text-sm text-muted">The page you are looking for does not exist or was moved.</p>
      <Link to="/workspaces" className="btn-primary mt-6">Back to workspaces</Link>
    </div>
  );
}
