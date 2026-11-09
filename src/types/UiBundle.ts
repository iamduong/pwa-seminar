export type UiMessages = Record<string, string>;

export type UiBundle = {
  lang: string;
  version: number;
  etag: string;
  value: UiMessages;
};

export type UiTranslationParams = Record<string, string | number>;
