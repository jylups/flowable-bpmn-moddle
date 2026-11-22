import { beforeAll, describe, expect, it } from 'vitest';

import { createModdle, extensionsOfType, findElement, importFixture, roundtrip } from './helper.js';

const FIXTURE = 'script-rule-send-receive.bpmn';


describe('script, business rule, send and receive tasks', function() {

  let definitions, warnings;

  beforeAll(async function() {
    ({ definitions, warnings } = await importFixture(FIXTURE));
  });

  const task = id => findElement(definitions, id);


  it('reads without warnings', function() {
    expect(warnings).toEqual([]);
  });


  it('reads the script task attributes', function() {

    // when
    const groovy = task('groovy');

    // then
    expect(groovy.$instanceOf('flowable:ScriptTask')).toBe(true);
    expect(groovy.resultVariable).toBe('sum');
    expect(groovy.autoStoreVariables).toBe(false);
    expect(groovy.doNotIncludeVariables).toBe(true);
    expect(groovy.skipExpression).toBe('${skipScript}');
    expect(groovy.script).toBe('a + b');
  });


  it('reads the legacy resultVariableName on script tasks', function() {
    expect(task('legacyResult').resultVariableName).toBe('total');
    expect(task('legacyResult').autoStoreVariables).toBe(true);
  });


  it('reads the business rule task attributes', function() {

    // when
    const rules = task('rules');

    // then
    expect(rules.ruleVariablesInput).toBe('order,customer');
    expect(rules.rules).toBe('discountRule,shippingRule');
    expect(rules.resultVariable).toBe('ruleResult');
    expect(rules.exclude).toBe(true);
    expect(task('customRules').class).toBe('org.example.RuleEngine');
  });


  it('reads the send task type and fields', function() {

    // when
    const sendMail = task('sendMail');

    // then
    expect(sendMail.type).toBe('mail');
    expect(extensionsOfType(sendMail, 'flowable:Field').map(f => f.name)).toEqual([ 'to', 'subject' ]);
    expect(task('sendCamel').type).toBe('camel');
  });


  it('reads the receive task skipExpression and event registry elements', function() {

    // when
    const waitEvent = task('waitEvent');

    // then
    expect(task('waitSignal').skipExpression).toBe('${skipWait}');
    expect(extensionsOfType(waitEvent, 'flowable:EventType')[0].body).toBe('orderShipped');
    expect(extensionsOfType(waitEvent, 'flowable:EventOutParameter')[0].target).toBe('tracking');
  });


  describe('roundtrip', function() {

    it('writes the fixture back without changes', async function() {

      // when
      const { original, saved } = await roundtrip(FIXTURE);

      // then
      expect(saved).toEqual(original);
    });


    it('keeps an explicit autoStoreVariables="false", as Flowable writes it', async function() {

      // given
      const moddle = createModdle();
      const scriptTask = moddle.create('bpmn:ScriptTask', {
        id: 's',
        scriptFormat: 'groovy',
        autoStoreVariables: false,
        script: 'x'
      });

      // when
      const { xml } = await moddle.toXML(scriptTask);

      // then
      expect(xml).toContain('flowable:autoStoreVariables="false"');
    });

  });

});
