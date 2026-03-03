"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { docsApi } from "@/lib/docs-api";
import type { DocsDocument } from "@/types";

export default function DashboardPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const [document, setDocument] = useState<DocsDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    docsApi
      .getDocument(documentId)
      .then(setDocument)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [documentId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/editor/${documentId}`} className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-base font-semibold text-gray-900">
                {document?.title || "Formulaire sans titre"}
              </h1>
              <p className="text-xs text-gray-400">Tableau de bord des réponses</p>
            </div>
          </div>
          <a
            href={`${process.env.NEXT_PUBLIC_FORMS_API_URL}/api/forms/${documentId}/responses/?format=csv`}
            className="btn-secondary text-sm"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Dashboard documentId={documentId} document={document} />
      </main>
    </div>
  );
}
