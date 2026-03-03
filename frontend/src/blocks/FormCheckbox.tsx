import React from "react";
import { createReactBlockSpec } from "@blocknote/react";
import { useFormContext } from "./FormContext";
import { ConditionEditor } from "./ConditionEditor";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function FormCheckboxRenderer({ block, editor }: { block: any; editor: any }) {
  const { mode, answers, setAnswer, invalidFields } = useFormContext();
      const blockId = block.id;
      const isRequired = block.props.required === "true";
      const options = block.props.options
        .split("\n")
        .map((o) => o.trim())
        .filter(Boolean);

      const selected: string[] = Array.isArray(answers[blockId])
        ? (answers[blockId] as string[])
        : [];

      const toggle = (opt: string) => {
        const next = selected.includes(opt)
          ? selected.filter((s) => s !== opt)
          : [...selected, opt];
        setAnswer(blockId, next);
      };

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
            <div className="space-y-1.5 mb-2 pointer-events-none">
              {options.map((opt, i) => (
                <label key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <input type="checkbox" disabled className="h-3.5 w-3.5 rounded" />
                  {opt}
                </label>
              ))}
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Options (une par ligne) :</p>
              <textarea
                className="form-textarea text-xs"
                rows={3}
                value={block.props.options}
                onChange={(e) =>
                  editor.updateBlock(block, { props: { options: e.target.value } })
                }
              />
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
          <div className="space-y-2 mt-2" role="group" aria-invalid={isInvalid}>
            {options.map((opt, i) => (
              <label
                key={i}
                className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5
                           cursor-pointer hover:bg-primary-50 hover:border-primary-300 transition-colors
                           has-[:checked]:bg-primary-50 has-[:checked]:border-primary-400"
              >
                <input
                  type="checkbox"
                  value={opt}
                  checked={selected.includes(opt)}
                  onChange={() => toggle(opt)}
                  className="h-4 w-4 rounded text-primary-600"
                />
                <span className="text-sm text-gray-700">{opt}</span>
              </label>
            ))}
          </div>
          {isInvalid && (
            <p className="text-xs font-medium text-red-600 mt-2" role="alert">
              Ce champ est obligatoire.
            </p>
          )}
        </div>
      );
}

export const FormCheckbox = createReactBlockSpec(
  {
    type: "formCheckbox" as const,
    propSchema: {
      label: { default: "Question" },
      required: { default: "false" },
      helpText: { default: "" },
      options: { default: "Choix 1\nChoix 2\nChoix 3" },
      minSelect: { default: "0" },
      maxSelect: { default: "" },
      conditionEnabled: { default: "false" },
      conditionSourceBlockId: { default: "" },
      conditionOperator: { default: "answered" },
      conditionValue: { default: "" },
    },
    content: "none",
  },
  { render: FormCheckboxRenderer }
);
