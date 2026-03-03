import React from "react";
import { createReactBlockSpec } from "@blocknote/react";
import { useFormContext } from "./FormContext";
import { ConditionEditor } from "./ConditionEditor";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function FormDropdownRenderer({ block, editor }: { block: any; editor: any }) {
  const { mode, answers, setAnswer, invalidFields } = useFormContext();
      const blockId = block.id;
      const isRequired = block.props.required === "true";
      const options = block.props.options
        .split("\n")
        .map((o) => o.trim())
        .filter(Boolean);

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
            <select className="form-input text-sm" disabled>
              <option>{block.props.placeholder}</option>
            </select>
            <div className="mt-2">
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
          <select
            className="form-input"
            value={(answers[blockId] as string) ?? ""}
            onChange={(e) => setAnswer(blockId, e.target.value)}
            required={isRequired}
            aria-invalid={isInvalid}
          >
            <option value="">{block.props.placeholder}</option>
            {options.map((opt, i) => (
              <option key={i} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {isInvalid && (
            <p className="text-xs font-medium text-red-600 mt-2" role="alert">
              Ce champ est obligatoire.
            </p>
          )}
        </div>
      );
}

export const FormDropdown = createReactBlockSpec(
  {
    type: "formDropdown" as const,
    propSchema: {
      label: { default: "Question" },
      required: { default: "false" },
      helpText: { default: "" },
      placeholder: { default: "Sélectionnez une option" },
      options: { default: "Option 1\nOption 2\nOption 3" },
      conditionEnabled: { default: "false" },
      conditionSourceBlockId: { default: "" },
      conditionOperator: { default: "answered" },
      conditionValue: { default: "" },
    },
    content: "none",
  },
  { render: FormDropdownRenderer }
);
