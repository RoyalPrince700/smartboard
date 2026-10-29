import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-board-bg flex flex-col items-center justify-center text-white">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-white/60 mb-8">Page not found</p>
      <Link to="/boards" className="text-board-accent hover:underline">
        Go to boards
      </Link>
    </div>
  );
}
