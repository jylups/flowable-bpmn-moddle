import { beforeAll, describe, expect, it } from 'vitest';

import { extensionsOfType, findElement, importFixture, roundtrip } from './helper.js';

const FIXTURE = 'common-flow-node.bpmn';


describe('common flow-node extensions', function() {

  let definitions, warnings;

  beforeAll(async function() {
    ({ definitions, warnings } = await importFixture(FIXTURE));
  });


  it('reads without warnings', function() {
    expect(warnings).toEqual([]);
  });


  describe('async attributes', function() {

    it('reads async, exclusive, asyncLeave and asyncLeaveExclusive as booleans', function() {

      // when
      const work = findElement(definitions, 'work');

      // then
      expect(work.async).toBe(true);
      expect(work.exclusive).toBe(true);
      expect(work.asyncLeave).toBe(true);
      expect(work.asyncLeaveExclusive).toBe(false);
    });


    it('applies to events, gateways and sub-processes', function() {
      expect(findElement(definitions, 'start').async).toBe(true);
      expect(findElement(definitions, 'start').exclusive).toBe(false);
      expect(findElement(definitions, 'gateway').asyncLeave).toBe(true);
      expect(findElement(definitions, 'sub').async).toBe(true);
      expect(findElement(definitions, 'subEnd').asyncLeave).toBe(false);
      expect(findElement(definitions, 'timer').async).toBe(true);
    });


    it('leaves unset attributes undefined', function() {

      // when
      const end = findElement(definitions, 'end');

      // then
      expect(end.async).toBeUndefined();
      expect(end.exclusive).toBeUndefined();
    });


    it('is defined on flow nodes', function() {

      // when
      const work = findElement(definitions, 'work');

      // then
      expect(work.$instanceOf('flowable:AsyncCapable')).toBe(true);
    });

  });


  describe('extension elements', function() {

    it('reads failedJobRetryTimeCycle', function() {

      // when
      const [ cycle ] = extensionsOfType(findElement(definitions, 'work'), 'flowable:FailedJobRetryTimeCycle');

      // then
      expect(cycle.body).toBe('R5/PT7M');
    });


    it('reads jobCategory on activities and timer boundary events', function() {
      expect(extensionsOfType(findElement(definitions, 'work'), 'flowable:JobCategory')[0].body).toBe('${jobCategory}');
      expect(extensionsOfType(findElement(definitions, 'timer'), 'flowable:JobCategory')[0].body).toBe('timers');
    });


    it('reads element-name with its line breaks', function() {
      expect(extensionsOfType(findElement(definitions, 'work'), 'flowable:Element-name')[0].body).toBe('Do\nwork');
      expect(extensionsOfType(findElement(definitions, 'sub'), 'flowable:Element-name')[0].body).toBe('Sub process');
    });


    it('reads includeInHistory', function() {
      expect(extensionsOfType(findElement(definitions, 'work'), 'flowable:IncludeInHistory')[0].body).toBe('true');
      expect(extensionsOfType(findElement(definitions, 'end'), 'flowable:IncludeInHistory')[0].body).toBe('false');
    });


    it('reads localization with documentation on processes, flow elements and data objects', function() {

      // when
      const [ processLocalization ] = extensionsOfType(definitions.rootElements[0], 'flowable:Localization');
      const [ taskLocalization ] = extensionsOfType(findElement(definitions, 'work'), 'flowable:Localization');
      const [ dataLocalization ] = extensionsOfType(findElement(definitions, 'amount'), 'flowable:Localization');

      // then
      expect(processLocalization.locale).toBe('es');
      expect(processLocalization.name).toBe('Extensiones comunes');
      expect(processLocalization.documentation.$type).toBe('flowable:Documentation');
      expect(processLocalization.documentation.body).toBe('Documentación del proceso');

      expect(taskLocalization.locale).toBe('de');
      expect(taskLocalization.documentation.body).toBe('Erledigt die Arbeit');

      expect(dataLocalization.name).toBe('importe');
      expect(dataLocalization.documentation).toBeUndefined();
    });

  });


  describe('roundtrip', function() {

    it('writes the fixture back without changes', async function() {

      // when
      const { original, saved } = await roundtrip(FIXTURE);

      // then
      expect(saved).toEqual(original);
    });


    it('creates and writes the extensions', async function() {

      // given
      const { moddle, definitions } = await importFixture(FIXTURE);
      const end = findElement(definitions, 'end');

      end.set('async', true);
      end.set('exclusive', false);

      end.extensionElements.get('values').push(
        moddle.create('flowable:FailedJobRetryTimeCycle', { body: 'R3/PT5M' }),
        moddle.create('flowable:Localization', {
          locale: 'fr',
          name: 'Fin',
          documentation: moddle.create('flowable:Documentation', { body: 'Termine le processus' })
        })
      );

      // when
      const { xml } = await moddle.toXML(definitions);

      // then
      expect(xml).toContain('<endEvent id="end" flowable:async="true" flowable:exclusive="false">');
      expect(xml).toContain('<flowable:failedJobRetryTimeCycle>R3/PT5M</flowable:failedJobRetryTimeCycle>');
      expect(xml).toContain('<flowable:localization locale="fr" name="Fin"><flowable:documentation>Termine le processus</flowable:documentation></flowable:localization>');
    });

  });

});
