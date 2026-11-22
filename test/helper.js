import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { DOMParser } from '@xmldom/xmldom';
import { BpmnModdle } from 'bpmn-moddle';

import flowableDescriptor from '../index.js';

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');

const XMLNS = 'http://www.w3.org/2000/xmlns/';

export function createModdle() {
  return new BpmnModdle({ flowable: flowableDescriptor });
}

export function readFixture(name) {
  return fs.readFileSync(path.join(FIXTURES, name), 'utf8');
}

/**
 * Imports a fixture as bpmn:Definitions.
 *
 * @return {Promise<{ moddle, definitions, warnings }>}
 */
export async function importFixture(name) {
  const moddle = createModdle();
  const { rootElement, warnings } = await moddle.fromXML(readFixture(name), 'bpmn:Definitions');

  return { moddle, definitions: rootElement, warnings };
}

/**
 * Finds an element by id anywhere below the definitions.
 */
export function findElement(definitions, id) {
  const seen = new Set();

  function visit(element) {
    if (!element || typeof element !== 'object' || seen.has(element)) {
      return null;
    }

    seen.add(element);

    if (element.id === id) {
      return element;
    }

    for (const key of Object.keys(element)) {
      if (key.startsWith('$')) {
        continue;
      }

      const value = element[key];
      const found = Array.isArray(value) ? value.map(visit).find(Boolean) : visit(value);

      if (found) {
        return found;
      }
    }

    return null;
  }

  return visit(definitions);
}

/**
 * Extension elements of an element with the given type, e.g. 'flowable:JobCategory'.
 */
export function extensionsOfType(element, type) {
  return (element.extensionElements?.values || []).filter(value => value.$instanceOf(type));
}


// roundtrip

function toTree(element) {
  const attrs = {};

  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];

    if (attr.namespaceURI === XMLNS || attr.name === 'xmlns' || attr.prefix === 'xmlns') {
      continue;
    }

    attrs[`{${attr.namespaceURI || ''}}${attr.localName}`] = attr.value;
  }

  const children = [];
  let text = '';

  for (let c = element.firstChild; c; c = c.nextSibling) {
    if (c.nodeType === 1) {
      children.push(toTree(c));
    } else if (c.nodeType === 3 || c.nodeType === 4) {
      text += c.data;
    }
  }

  return {
    name: `{${element.namespaceURI || ''}}${element.localName}`,
    attrs,
    text: text.trim(),
    children
  };
}

export function parseTree(xml) {
  return toTree(new DOMParser().parseFromString(xml, 'text/xml').documentElement);
}

/**
 * Imports and exports a fixture.
 *
 * @return {Promise<{ original, saved, warnings }>} namespace-resolved trees of
 *   the fixture and of the saved XML, to compare with toEqual
 */
export async function roundtrip(name) {
  const xml = readFixture(name);
  const moddle = createModdle();
  const { rootElement, warnings } = await moddle.fromXML(xml, 'bpmn:Definitions');
  const { xml: savedXML } = await moddle.toXML(rootElement, { format: true });

  return { original: parseTree(xml), saved: parseTree(savedXML), warnings };
}
