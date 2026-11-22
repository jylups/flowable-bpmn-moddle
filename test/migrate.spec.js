import { describe, expect, it } from 'vitest';

import {
  ACTIVITI_NS,
  FLOWABLE_NS,
  migrateActivitiXML,
  useFlowablePrefix
} from '../index.js';

import { createModdle, extensionsOfType, findElement, parseTree, readFixture } from './helper.js';


async function importMigrated(xml) {
  const moddle = createModdle();
  const { rootElement, warnings } = await moddle.fromXML(migrateActivitiXML(xml), 'bpmn:Definitions');

  return { moddle, definitions: rootElement, warnings };
}


describe('Activiti namespace migration', function() {

  describe('migrateActivitiXML', function() {

    it('rewrites Activiti namespace declarations to the Flowable namespace', function() {

      // given
      const xml = `<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:activiti="${ ACTIVITI_NS }" xmlns:other='${ ACTIVITI_NS }'>`;

      // when
      const migrated = migrateActivitiXML(xml);

      // then
      expect(migrated).toBe(`<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:activiti="${ FLOWABLE_NS }" xmlns:other='${ FLOWABLE_NS }'>`);
    });


    it('leaves other text untouched', function() {

      // given
      const xml = '<script>var url = "http://activiti.org/bpmn"; // xmlns:activiti</script>';

      // when
      const migrated = migrateActivitiXML(xml);

      // then
      expect(migrated).toBe(xml);
    });

  });


  describe('import', function() {

    it('types Activiti spellings with the Flowable descriptor', async function() {

      // when
      const { definitions, warnings } = await importMigrated(readFixture('activiti-namespace.bpmn'));
      const process = definitions.rootElements[0];
      const review = findElement(definitions, 'review');

      // then
      expect(warnings).toEqual([]);
      expect(process.candidateStarterGroups).toBe('employees');
      expect(extensionsOfType(process, 'flowable:ExecutionListener')[0].fields[0].stringValue).toBe('audit');
      expect(findElement(definitions, 'start').initiator).toBe('employee');
      expect(review.assignee).toBe('${initiator}');
      expect(review.async).toBe(true);
      expect(extensionsOfType(review, 'flowable:FailedJobRetryTimeCycle')[0].body).toBe('R3/PT10M');
      expect(findElement(definitions, 'call').inheritVariables).toBe(true);
      expect(extensionsOfType(findElement(definitions, 'call'), 'flowable:In')[0].target).toBe('b');
    });


    it('reads models that bind the flowable prefix to the Activiti namespace', async function() {

      // given
      const xml = `<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:flowable="${ ACTIVITI_NS }" id="d" targetNamespace="t">` +
        '<process id="p"><userTask id="u" flowable:assignee="kermit" /></process></definitions>';

      // when
      const { moddle, definitions, warnings } = await importMigrated(xml);
      const { xml: saved } = await moddle.toXML(useFlowablePrefix(definitions));

      // then
      expect(warnings).toEqual([]);
      expect(saved).toContain(`xmlns:flowable="${ FLOWABLE_NS }"`);
      expect(saved).toContain('<userTask id="u" flowable:assignee="kermit" />');
    });

  });


  describe('useFlowablePrefix', function() {

    it('writes migrated models with the flowable prefix', async function() {

      // given
      const { moddle, definitions } = await importMigrated(readFixture('activiti-namespace.bpmn'));

      // when
      const { xml } = await moddle.toXML(useFlowablePrefix(definitions));

      // then
      expect(xml).not.toContain('xmlns:activiti');
      expect(xml).not.toContain('activiti:');
      expect(xml).toContain(`xmlns:flowable="${ FLOWABLE_NS }"`);
      expect(xml).toContain('flowable:assignee="${initiator}"');
      expect(xml).toContain('flowable:candidateGroups="management"');
      expect(xml).toContain('<flowable:taskListener event="create" class="org.example.Notify" />');
      expect(xml).toContain('<flowable:in source="a" target="b" />');
    });


    it('keeps everything else of the model', async function() {

      // given
      const original = readFixture('activiti-namespace.bpmn');
      const { moddle, definitions } = await importMigrated(original);

      // when
      const { xml } = await moddle.toXML(useFlowablePrefix(definitions));

      // then: equal once the Activiti namespace is read as the Flowable one
      expect(parseTree(xml)).toEqual(parseTree(migrateActivitiXML(original)));
    });

  });

});
