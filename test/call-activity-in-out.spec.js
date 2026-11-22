import { beforeAll, describe, expect, it } from 'vitest';

import { createModdle, extensionsOfType, findElement, importFixture, roundtrip } from './helper.js';

const FIXTURE = 'call-activity-in-out.bpmn';


describe('call activity and in/out parameters', function() {

  let definitions, warnings;

  beforeAll(async function() {
    ({ definitions, warnings } = await importFixture(FIXTURE));
  });

  const element = id => findElement(definitions, id);


  it('reads without warnings', function() {
    expect(warnings).toEqual([]);
  });


  it('reads the call activity attributes', function() {

    // when
    const call = element('callChild');

    // then
    expect(call.$instanceOf('flowable:CallActivity')).toBe(true);
    expect(call.calledElement).toBe('child');
    expect(call.calledElementType).toBe('key');
    expect(call.processInstanceName).toBe('Child of ${parentName}');
    expect(call.businessKey).toBe('${orderId}');
    expect(call.inheritBusinessKey).toBe(false);
    expect(call.inheritVariables).toBe(true);
    expect(call.sameDeployment).toBe(true);
    expect(call.useLocalScopeForOutParameters).toBe(true);
    expect(call.completeAsync).toBe(true);
    expect(call.fallbackToDefaultTenant).toBe(true);
    expect(call.idVariableName).toBe('childId');
  });


  it('reads the legacy calledElementBinding', function() {
    expect(element('legacyCall').calledElementType).toBe('id');
    expect(element('legacyCall').calledElementBinding).toBe('deployment');
  });


  it('reads in parameters with source, expression, target type and transient', function() {

    // when
    const [ plain, expression, transientIn ] = extensionsOfType(element('callChild'), 'flowable:In');

    // then
    expect(plain.$instanceOf('flowable:IOParameter')).toBe(true);
    expect([ plain.source, plain.target ]).toEqual([ 'customer', 'client' ]);
    expect(expression.sourceExpression).toBe('${order.total * 2}');
    expect(expression.targetType).toBe('long');
    expect(transientIn.transient).toBe(true);
  });


  it('reads out parameters with target expression and source type', function() {

    // when
    const [ plain, expression ] = extensionsOfType(element('callChild'), 'flowable:Out');

    // then
    expect([ plain.source, plain.target ]).toEqual([ 'result', 'childResult' ]);
    expect(expression.sourceExpression).toBe('${status}');
    expect(expression.targetExpression).toBe('${outcome.status}');
    expect(expression.sourceType).toBe('string');
  });


  it('reads the Activiti 5 forms: variables="all", local and businessKey', function() {

    // when
    const [ all, businessKey ] = extensionsOfType(element('legacyCall'), 'flowable:In');
    const [ allOut ] = extensionsOfType(element('legacyCall'), 'flowable:Out');

    // then
    expect(all.variables).toBe('all');
    expect(businessKey.businessKey).toBe('${parentKey}');
    expect(allOut.variables).toBe('all');
    expect(allOut.local).toBe(true);
  });


  it('reads in on start events and script tasks, and out on end events', function() {
    expect(extensionsOfType(element('start'), 'flowable:In')[0].target).toBe('amount');
    expect(extensionsOfType(element('script'), 'flowable:In')[0].target).toBe('y');
    expect(extensionsOfType(element('end'), 'flowable:Out')[0].target).toBe('parentResult');
  });


  it('reads mapException on call activities', function() {
    expect(extensionsOfType(element('callChild'), 'flowable:MapException')[0].errorCode).toBe('childFailed');
  });


  describe('roundtrip', function() {

    it('writes the fixture back without changes', async function() {

      // when
      const { original, saved } = await roundtrip(FIXTURE);

      // then
      expect(saved).toEqual(original);
    });


    it('creates and writes a call activity with in and out parameters', async function() {

      // given
      const moddle = createModdle();
      const call = moddle.create('bpmn:CallActivity', {
        id: 'call',
        calledElement: 'child',
        inheritVariables: true,
        extensionElements: moddle.create('bpmn:ExtensionElements', {
          values: [
            moddle.create('flowable:In', { source: 'a', target: 'b' }),
            moddle.create('flowable:Out', { variables: 'all' })
          ]
        })
      });

      // when
      const { xml } = await moddle.toXML(call);

      // then
      expect(xml).toContain('calledElement="child" flowable:inheritVariables="true"');
      expect(xml).toContain('<flowable:in source="a" target="b" />');
      expect(xml).toContain('<flowable:out variables="all" />');
    });

  });

});
