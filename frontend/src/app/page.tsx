"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, FileText, BarChart3, ExternalLink } from "lucide-react";
import { docsApi } from "@/lib/docs-api";
import type { DocsDocument } from "@/types";

export default function HomePage() {
  const [documents, setDocuments] = useState<DocsDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    docsApi
      .listDocuments()
      .then(setDocuments)
      .catch(() => setError("Impossible de charger les formulaires. Vérifiez votre connexion à docs."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900">Formulaires</span>
            <span className="text-xs text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">
              Suite Numérique
            </span>
          </div>
          <Link href="/forms/new" className="btn-primary">
            <Plus className="h-4 w-4" />
            Nouveau formulaire
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Mes formulaires</h1>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && documents.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-16 text-center">
            <FileText className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 mb-4">Aucun formulaire pour l&apos;instant</p>
            <Link href="/forms/new" className="btn-primary">
              <Plus className="h-4 w-4" />
              Créer mon premier formulaire
            </Link>
          </div>
        )}

        {!loading && !error && documents.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-medium text-gray-900 truncate flex-1">
                    {doc.title || "Formulaire sans titre"}
                  </h3>
                </div>
                <p className="text-xs text-gray-400 mb-4">
                  Modifié le {new Date(doc.updated_at).toLocaleDateString("fr-FR")}
                </p>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/editor/${doc.id}`}
                    className="btn-secondary text-xs px-3 py-1.5"
                  >
                    Éditer
                  </Link>
                  <Link
                    href={`/dashboard/${doc.id}`}
                    className="btn-secondary text-xs px-3 py-1.5"
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                    Réponses
                  </Link>
                  <Link
                    href={`/f/${doc.id}`}
                    target="_blank"
                    className="btn-secondary text-xs px-3 py-1.5"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
