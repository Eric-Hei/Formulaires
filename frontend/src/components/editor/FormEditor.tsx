"use client";

import React, { useCallback, useEffect, useRef } from "react";
import {
  useCreateBlockNote,
  SuggestionMenuController,
  getDefaultReactSlashMenuItems,
} from "@blocknote/react";
import { filterSuggestionItems } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { formSchema, FormSchema } from "@/blocks";
import { FormContextProvider } from "@/blocks/FormContext";
import { BlockNoteEditor } from "@blocknote/core";

interface FormEditorProps {
  documentId: string;
  initialContent: unknown[];
  onSave?: (blocks: unknown[]) => void;
}

type FormEditor = BlockNoteEditor<FormSchema["blockSchema"], FormSchema["inlineContentSchema"], FormSchema["styleSchema"]>;

function makeInsertFormBlock(type: string) {
  return (editor: FormEditor) => {
    editor.insertBlocks(
      [{ type: type as never }],
      editor.getTextCursorPosition().block,
      "after"
    );
  };
}

const FORM_BLOCK_ITEMS = [
  { title: "Texte court",        subtext: "Réponse sur une ligne",        group: "Champs formulaire", type: "formShortText" },
  { title: "Texte long",         subtext: "Réponse sur plusieurs lignes",  group: "Champs formulaire", type: "formLongText" },
  { title: "Choix multiple",     subtext: "Une seule réponse parmi plusieurs", group: "Champs formulaire", type: "formMultipleChoice" },
  { title: "Cases à cocher",     subtext: "Plusieurs réponses possibles",  group: "Champs formulaire", type: "formCheckbox" },
  { title: "Note (étoiles)",     subtext: "Évaluation de 1 à 5",          group: "Champs formulaire", type: "formRating" },
  { title: "Date",               subtext: "Sélecteur de date",             group: "Champs formulaire", type: "formDate" },
  { title: "Liste déroulante",   subtext: "Menu de sélection",             group: "Champs formulaire", type: "formDropdown" },
  { title: "Séparateur",         subtext: "Ligne de séparation visuelle",  group: "Champs formulaire", type: "formDivider" },
  { title: "Saut de page",      subtext: "Divise le formulaire en plusieurs pages", group: "Champs formulaire", type: "formPageBreak" },
];

export function FormEditor({ documentId, initialContent, onSave }: FormEditorProps) {
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useCreateBlockNote({
    schema: formSchema,
    initialContent: (initialContent?.length ? initialContent : undefined) as never,
  });

  const handleChange = useCallback(() => {
    if (!onSave) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      const blocks = editor.document;
      onSave(blocks as unknown[]);
    }, 1500);
  }, [editor, onSave]);

  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, []);

  return (
    <FormContextProvider mode="edit" answers={{}} setAnswer={() => {}}>
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm min-h-[600px] overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50 px-4 py-2 flex items-center gap-2">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
            Éditeur de formulaire
          </span>
          <span className="text-xs text-gray-300">
            — Tapez <kbd className="bg-gray-200 text-gray-600 rounded px-1">/</kbd> pour ajouter un champ
          </span>
        </div>
        <div className="p-2">
          <BlockNoteView
            editor={editor}
            onChange={handleChange}
            slashMenu={false}
            theme="light"
          >
            <SuggestionMenuController
              triggerCharacter="/"
              getItems={async (query) =>
                filterSuggestionItems(
                  [
                    ...getDefaultReactSlashMenuItems(editor),
                    ...FORM_BLOCK_ITEMS.map((item) => ({
                      title: item.title,
                      subtext: item.subtext,
                      group: item.group,
                      onItemClick: () => makeInsertFormBlock(item.type)(editor),
                    })),
                  ],
                  query
                )
              }
            />
          </BlockNoteView>
        </div>
      </div>
    </FormContextProvider>
  );
}
