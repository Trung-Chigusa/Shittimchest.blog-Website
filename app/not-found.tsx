import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-4 text-center">
      <div className="max-w-md">
        <p className="text-gradient font-display text-8xl font-extrabold">404</p>
        <h1 className="mt-4 text-2xl font-bold">Không tìm thấy trang · Page not found</h1>
        <Link href="/vi" className={buttonClasses({ className: "mt-8" })}>
          Về trang chủ · Home
        </Link>
      </div>
    </main>
  );
}
