import { beforeAll, describe, expect, it } from 'vitest';

import { createModdle, extensionsOfType, findElement, importFixture, roundtrip } from './helper.js';

const FIXTURE = 'process-start-event.bpmn';


describe('process and start event', function() {

  let definitions, warnings, process;

  beforeAll(async function() {
    ({ definitions, warnings } = await importFixture(FIXTURE));

    process = definitions.rootElements[0];
  });


  it('reads without warnings', function() {
    expect(warnings).toEqual([]);
  });


  describe('process', function() {

    it('reads candidate starters and eager execution fetching', function() {
      expect(process.candidateStarterUsers).toBe('kermit,gonzo');
      expect(process.candidateStarterGroups).toBe('employees');
      expect(process.isEagerExecutionFetching).toBe(true);
    });


    it('reads potentialStarter with its formal expression', function() {

      // when
      const [ starter ] = extensionsOfType(process, 'flowable:PotentialStarter');
      const assignment = starter.resourceAssignmentExpression;

      // then
      expect(assignment.$type).toBe('bpmn:ResourceAssignmentExpression');
      expect(assignment.expression.$type).toBe('bpmn:FormalExpression');
      expect(assignment.expression.body).toBe('user(fozzie), group(management)');
    });


    it('reads historyLevel', function() {
      expect(extensionsOfType(process, 'flowable:HistoryLevel')[0].body).toBe('audit');
    });

  });


  describe('start event', function() {

    it('reads initiator, formKey, formFieldValidation and sameDeployment', function() {

      // when
      const request = findElement(definitions, 'request');

      // then
      expect(request.initiator).toBe('employee');
      expect(request.formKey).toBe('vacationRequest');
      expect(request.formFieldValidation).toBe('${validateForms}');
      expect(request.sameDeployment).toBe(false);
    });


    it('keeps formFieldValidation as text and leaves sameDeployment unset when absent', function() {

      // when
      const plainStart = findElement(definitions, 'plainStart');

      // then
      expect(plainStart.formFieldValidation).toBe('true');
      expect(plainStart.sameDeployment).toBeUndefined();
    });


    it('reads form properties with their attributes and enum values', function() {

      // when
      const [ days, startDate, motivation, kind ] = extensionsOfType(findElement(definitions, 'request'), 'flowable:FormProperty');

      // then
      expect(days.id).toBe('days');
      expect(days.name).toBe('Number of days');
      expect(days.type).toBe('long');
      expect(days.variable).toBe('numberOfDays');
      expect(days.required).toBe(true);

      expect(startDate.datePattern).toBe('dd-MM-yyyy');
      expect(startDate.lenientDateParsing).toBe(true);
      expect(startDate.readable).toBe(true);
      expect(startDate.writable).toBe(true);

      expect(motivation.default).toBe('Rest');
      expect(motivation.expression).toBe('${motivation}');
      expect(motivation.writable).toBe(false);
      expect(motivation.required).toBeUndefined();

      expect(kind.values.map(v => [ v.$type, v.id, v.name ])).toEqual([
        [ 'flowable:Value', 'paid', 'Paid leave' ],
        [ 'flowable:Value', 'unpaid', 'Unpaid leave' ]
      ]);
    });

  });


  describe('roundtrip', function() {

    it('writes the fixture back without changes', async function() {

      // when
      const { original, saved } = await roundtrip(FIXTURE);

      // then
      expect(saved).toEqual(original);
    });


    it('writes resource assignments as <formalExpression>, which Flowable reads', async function() {

      // given
      const { moddle, definitions } = await importFixture(FIXTURE);

      // when
      const { xml } = await moddle.toXML(definitions);

      // then
      expect(xml).toContain('<potentialOwner><resourceAssignmentExpression><formalExpression>user(kermit), group(management)</formalExpression>');
      expect(xml).toContain('<flowable:potentialStarter><resourceAssignmentExpression><formalExpression>user(fozzie), group(management)</formalExpression>');
      expect(xml).not.toContain('tFormalExpression');
    });


    it('creates and writes start event forms', async function() {

      // given
      const moddle = createModdle();
      const startEvent = moddle.create('bpmn:StartEvent', {
        id: 'start',
        initiator: 'starter',
        formKey: 'startForm',
        sameDeployment: true,
        extensionElements: moddle.create('bpmn:ExtensionElements', {
          values: [
            moddle.create('flowable:FormProperty', {
              id: 'choice',
              type: 'enum',
              required: true,
              values: [ moddle.create('flowable:Value', { id: 'a', name: 'A' }) ]
            })
          ]
        })
      });

      // when
      const { xml } = await moddle.toXML(startEvent);

      // then
      expect(xml).toContain('flowable:initiator="starter" flowable:formKey="startForm" flowable:sameDeployment="true"');
      expect(xml).toContain('<flowable:formProperty id="choice" type="enum" required="true"><flowable:value id="a" name="A" /></flowable:formProperty>');
    });

  });

});
