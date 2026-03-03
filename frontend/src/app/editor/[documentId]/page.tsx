"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, Share2, Check, BarChart3, Settings, Save, Users } from "lucide-react";
import { FormEditor } from "@/components/editor/FormEditor";
import { docsApi } from "@/lib/docs-api";
import { formsApi } from "@/lib/forms-api";
import type { DocsDocument, FormSettingsData } from "@/types";

export default function EditorPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const router = useRouter();
  const [document, setDocument] = useState<DocsDocument | null>(null);
  const [formSettings, setFormSettings] = useState<FormSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);
  // État local découplé pour l'input titre (évite que onChange écrase document.title avant onBlur)
  const [titleInput, setTitleInput] = useState("");
  const savedTitleRef = useRef<string>("");

  useEffect(() => {
    Promise.all([
      docsApi.getDocument(documentId),
      formsApi.getSettings(documentId),
    ])
      .then(([doc, settings]) => {
        setDocument(doc);
        setFormSettings(settings);
        setTitleInput(doc.title);
        savedTitleRef.current = doc.title;
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [documentId]);

  const handleSave = async (blocks: unknown[]) => {
    if (!document) return;
    setSaving(true);
    try {
      await docsApi.updateDocument(documentId, { content: blocks });
    } finally {
      setSaving(false);
    }
  };

  const handleTitleChange = async () => {
    const trimmed = titleInput.trim() || "Nouveau formulaire";
    // Comparer avec le titre sauvegardé (pas le state document qui a déjà été mis à jour)
    if (!document || trimmed === savedTitleRef.current) {
      setTitleInput(trimmed); // Normalise si l'utilisateur a mis des espaces
      return;
    }
    savedTitleRef.current = trimmed;
    setTitleInput(trimmed);
    setDocument({ ...document, title: trimmed });
    try {
      await docsApi.updateDocument(documentId, { title: trimmed });
    } catch (e) {
      console.error("Erreur lors de la mise à jour du titre", e);
    }
  };

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/f/${documentId}`;
  const docsUrl = `${process.env.NEXT_PUBLIC_DOCS_FRONTEND_URL}/${documentId}/`;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <header className="border-b border-gray-200 bg-white shadow-sm z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <input
              className="text-base font-semibold text-gray-900 bg-transparent border-b border-transparent
                         hover:border-gray-300 focus:border-primary-400 focus:outline-none
                         truncate max-w-xs px-0.5"
              value={titleInput}
              aria-label="Titre du formulaire"
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleTitleChange}
              onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
            />
            {saving && (
              <span className="text-xs text-gray-400">Enregistrement...</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              <Settings className="h-3.5 w-3.5" />
              Paramètres
            </button>
            <Link
              href={`/dashboard/${documentId}`}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Réponses
            </Link>
            <button
              onClick={() => {
                navigator.clipboard.writeText(shareUrl).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                });
              }}
              className="btn-secondary text-xs px-3 py-1.5"
              aria-label={copied ? "Lien copié dans le presse-papier" : "Copier le lien de partage"}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-green-600" aria-hidden="true" />
                  <span className="text-green-600">Lien copié !</span>
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Copier le lien
                </>
              )}
            </button>
            <a
              href={docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs px-3 py-1.5"
              aria-label="Donner l'accès à mes équipiers"
            >
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              Donner l'accès à mes équipiers
            </a>
            <Link
              href={`/f/${documentId}`}
              target="_blank"
              className="btn-primary text-xs px-3 py-1.5"
            >
              <Eye className="h-3.5 w-3.5" />
              Aperçu
            </Link>
          </div>
        </div>
      </header>

      {showSettings && formSettings && (
        <FormSettingsPanel
          documentId={documentId}
          settings={formSettings}
          onClose={() => setShowSettings(false)}
          onSave={setFormSettings}
        />
      )}

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <FormEditor
            documentId={documentId}
            initialContent={document?.content ?? []}
            onSave={handleSave}
          />
        </div>
      </div>
    </div>
  );
}

function FormSettingsPanel({
  documentId,
  settings,
  onClose,
  onSave,
}: {
  documentId: string;
  settings: FormSettingsData;
  onClose: () => void;
  onSave: (s: FormSettingsData) => void;
}) {
  const [local, setLocal] = useState(settings);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await formsApi.updateSettings(documentId, local);
      onSave(updated);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-b border-gray-200 bg-white shadow-sm px-4 py-4">
      <div className="mx-auto max-w-3xl">
        <h3 className="font-medium text-gray-900 mb-4">Paramètres du formulaire</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={local.is_open}
              onChange={(e) => setLocal({ ...local, is_open: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-primary-600"
            />
            <span className="text-sm text-gray-700">Accepter les réponses</span>
          </label>

          <div>
            <label className="form-block-label">Nombre max. de réponses</label>
            <input
              type="number"
              value={local.max_responses ?? ""}
              onChange={(e) =>
                setLocal({ ...local, max_responses: e.target.value ? +e.target.value : null })
              }
              className="form-input"
              placeholder="Illimité"
            />
          </div>

          <div>
            <label className="form-block-label">Date de fermeture</label>
            <input
              type="datetime-local"
              value={local.close_date ?? ""}
              onChange={(e) => setLocal({ ...local, close_date: e.target.value || null })}
              className="form-input"
            />
          </div>

          <div>
            <label className="form-block-label">URL de redirection après soumission</label>
            <input
              type="url"
              value={local.redirect_url ?? ""}
              onChange={(e) => setLocal({ ...local, redirect_url: e.target.value })}
              className="form-input"
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <button onClick={save} disabled={saving} className="btn-primary text-sm">
            <Save className="h-4 w-4" />
            Enregistrer
          </button>
          <button onClick={onClose} className="btn-secondary text-sm">
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
