export enum TermTypes {
  KEYWORD = "keyword",
  SEMANTIC = "semantic"
}

export interface KeywordTerm {
  termType: TermTypes.KEYWORD;
  value: string;
}

export function mkKeywordTerm(value: string): KeywordTerm {
  return {
    termType: TermTypes.KEYWORD,
    value
  };
}

export interface SemanticTerm {
  termType: TermTypes.SEMANTIC;
  value: string;
  uris: Array<string>;
}

export function mkSemanticTerm(value: string, uris: Array<string>): SemanticTerm {
  return {
    termType: TermTypes.SEMANTIC,
    value,
    uris
  };
}

export type Term = KeywordTerm | SemanticTerm;

export interface Triple {
  subject: Term;
  predicate: Term;
  object: Term;
}

export function mkTriple(subject: Term, predicate: Term, object: Term): Triple {
  return {
    subject,
    predicate,
    object
  };
}