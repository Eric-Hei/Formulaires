import React from "react";
import { createReactBlockSpec } from "@blocknote/react";
import { Star } from "lucide-react";
import { useFormContext } from "./FormContext";
import { ConditionEditor } from "./ConditionEditor";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function FormRatingRenderer({ block, editor }: { block: any; editor: any }) {
  const { mode, answers, setAnswer, invalidFields } = useFormContext();
      const blockId = block.id;
      const isRequired = block.props.required === "true";
      const max = parseInt(block.props.maxRating, 10) || 5;
      const stars = Array.from({ length: max }, (_, i) => i + 1);
      const current = answers[blockId] as number | undefined;

      if (mode === "edit") {
        return (
          <div className="form-block-wrapper">
            <div className="flex items-start justify-between mb-2">
              <input
                className="flex-1 text-sm font-medium text-gray-800 bg-transparent border-b border-dashed border-gray-300
                           focus:border-primary-400 focus:outline-none pb-0.5 mr-2"
                value={block.props.label}
                onChange={(e) =>
                  editor.updateBlock(block, { props: { label: e.target.value } })
                }
                placeholder="Intitulé de la question"
              />
              <label className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                <input
                  type="checkbox"
                  checked={isRequired}
                  onChange={(e) =>
                    editor.updateBlock(block, {
                      props: { required: e.target.checked ? "true" : "false" },
                    })
                  }
                  className="h-3 w-3"
                />
                Obligatoire
              </label>
            </div>
            <div className="flex items-center gap-1 mb-2">
              {stars.map((n) => (
                <Star key={n} className="h-6 w-6 text-yellow-400 fill-yellow-400 opacity-50" />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400">Nombre d&apos;étoiles :</label>
              <select
                className="form-input text-xs w-20"
                value={block.props.maxRating}
                onChange={(e) =>
                  editor.updateBlock(block, { props: { maxRating: e.target.value } })
                }
              >
                {[3, 5, 7, 10].map((n) => (
                  <option key={n} value={String(n)}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <ConditionEditor block={block} editor={editor} />
          </div>
        );
      }

      const isInvalid = mode === "fill" && invalidFields.has(blockId);
      return (
        <div className={`mb-6 rounded-xl transition-colors ${isInvalid ? "ring-2 ring-red-400 bg-red-50 p-3" : ""}`}>
          <label className="form-block-label">
            {block.props.label}
            {isRequired && <span className="form-block-required">*</span>}
          </label>
          {block.props.helpText && (
            <p className="text-xs text-gray-400 mb-1">{block.props.helpText}</p>
          )}
          <div className="flex items-center gap-1 mt-2" aria-invalid={isInvalid}>
            {stars.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setAnswer(blockId, n)}
                className="focus:outline-none transition-transform hover:scale-110"
                aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
              >
                <Star
                  className={`h-8 w-8 transition-colors ${
                    current !== undefined && n <= current
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-300"
                  }`}
                  aria-hidden="true"
                />
              </button>
            ))}
            {current !== undefined && (
              <span className="ml-2 text-sm text-gray-500">{current}/{max}</span>
            )}
          </div>
          {isInvalid && (
            <p className="text-xs font-medium text-red-600 mt-2" role="alert">
              Ce champ est obligatoire.
            </p>
          )}
        </div>
      );
}

export const FormRating = createReactBlockSpec(
  {
    type: "formRating" as const,
    propSchema: {
      label: { default: "Évaluation" },
      required: { default: "false" },
      helpText: { default: "" },
      maxRating: { default: "5" },
      conditionEnabled: { default: "false" },
      conditionSourceBlockId: { default: "" },
      conditionOperator: { default: "answered" },
      conditionValue: { default: "" },
    },
    content: "none",
  },
  { render: FormRatingRenderer }
);
