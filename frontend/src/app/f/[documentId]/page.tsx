"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { FormRenderer } from "@/components/renderer/FormRenderer";
import { docsApi } from "@/lib/docs-api";
import type { DocsDocument } from "@/types";

export default function PublicFormPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const [document, setDocument] = useState<DocsDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    docsApi
      .getDocument(documentId)
      .then(setDocument)
      .catch(() => setError("Formulaire introuvable ou inaccessible."))
      .finally(() => setLoading(false));
  }, [documentId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900 mb-2">Formulaire indisponible</p>
          <p className="text-gray-500">{error ?? "Ce formulaire n'existe pas."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white py-12 px-4">
      <div className="mx-auto max-w-2xl">
        <FormRenderer documentId={documentId} document={document} />
      </div>
    </div>
  );
}
