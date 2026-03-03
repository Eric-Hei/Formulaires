import React from "react";
import { createReactBlockSpec } from "@blocknote/react";
import { ConditionEditor } from "./ConditionEditor";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function FormPageBreakRenderer({ block, editor }: { block: any; editor: any }) {
  const isEdit = editor !== null && editor !== undefined;
  const hasCondition = block.props?.conditionEnabled === "true";

  return (
    <div contentEditable={false} role="separator" aria-label="Saut de page">
      <div className="relative my-2 flex items-center gap-3 select-none">
        <div className="flex-1 border-t-2 border-dashed border-blue-300" aria-hidden="true" />
        <span
          className="flex items-center gap-1.5 text-xs font-medium text-blue-500 bg-blue-50 px-3 py-1 rounded-full border border-blue-200"
          title={hasCondition ? "Saut conditionnel actif" : undefined}
        >
          {hasCondition && <span aria-hidden="true">⚡</span>}
          Nouvelle page
        </span>
        <div className="flex-1 border-t-2 border-dashed border-blue-300" aria-hidden="true" />
      </div>
      {isEdit && <ConditionEditor block={block} editor={editor} />}
    </div>
  );
}

export const FormPageBreak = createReactBlockSpec(
  {
    type: "formPageBreak" as const,
    propSchema: {
      conditionEnabled: { default: "false" },
      conditionSourceBlockId: { default: "" },
      conditionOperator: { default: "answered" },
      conditionValue: { default: "" },
    },
    content: "none",
  },
  { render: FormPageBreakRenderer }
);

