export interface DocsDocument {
  id: string;
  title: string;
  content: unknown[];
  created_at: string;
  updated_at: string;
  abilities?: {
    destroy: boolean;
    manage: boolean;
    update: boolean;
    retrieve: boolean;
  };
}

export interface FormSettingsData {
  document_id: string;
  owner_id?: string;
  is_open: boolean;
  max_responses: number | null;
  close_date: string | null;
  redirect_url: string;
  response_count?: number;
  is_accepting_responses?: boolean;
}

export interface FormAnswer {
  [blockId: string]: string | string[] | number | null;
}

export interface FormResponseData {
  id: number;
  submitted_at: string;
  respondent_id: string;
  answers: FormAnswer;
  ip_address: string | null;
}

export interface FormStatsData {
  document_id: string;
  total_responses: number;
  is_accepting: boolean;
  field_stats: {
    [blockId: string]: {
      count: number;
      distribution: { [value: string]: number };
    };
  };
}

export type FormMode = "edit" | "preview" | "fill";

export interface FormBlockProps {
  mode: FormMode;
  blockId: string;
  value?: unknown;
  onChange?: (blockId: string, value: unknown) => void;
}
