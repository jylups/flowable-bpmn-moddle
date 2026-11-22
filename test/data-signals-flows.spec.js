import { beforeAll, describe, expect, it } from 'vitest';

import { createModdle, extensionsOfType, findElement, importFixture, roundtrip } from './helper.js';

const FIXTURE = 'data-signals-flows.bpmn';


describe('data objects, signals, sequence flows and DI', function() {

  let definitions, warnings;

  beforeAll(async function() {
    ({ definitions, warnings } = await importFixture(FIXTURE));
  });

  const element = id => findElement(definitions, id);


  it('reads with warnings only for the untyped DI attributes', function() {

    // the docker and rotation attributes stay generic: typing them through an
    // extension of bpmndi:BPMNEdge / BPMNLabel would make moddle write the tags
    // as bPMNEdge / bPMNLabel (lowerCase tag alias of this package)
    expect(warnings.map(w => w.message).sort()).toEqual([
      'unknown attribute <flowable:rotation>',
      'unknown attribute <flowable:sourceDockerX>',
      'unknown attribute <flowable:sourceDockerY>',
      'unknown attribute <flowable:targetDockerX>',
      'unknown attribute <flowable:targetDockerY>'
    ]);
  });


  it('reads the data object default value', function() {
    expect(extensionsOfType(element('threshold'), 'flowable:Value')[0].body).toBe('10');
  });


  it('reads the signal scope', function() {
    expect(element('globalSignal').scope).toBe('global');
    expect(element('localSignal').scope).toBe('processInstance');
  });


  it('reads skipExpression on sequence flows', function() {
    expect(element('toCheck').skipExpression).toBe('${skipCheck}');
  });


  it('reads the unprefixed skipExpression Flowable writes', async function() {

    // given
    const moddle = createModdle();
    const xml = '<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" ' +
      'xmlns:flowable="http://flowable.org/bpmn" id="d" targetNamespace="t"><process id="p">' +
      '<sequenceFlow id="f" sourceRef="a" targetRef="b" skipExpression="${skip}" />' +
      '<task id="a" /><task id="b" /></process></definitions>';

    // when
    const { rootElement } = await moddle.fromXML(xml, 'bpmn:Definitions');
    const flow = rootElement.rootElements[0].flowElements.find(e => e.id === 'f');

    // then
    expect(flow.skipExpression).toBe('${skip}');
  });


  it('keeps the DI docker and rotation attributes without typing them', function() {

    // when
    const edge = definitions.diagrams[0].plane.planeElement.find(e => e.id === 'toCheck_di');

    // then
    expect(edge.$attrs['flowable:sourceDockerX']).toBe('18.0');
    expect(edge.label.$attrs['flowable:rotation']).toBe('90.0');
  });


  describe('roundtrip', function() {

    it('writes the fixture back without changes', async function() {

      // when
      const { original, saved } = await roundtrip(FIXTURE);

      // then
      expect(saved).toEqual(original);
    });


    it('keeps the BPMNEdge and BPMNLabel tag names', async function() {

      // given
      const { moddle, definitions } = await importFixture(FIXTURE);

      // when
      const { xml } = await moddle.toXML(definitions);

      // then
      expect(xml).toContain('<bpmndi:BPMNEdge id="toCheck_di"');
      expect(xml).toContain('<bpmndi:BPMNLabel flowable:rotation="90.0">');
      expect(xml).not.toContain('bPMN');
    });

  });

});
