import { describe, expect, it } from 'vitest';

import { registerUnknownFlowableElements } from '../index.js';

import { createModdle, parseTree } from './helper.js';


const XML = '<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" ' +
  'xmlns:flowable="http://flowable.org/bpmn" xmlns:fl="http://flowable.org/bpmn" id="d" targetNamespace="t">' +
  '<process id="p"><userTask id="u"><extensionElements>' +
  '<flowable:task-candidates-type><![CDATA[all]]></flowable:task-candidates-type>' +
  '<flowable:work-form-field-validation>false</flowable:work-form-field-validation>' +
  '<flowable:customValue kind="x">hello</flowable:customValue>' +
  '<flowable:myTestEventDefinition a="1"><flowable:inner b="2">text</flowable:inner></flowable:myTestEventDefinition>' +
  '<fl:otherPrefix>kept</fl:otherPrefix>' +
  '</extensionElements></userTask>' +
  '<callActivity id="c" calledElement="x"><extensionElements>' +
  '<flowable:static-process-key>oneTaskProcess</flowable:static-process-key>' +
  '</extensionElements></callActivity>' +
  '<sequenceFlow id="f" sourceRef="u" targetRef="c"><extensionElements>' +
  '<flowable:translation key="label" locale="it_it">Etichetta</flowable:translation>' +
  '</extensionElements></sequenceFlow>' +
  '</process></definitions>';


describe('unknown flowable:* elements', function() {

  describe('known Flowable Work/Design elements', function() {

    it('types work-form-field-validation, task-candidates-type, static-process-key and translation', async function() {

      // given
      const moddle = createModdle();

      // when
      const { rootElement } = await moddle.fromXML(XML, 'bpmn:Definitions');
      const [ task, call, flow ] = rootElement.rootElements[0].flowElements;
      const values = task.extensionElements.values;

      // then
      expect(values[0].$type).toBe('flowable:Task-candidates-type');
      expect(values[0].body).toBe('all');
      expect(values[1].$type).toBe('flowable:Work-form-field-validation');
      expect(values[1].body).toBe('false');
      expect(call.extensionElements.values[0].$type).toBe('flowable:Static-process-key');
      expect(flow.extensionElements.values[0].key).toBe('label');
      expect(flow.extensionElements.values[0].locale).toBe('it_it');
      expect(flow.extensionElements.values[0].body).toBe('Etichetta');
    });

  });


  describe('registerUnknownFlowableElements', function() {

    it('registers a generic type for each unknown element name, for any prefix bound to the namespace', function() {

      // given
      const moddle = createModdle();

      // when
      const registered = registerUnknownFlowableElements(moddle, XML);

      // then
      expect(registered).toEqual([
        'flowable:CustomValue',
        'flowable:MyTestEventDefinition',
        'flowable:Inner',
        'flowable:OtherPrefix'
      ]);
    });


    it('keeps unknown elements with their body, attributes and children', async function() {

      // given
      const moddle = createModdle();
      registerUnknownFlowableElements(moddle, XML);

      // when
      const { rootElement, warnings } = await moddle.fromXML(XML, 'bpmn:Definitions');
      const values = rootElement.rootElements[0].flowElements[0].extensionElements.values;
      const custom = values.find(v => v.$type === 'flowable:CustomValue');
      const event = values.find(v => v.$type === 'flowable:MyTestEventDefinition');

      // then
      expect(warnings.every(w => w.message.startsWith('unknown attribute'))).toBe(true);
      expect(custom.body).toBe('hello');
      expect(custom.$attrs.kind).toBe('x');
      expect(event.$attrs.a).toBe('1');
      expect(event.children[0].$type).toBe('flowable:Inner');
      expect(event.children[0].body).toBe('text');
    });


    it('writes the model back without changes', async function() {

      // given
      const moddle = createModdle();
      registerUnknownFlowableElements(moddle, XML);
      const { rootElement } = await moddle.fromXML(XML, 'bpmn:Definitions');

      // when
      const { xml } = await moddle.toXML(rootElement);

      // then
      expect(parseTree(xml)).toEqual(parseTree(XML));
    });


    it('drops unknown elements without it, as bpmn-moddle does', async function() {

      // given
      const moddle = createModdle();

      // when
      const { warnings } = await moddle.fromXML(XML, 'bpmn:Definitions');

      // then
      expect(warnings.some(w => w.message.includes('unknown type <flowable:CustomValue>'))).toBe(true);
    });


    it('does not register types that already exist, and returns nothing without a Flowable namespace', function() {

      // given
      const moddle = createModdle();

      // when
      registerUnknownFlowableElements(moddle, XML);
      const again = registerUnknownFlowableElements(moddle, XML);
      const none = registerUnknownFlowableElements(moddle, '<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" />');

      // then
      expect(again).toEqual([]);
      expect(none).toEqual([]);
    });

  });

});
