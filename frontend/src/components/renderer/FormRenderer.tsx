"use client";

import React, { useState, useMemo } from "react";
import { CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import {
  FormShortTextRenderer,
  FormLongTextRenderer,
  FormMultipleChoiceRenderer,
  FormCheckboxRenderer,
  FormRatingRenderer,
  FormDateRenderer,
  FormDropdownRenderer,
  FormDividerRenderer,
} from "@/blocks";
import { FormContextProvider, useFormContext } from "@/blocks/FormContext";
import { formsApi } from "@/lib/forms-api";
import type { DocsDocument, FormAnswer, FormMode } from "@/types";

interface FormRendererProps {
  documentId: string;
  document: DocsDocument;
}

// ── Renderers pour les blocs standard BlockNote ───────────────────────────────

/** Extrait le texte brut d'un bloc BlockNote (inline content array). */
function getBlockText(block: FormBlock): string {
  const content = (block as unknown as { content?: Array<{ text?: string }> }).content;
  if (!Array.isArray(content)) return "";
  return content.map((c) => c.text ?? "").join("");
}

function ParagraphRenderer({ block }: { block: FormBlock; editor: null }) {
  const text = getBlockText(block);
  if (!text) return <div className="my-1" aria-hidden="true" />;
  return <p className="my-2 text-gray-800 text-sm leading-relaxed">{text}</p>;
}

function HeadingRenderer({ block }: { block: FormBlock; editor: null }) {
  const text = getBlockText(block);
  const level = Number((block.props as { level?: number }).level ?? 1);
  const classes: Record<number, string> = {
    1: "text-2xl font-bold text-gray-900 mt-6 mb-3",
    2: "text-xl font-semibold text-gray-800 mt-5 mb-2",
    3: "text-lg font-medium text-gray-700 mt-4 mb-2",
  };
  const cls = classes[level] ?? classes[3];
  if (level === 1) return <h2 className={cls}>{text}</h2>;
  if (level === 2) return <h3 className={cls}>{text}</h3>;
  return <h4 className={cls}>{text}</h4>;
}

function BulletListItemRenderer({ block }: { block: FormBlock; editor: null }) {
  const text = getBlockText(block);
  return (
    <li className="ml-5 list-disc text-sm text-gray-800 leading-relaxed my-0.5">{text}</li>
  );
}

function NumberedListItemRenderer({ block }: { block: FormBlock; editor: null }) {
  const text = getBlockText(block);
  return (
    <li className="ml-5 list-decimal text-sm text-gray-800 leading-relaxed my-0.5">{text}</li>
  );
}

function ImageBlockRenderer({ block }: { block: FormBlock; editor: null }) {
  const { url, caption, width, textAlignment } = block.props as {
    url?: string;
    caption?: string;
    width?: string;
    textAlignment?: "left" | "center" | "right";
  };

  if (!url) return null;

  const alignClass =
    textAlignment === "center"
      ? "mx-auto"
      : textAlignment === "right"
      ? "ml-auto"
      : "";

  return (
    <figure className="my-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={caption ?? ""}
        style={{ width: width ? `${width}px` : "100%", maxWidth: "100%" }}
        className={`rounded ${alignClass}`}
      />
      {caption && (
        <figcaption className="text-center text-xs text-gray-400 mt-1">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

// Registre des composants de rendu par type de bloc (contourne la closure interne de createReactBlockSpec)
const BLOCK_RENDERERS: Record<string, React.ComponentType<{ block: FormBlock; editor: null }>> = {
  // Blocs de formulaire personnalisés
  formShortText: FormShortTextRenderer,
  formLongText: FormLongTextRenderer,
  formMultipleChoice: FormMultipleChoiceRenderer,
  formCheckbox: FormCheckboxRenderer,
  formRating: FormRatingRenderer,
  formDate: FormDateRenderer,
  formDropdown: FormDropdownRenderer,
  formDivider: FormDividerRenderer,
  // Blocs standard BlockNote
  paragraph: ParagraphRenderer,
  heading: HeadingRenderer,
  bulletListItem: BulletListItemRenderer,
  numberedListItem: NumberedListItemRenderer,
  image: ImageBlockRenderer,
};

export function FormRenderer({ documentId, document }: FormRendererProps) {
  const [answers, setAnswers] = useState<FormAnswer>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());

  const content = document.content as unknown[];

  // Découpe le contenu en pages à chaque bloc formPageBreak.
  // pageBreaks[i] = le bloc formPageBreak qui précède la page i (null pour la page 0).
  const { pages, pageBreaks } = useMemo(() => {
    const pages: unknown[][] = [[]];
    const pageBreaks: (FormBlock | null)[] = [null];
    for (const block of content ?? []) {
      if ((block as { type?: string }).type === "formPageBreak") {
        pages.push([]);
        pageBreaks.push(block as FormBlock);
      } else {
        pages[pages.length - 1].push(block);
      }
    }
    return { pages, pageBreaks };
  }, [content]);

  /** Retourne true si la page doit être affichée (condition du saut de page satisfaite). */
  const isPageVisible = (pageIndex: number): boolean => {
    const pb = pageBreaks[pageIndex];
    if (!pb) return true; // première page : toujours visible
    return evaluateCondition(pb, answers);
  };

  /** Retourne l'index de la prochaine page visible après `from`, ou -1. */
  const findNextPage = (from: number): number => {
    for (let i = from + 1; i < pages.length; i++) {
      if (isPageVisible(i)) return i;
    }
    return -1;
  };

  /** Retourne l'index de la page visible précédente avant `from`, ou -1. */
  const findPrevPage = (from: number): number => {
    for (let i = from - 1; i >= 0; i--) {
      if (isPageVisible(i)) return i;
    }
    return -1;
  };

  const totalPages = pages.length;
  const isPaginated = totalPages > 1;
  const isLastPage = findNextPage(currentPage) === -1;

  // Progression basée sur les pages visibles
  const visiblePageIndices = pages.map((_, i) => i).filter(isPageVisible);
  const visiblePos = Math.max(0, visiblePageIndices.indexOf(currentPage));
  const visibleTotal = visiblePageIndices.length;
  const progressPct = Math.round(((visiblePos + 1) / Math.max(1, visibleTotal)) * 100);

  const setAnswer = (blockId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [blockId]: value as FormAnswer[string] }));
    // Dès que l'utilisateur remplit un champ, on retire le marqueur d'erreur
    setInvalidFields((prev) => {
      if (!prev.has(blockId)) return prev;
      const next = new Set(prev);
      next.delete(blockId);
      return next;
    });
  };

  /** Retourne les blocs de saisie obligatoires non remplis sur la page courante. */
  const getMissingRequired = (): FormBlock[] => {
    const collectBlocks = (blocks: unknown[]): FormBlock[] =>
      blocks.flatMap((b) => {
        const block = b as FormBlock;
        const acc: FormBlock[] = [];
        if (block.props?.required === "true") acc.push(block);
        if (block.children?.length) acc.push(...collectBlocks(block.children));
        return acc;
      });

    return collectBlocks(pages[currentPage] ?? [])
      .filter((b) => evaluateCondition(b, answers)) // exclure les blocs masqués
      .filter((b) => {
        const val = answers[b.id];
        if (Array.isArray(val)) return val.length === 0;
        return val === undefined || val === null || val === "" || val === false;
      });
  };

  const goNext = () => {
    const next = findNextPage(currentPage);
    if (next !== -1) setCurrentPage(next);
    setError(null);
    setInvalidFields(new Set());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goPrev = () => {
    const prev = findPrevPage(currentPage);
    if (prev !== -1) setCurrentPage(prev);
    setError(null);
    setInvalidFields(new Set());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validation des champs obligatoires de la page courante
    const missing = getMissingRequired();
    if (missing.length > 0) {
      setInvalidFields(new Set(missing.map((b) => b.id)));
      setError("Veuillez remplir les champs obligatoires indiqués.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setInvalidFields(new Set());
    if (!isLastPage) {
      goNext();
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await formsApi.submitResponse(documentId, answers);
      setSubmitted(true);
      if (res.redirect_url) {
        setRedirectUrl(res.redirect_url);
        setTimeout(() => {
          window.location.href = res.redirect_url!;
        }, 2000);
      }
    } catch {
      setError("Une erreur s'est produite lors de la soumission. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-2xl bg-white shadow-lg p-10 text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Réponse envoyée !</h2>
        <p className="text-gray-500">Merci pour votre participation.</p>
        {redirectUrl && (
          <p className="text-sm text-gray-400 mt-3">Redirection en cours...</p>
        )}
      </div>
    );
  }

  return (
    <FormContextProvider mode="fill" answers={answers} setAnswer={setAnswer} invalidFields={invalidFields}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="rounded-2xl bg-white shadow-lg overflow-hidden">
          {/* En-tête */}
          <div className="bg-primary-600 px-8 py-8">
            <h1 className="text-2xl font-bold text-white">
              {document.title || "Formulaire sans titre"}
            </h1>
            {isPaginated && (
              <p className="text-primary-200 text-sm mt-1" aria-live="polite">
                Page {visiblePos + 1} sur {visibleTotal}
              </p>
            )}
          </div>

          {/* Barre de progression */}
          {isPaginated && (
            <div
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progression du formulaire : ${progressPct}%`}
              className="h-1.5 bg-gray-100"
            >
              <div
                className="h-full bg-primary-500 transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}

          <div className="px-8 py-8">
            <FormBlocksRenderer blocks={pages[currentPage] ?? []} />

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 mb-4 text-red-700 text-sm" role="alert">
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                {error}
              </div>
            )}

            {/* Navigation */}
            <div className={`flex gap-3 ${findPrevPage(currentPage) !== -1 ? "justify-between" : "justify-end"}`}>
              {findPrevPage(currentPage) !== -1 && (
                <button
                  type="button"
                  onClick={goPrev}
                  className="btn-secondary py-3 px-6"
                  aria-label="Page précédente"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  Précédent
                </button>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary py-3 px-6 flex-1 justify-center"
              >
                {isLastPage ? (
                  submitting ? "Envoi en cours..." : "Soumettre"
                ) : (
                  <>
                    Suivant
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </FormContextProvider>
  );
}

type FormBlock = { id: string; type: string; props: Record<string, string>; children?: unknown[] };

/**
 * Évalue la condition d'affichage d'un bloc.
 * Retourne true si le bloc doit être affiché, false sinon.
 */
function evaluateCondition(block: FormBlock, answers: FormAnswer): boolean {
  if (block.props?.conditionEnabled !== "true") return true;
  const sourceId = block.props.conditionSourceBlockId;
  if (!sourceId) return true; // pas de source configurée → affiché par défaut

  const raw = answers[sourceId];
  const isAnswered =
    raw !== undefined &&
    raw !== null &&
    raw !== "" &&
    raw !== false &&
    !(Array.isArray(raw) && raw.length === 0);

  switch (block.props.conditionOperator ?? "answered") {
    case "eq":
      return String(raw ?? "") === (block.props.conditionValue ?? "");
    case "neq":
      return String(raw ?? "") !== (block.props.conditionValue ?? "");
    case "answered":
      return isAnswered;
    case "notAnswered":
      return !isAnswered;
    default:
      return true;
  }
}

/** Composant wrapper pour chaque bloc — respecte les Rules of Hooks. */
function FormBlockRenderer({
  block,
  mode,
  answers,
  setAnswer,
  invalidFields,
}: {
  block: FormBlock;
  mode: FormMode;
  answers: FormAnswer;
  setAnswer: (blockId: string, value: unknown) => void;
  invalidFields: Set<string>;
}) {
  const Render = BLOCK_RENDERERS[block.type];
  if (!Render) return null;

  return (
    <FormContextProvider mode={mode} answers={answers} setAnswer={setAnswer} invalidFields={invalidFields}>
      <Render block={block} editor={null} />
    </FormContextProvider>
  );
}

function FormBlocksRenderer({ blocks }: { blocks: unknown[] }) {
  const { mode, answers, setAnswer, invalidFields } = useFormContext();

  const formBlocks = (blocks ?? []).flatMap(function collect(b): FormBlock[] {
    const block = b as FormBlock;
    const acc: FormBlock[] = [];
    if (block.type && block.type in BLOCK_RENDERERS) acc.push(block);
    if (block.children?.length) acc.push(...block.children.flatMap(collect));
    return acc;
  });

  // En mode fill, n'afficher que les blocs dont la condition est satisfaite
  const visibleBlocks =
    mode === "fill"
      ? formBlocks.filter((b) => evaluateCondition(b, answers))
      : formBlocks;

  if (!formBlocks.length) {
    return (
      <div className="text-center text-gray-400 py-8">
        Ce formulaire ne contient pas encore de champs.
      </div>
    );
  }

  return (
    <>
      {visibleBlocks.map((block) => (
        <FormBlockRenderer
          key={block.id}
          block={block}
          mode={mode}
          answers={answers}
          setAnswer={setAnswer}
          invalidFields={invalidFields}
        />
      ))}
    </>
  );
}
