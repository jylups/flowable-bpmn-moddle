import { FLOWABLE_NS } from './migrate.js';

/**
 * Keeps flowable:* elements that the descriptor does not define.
 *
 * Because the Flowable namespace is registered with types, bpmn-moddle drops
 * any flowable:* element it has no type for (an "unknown type" warning).
 * Flowable itself keeps such elements, and Flowable Work/Design and users add
 * their own. Before importing, this function finds the flowable:* element
 * names in the XML that have no type and registers a generic type for each:
 * a text body plus any child elements. Attributes are kept as unknown
 * attributes, as for any element. The element is then read, kept and written
 * back unchanged.
 *
 * Call it with the moddle instance that imports the XML (in bpmn-js:
 * modeler.get('moddle')), before importXML / fromXML. Registered types stay
 * on that instance.
 *
 * @param {Object} moddle - a bpmn-moddle instance with the Flowable descriptor
 * @param {string} xml - the XML that is about to be imported
 *
 * @return {string[]} the names of the types registered, e.g. ['flowable:CustomValue']
 */
export function registerUnknownFlowableElements(moddle, xml) {
  const pkg = moddle.getPackage('flowable');

  if (!pkg) {
    throw new Error('the Flowable descriptor is not registered with this moddle instance');
  }

  const registered = [];

  for (const prefix of flowablePrefixes(xml)) {
    const tag = new RegExp(`<${ escapeRegExp(prefix) }:([A-Za-z_][\\w.-]*)`, 'g');

    for (const match of xml.matchAll(tag)) {
      const typeName = match[1].charAt(0).toUpperCase() + match[1].slice(1);
      const qualifiedName = `${ pkg.prefix }:${ typeName }`;

      if (registered.includes(qualifiedName) || hasType(moddle, qualifiedName)) {
        continue;
      }

      moddle.registry.registerType({
        name: typeName,
        superClass: [ 'Element' ],
        meta: { generic: true },
        properties: [
          { name: 'body', isBody: true, type: 'String' },
          { name: 'children', type: 'Element', isMany: true }
        ]
      }, pkg);

      registered.push(qualifiedName);
    }
  }

  return registered;
}

/**
 * Prefixes the XML binds to the Flowable namespace.
 *
 * @param {string} xml
 *
 * @return {Set<string>}
 */
function flowablePrefixes(xml) {
  const prefixes = new Set();
  const declaration = /\sxmlns:([A-Za-z_][\w.-]*)\s*=\s*(["'])([^"']*)\2/g;

  for (const match of xml.matchAll(declaration)) {
    if (match[3] === FLOWABLE_NS) {
      prefixes.add(match[1]);
    }
  }

  return prefixes;
}

function hasType(moddle, name) {
  try {
    return !!moddle.getType(name);
  } catch {
    return false;
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');
}
