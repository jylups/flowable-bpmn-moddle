import { describe, expect, it } from 'vitest';

import { BpmnModdle } from 'bpmn-moddle';

import flowableDescriptor from '../index.js';

const XML = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
             xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
             xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
             xmlns:flowable="http://flowable.org/bpmn"
             targetNamespace="http://flowable.org/bpmn"
             id="Definitions_1">
  <process id="Process_1" isExecutable="true">
    <startEvent id="StartEvent_1" />
  </process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="180" y="160" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</definitions>`;

describe('flowable-bpmn-moddle', function() {

  it('exports the Flowable descriptor', function() {
    expect(flowableDescriptor.uri).toBe('http://flowable.org/bpmn');
    expect(flowableDescriptor.prefix).toBe('flowable');
  });


  it('registers with bpmn-moddle and reads a diagram', async function() {

    // given
    const moddle = new BpmnModdle({ flowable: flowableDescriptor });

    // when
    const { rootElement, warnings } = await moddle.fromXML(XML, 'bpmn:Definitions');

    // then
    expect(warnings).toEqual([]);
    expect(rootElement.rootElements[0].id).toBe('Process_1');
    expect(moddle.getPackage('flowable')).toBeDefined();
  });

});
