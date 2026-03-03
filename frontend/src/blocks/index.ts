import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { FormShortText, FormShortTextRenderer } from "./FormShortText";
import { FormLongText, FormLongTextRenderer } from "./FormLongText";
import { FormMultipleChoice, FormMultipleChoiceRenderer } from "./FormMultipleChoice";
import { FormCheckbox, FormCheckboxRenderer } from "./FormCheckbox";
import { FormRating, FormRatingRenderer } from "./FormRating";
import { FormDate, FormDateRenderer } from "./FormDate";
import { FormDropdown, FormDropdownRenderer } from "./FormDropdown";
import { FormDivider, FormDividerRenderer } from "./FormDivider";
import { FormPageBreak, FormPageBreakRenderer } from "./FormPageBreak";

export const formBlockSpecs = {
  formShortText: FormShortText,
  formLongText: FormLongText,
  formMultipleChoice: FormMultipleChoice,
  formCheckbox: FormCheckbox,
  formRating: FormRating,
  formDate: FormDate,
  formDropdown: FormDropdown,
  formDivider: FormDivider,
  formPageBreak: FormPageBreak,
} as const;

export const formSchema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    ...formBlockSpecs,
  },
});

export type FormSchema = typeof formSchema;

export {
  FormShortText,
  FormShortTextRenderer,
  FormLongText,
  FormLongTextRenderer,
  FormMultipleChoice,
  FormMultipleChoiceRenderer,
  FormCheckbox,
  FormCheckboxRenderer,
  FormRating,
  FormRatingRenderer,
  FormDate,
  FormDateRenderer,
  FormDropdown,
  FormDropdownRenderer,
  FormDivider,
  FormDividerRenderer,
  FormPageBreak,
  FormPageBreakRenderer,
};

export { FormContextProvider, useFormContext } from "./FormContext";
