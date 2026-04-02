import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-3">Shop Pipeline App</h1>
      <p className="text-gray-600 mb-6">
        Chapter 17 demo — end-to-end ML pipeline for late delivery prediction.
      </p>
      <Link
        href="/select-customer"
        className="inline-block bg-blue-600 text-white px-5 py-2 rounded font-medium hover:bg-blue-700 transition-colors"
      >
        Get started →
      </Link>
    </div>
  );
}
