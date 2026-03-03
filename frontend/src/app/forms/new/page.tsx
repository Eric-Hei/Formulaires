"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { docsApi } from "@/lib/docs-api";

export default function NewFormPage() {
  const router = useRouter();

  useEffect(() => {
    docsApi
      .createDocument({ title: "Nouveau formulaire", content: [] })
      .then((doc) => {
        router.replace(`/editor/${doc.id}`);
      })
      .catch(console.error);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent mx-auto mb-3" />
        <p className="text-gray-500">Création du formulaire...</p>
      </div>
    </div>
  );
}
