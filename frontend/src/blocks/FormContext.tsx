import React, { createContext, useContext } from "react";
import type { FormMode, FormAnswer } from "@/types";

interface FormContextValue {
  mode: FormMode;
  answers: FormAnswer;
  setAnswer: (blockId: string, value: unknown) => void;
  invalidFields: Set<string>;
}

const FormContext = createContext<FormContextValue>({
  mode: "edit",
  answers: {},
  setAnswer: () => {},
  invalidFields: new Set(),
});

export const FormContextProvider = ({
  mode,
  answers,
  setAnswer,
  invalidFields = new Set(),
  children,
}: Omit<FormContextValue, "invalidFields"> & { invalidFields?: Set<string>; children: React.ReactNode }) => (
  <FormContext.Provider value={{ mode, answers, setAnswer, invalidFields }}>
    {children}
  </FormContext.Provider>
);

export const useFormContext = () => useContext(FormContext);
