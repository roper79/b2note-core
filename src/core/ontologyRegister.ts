import _ from "lodash";
import axios from "axios";
import { axiosErrToMsg } from "./utils";

export interface OntologyInfo {
  labels: string;
  descriptions: Array<string>;
  shortForm: string;
  ontologyName: string;
  ontologyAcronym: string;
  synonyms: Array<string>;
  uris: string;
}

export type OntologyDict = Record<string, Array<OntologyInfo>>

// SOLR requires a non-standard encoding where just # and " are encoded
function encodeSolrQuery(uri: string): string {
  return uri.replace(/#/g, "%23").replace(/"/g, "%22");
}

// Getting ontologies {{{1

function mkSolrQueryUrl(solrUrl: string, query: string): string {
  const q =
    (query.length <= 4 && _.words(query).length <= 1) ? `(labels:/${query}.*/)`
    : `(labels:"${query}"^100%20OR%20labels:${query}*^20%20OR%20text_auto:/${query}.*/^10%20OR%20labels:*${query}*)`;
  const notErrors = "%20AND%20NOT%20(labels:/Error[0-9].*/)";
  const sort = _.words(query).length <= 1 ? "&sort=norm(labels) desc" : "";
  const flags = "&wt=json&indent=true&rows=1000";
  const res = solrUrl + "?q=(" + q + notErrors + ")" + sort + flags;
  return res;
}

function resultToDict(docs: any): OntologyDict {
  const ontologies: Array<OntologyInfo> = docs.map((o: any): OntologyInfo => ({
    labels: o.labels || "",
    descriptions: o.description || "",
    shortForm: o.short_form || "",
    ontologyName: o.ontology_name || "",
    ontologyAcronym: o.ontology_acronym || "",
    synonyms: o.synonyms || [],
    uris: o.uris || ""
  }));
  const ontologiesUniq = _.uniqBy(ontologies, "uris");
  const groups = _.groupBy(ontologiesUniq, o => o.labels.toLowerCase());
  return groups;
}

export async function getOntologies(solrUrl: string, query: string): Promise<OntologyDict> {
  return new Promise((resolve, reject) => {
    axios.get(mkSolrQueryUrl(solrUrl, query)).then(
      resp => resolve(resultToDict(resp.data?.response?.docs)),
      err => reject(axiosErrToMsg(err))
    ).catch(err => reject(axiosErrToMsg(err)));
  });
}

// Getting ontology info {{{1

export function getInfo(solrUrl: string, ontologyUri: string): Promise<OntologyInfo> {
  return new Promise((resolve, reject) => {
    const queryUrl = encodeSolrQuery(solrUrl + '?q=uris:("' + ontologyUri + '")&rows=100&wt=json');
    axios.get(queryUrl).then(
      res => {
        if (res?.data?.response?.docs?.length > 0) {
          const info = resultToDict(res.data.response.docs);
          const key = Object.keys(info)[0];
          resolve(info[key][0]);
        } else {
          reject("SOLR query returned 0 results for " + queryUrl);
        }
      },
      error => reject(axiosErrToMsg(error))
    ).catch(error => reject(axiosErrToMsg(error)));
  });
}