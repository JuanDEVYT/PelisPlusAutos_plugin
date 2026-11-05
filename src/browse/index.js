// Interfaz declarativa de PelisPlus.
import { view, event } from "./view.js";
import { metaAsk } from "./model.js";

export function makeBrowse() {
  return { view, event, metaAsk };
}

export { view, event, metaAsk };
