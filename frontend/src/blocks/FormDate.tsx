import React from "react";
import { createReactBlockSpec } from "@blocknote/react";
import { useFormContext } from "./FormContext";
import { ConditionEditor } from "./ConditionEditor";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function FormDateRenderer({ block, editor }: { block: any; editor: any }) {
  const { mode, answers, setAnswer, invalidFields } = useFormContext();
      const blockId = block.id;
      const isRequired = block.props.required === "true";
      const includeTime = block.props.includeTime === "true";

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
            <input
              type={includeTime ? "datetime-local" : "date"}
              className="form-input text-sm"
              disabled
            />
            <label className="flex items-center gap-1 text-xs text-gray-400 mt-1">
              <input
                type="checkbox"
                checked={includeTime}
                onChange={(e) =>
                  editor.updateBlock(block, {
                    props: { includeTime: e.target.checked ? "true" : "false" },
                  })
                }
                className="h-3 w-3"
              />
              Inclure l&apos;heure
            </label>
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
          <input
            type={includeTime ? "datetime-local" : "date"}
            className="form-input"
            value={(answers[blockId] as string) ?? ""}
            onChange={(e) => setAnswer(blockId, e.target.value)}
            required={isRequired}
            aria-invalid={isInvalid}
          />
          {isInvalid && (
            <p className="text-xs font-medium text-red-600 mt-2" role="alert">
              Ce champ est obligatoire.
            </p>
          )}
        </div>
      );
}

export const FormDate = createReactBlockSpec(
  {
    type: "formDate" as const,
    propSchema: {
      label: { default: "Date" },
      required: { default: "false" },
      helpText: { default: "" },
      includeTime: { default: "false" },
      conditionEnabled: { default: "false" },
      conditionSourceBlockId: { default: "" },
      conditionOperator: { default: "answered" },
      conditionValue: { default: "" },
    },
    content: "none",
  },
  { render: FormDateRenderer }
);
