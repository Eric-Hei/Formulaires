import React from "react";
import { createReactBlockSpec } from "@blocknote/react";
import { useFormContext } from "./FormContext";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function FormDividerRenderer({ block, editor }: { block: any; editor: any }) {
  const { mode } = useFormContext();

      if (mode === "edit") {
        return (
          <div className="form-block-wrapper border-l-4 border-primary-400 bg-primary-50/30">
            <input
              className="w-full text-base font-semibold text-gray-800 bg-transparent
                         focus:outline-none placeholder-gray-400 mb-1"
              value={block.props.title}
              onChange={(e) =>
                editor.updateBlock(block, { props: { title: e.target.value } })
              }
              placeholder="Titre de section (optionnel)"
            />
            <input
              className="w-full text-sm text-gray-500 bg-transparent focus:outline-none placeholder-gray-400"
              value={block.props.description}
              onChange={(e) =>
                editor.updateBlock(block, { props: { description: e.target.value } })
              }
              placeholder="Description de section (optionnel)"
            />
          </div>
        );
      }

      return (
        <div className="mb-6 mt-4 border-t-2 border-gray-200 pt-6">
          {block.props.title && (
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{block.props.title}</h3>
          )}
          {block.props.description && (
            <p className="text-sm text-gray-500">{block.props.description}</p>
          )}
        </div>
      );
}

export const FormDivider = createReactBlockSpec(
  {
    type: "formDivider" as const,
    propSchema: {
      title: { default: "" },
      description: { default: "" },
    },
    content: "none",
  },
  { render: FormDividerRenderer }
);
