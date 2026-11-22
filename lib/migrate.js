/**
 * Helpers for models written with the Activiti namespace.
 *
 * Flowable reads its extensions in the Flowable namespace
 * (http://flowable.org/bpmn) and, for compatibility, in the Activiti
 * namespace (http://activiti.org/bpmn). The descriptor only registers the
 * Flowable namespace, so Activiti spellings would stay generic, untyped
 * content. These helpers move a model to the Flowable namespace so that
 * everything is typed and written as flowable:.
 */

export const FLOWABLE_NS = 'http://flowable.org/bpmn';

export const ACTIVITI_NS = 'http://activiti.org/bpmn';

const ACTIVITI_DECLARATION = /(\sxmlns(?::[A-Za-z_][\w.-]*)?\s*=\s*)(["'])http:\/\/activiti\.org\/bpmn\2/g;

/**
 * Rewrites namespace declarations of the Activiti namespace to the Flowable
 * namespace. Only xmlns declarations change, so element names, attribute
 * names and text stay as they are; prefixes bound to the Activiti namespace
 * then resolve to the Flowable descriptor when the XML is imported.
 *
 * @param {string} xml
 *
 * @return {string}
 */
export function migrateActivitiXML(xml) {
  return xml.replace(ACTIVITI_DECLARATION, `$1$2${ FLOWABLE_NS }$2`);
}

/**
 * Removes namespace declarations on the definitions that bind another prefix
 * (for example activiti) to the Flowable namespace, so that the writer uses
 * the flowable prefix. Call it after importing XML that went through
 * migrateActivitiXML, before saving.
 *
 * @param {Object} definitions - the imported bpmn:Definitions
 *
 * @return {Object} the definitions
 */
export function useFlowablePrefix(definitions) {
  const attrs = definitions.$attrs || {};

  for (const name of Object.keys(attrs)) {
    if (name.startsWith('xmlns:') && name !== 'xmlns:flowable' && attrs[name] === FLOWABLE_NS) {
      delete attrs[name];
    }
  }

  if (attrs['xmlns:flowable'] && attrs['xmlns:flowable'] !== FLOWABLE_NS) {
    delete attrs['xmlns:flowable'];
  }

  return definitions;
}
