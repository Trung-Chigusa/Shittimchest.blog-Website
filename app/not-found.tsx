import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-4 text-center">
      <div className="glass-panel max-w-lg p-8">
        <p className="cyber-label">404</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Page not found</h1>
        <p className="mt-3 text-slate-400">This node does not exist or moved to another route.</p>
        <Link href="/vi" className="mt-6 inline-block">
          <Button>Back home</Button>
        </Link>
      </div>
    </main>
  );
}
