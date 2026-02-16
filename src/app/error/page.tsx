"use client";
import { useRouter } from "next/navigation";

export default function ErrorPage() {
  const router = useRouter();
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Error</h1>
      <p style={{ marginTop: 12 }}>
        Something went wrong. Please go back and try again.
      </p>
      <button onClick={() => router.back()} style={{ marginTop: 16, padding: "10px 14px" }}>
        Go Back
      </button>
    </div>
  );
}
