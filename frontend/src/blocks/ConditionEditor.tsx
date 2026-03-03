import React from "react";

/** Types de blocs formulaire pouvant servir de source de condition */
const FORM_INPUT_TYPES = [
  "formShortText",
  "formLongText",
  "formMultipleChoice",
  "formCheckbox",
  "formRating",
  "formDate",
  "formDropdown",
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function collectFormBlocks(blocks: any[]): any[] {
  return blocks.flatMap((b) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const acc: any[] = [];
    if (FORM_INPUT_TYPES.includes(b.type)) acc.push(b);
    if (b.children?.length) acc.push(...collectFormBlocks(b.children));
    return acc;
  });
}

/**
 * Panneau de configuration d'une condition d'affichage.
 * À inclure dans le mode "edit" de chaque bloc formulaire.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ConditionEditor({ block, editor }: { block: any; editor: any }) {
  const conditionEnabled = block.props.conditionEnabled === "true";
  const operator: string = block.props.conditionOperator || "answered";
  const needsValue = operator === "eq" || operator === "neq";

  // Tous les blocs formulaire du document sauf le bloc courant
  const sourceBlocks = collectFormBlocks(editor?.document ?? []).filter(
    (b) => b.id !== block.id
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update = (props: Record<string, any>) =>
    editor.updateBlock(block, { props });

  return (
    <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
      <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={conditionEnabled}
          onChange={(e) =>
            update({ conditionEnabled: e.target.checked ? "true" : "false" })
          }
          className="h-3 w-3"
        />
        Affichage conditionnel
      </label>

      {conditionEnabled && (
        <div className="mt-2 rounded-lg bg-blue-50 border border-blue-200 p-2.5">
          <p className="text-xs text-blue-700 font-medium mb-2">
            Afficher ce bloc si :
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Sélecteur du bloc source */}
            <select
              className="border border-gray-300 rounded-md text-xs bg-white px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
              value={block.props.conditionSourceBlockId}
              onChange={(e) => update({ conditionSourceBlockId: e.target.value })}
              aria-label="Champ source de la condition"
            >
              <option value="">— choisir un champ —</option>
              {sourceBlocks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.props.label || b.type}
                </option>
              ))}
            </select>

            {/* Opérateur */}
            <select
              className="border border-gray-300 rounded-md text-xs bg-white px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
              value={operator}
              onChange={(e) => update({ conditionOperator: e.target.value })}
              aria-label="Opérateur de comparaison"
            >
              <option value="answered">est renseigné</option>
              <option value="notAnswered">est vide</option>
              <option value="eq">est égal à</option>
              <option value="neq">est différent de</option>
            </select>

            {/* Valeur (seulement pour eq / neq) */}
            {needsValue && (
              <input
                type="text"
                className="border border-gray-300 rounded-md text-xs bg-white px-2 py-1 w-28 focus:outline-none focus:ring-1 focus:ring-blue-400"
                placeholder="valeur…"
                value={block.props.conditionValue}
                onChange={(e) => update({ conditionValue: e.target.value })}
                aria-label="Valeur de comparaison"
              />
            )}
          </div>

          {!block.props.conditionSourceBlockId && (
            <p className="text-xs text-amber-600 mt-1.5">
              ⚠ Sélectionnez un champ source pour activer la condition.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

