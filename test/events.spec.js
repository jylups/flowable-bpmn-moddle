import { beforeAll, describe, expect, it } from 'vitest';

import { createModdle, extensionsOfType, findElement, importFixture, roundtrip } from './helper.js';

const FIXTURE = 'events.bpmn';


describe('events, event definitions and the event registry', function() {

  let definitions, warnings;

  beforeAll(async function() {
    ({ definitions, warnings } = await importFixture(FIXTURE));
  });

  const element = id => findElement(definitions, id);
  const definition = id => element(id).eventDefinitions[0];


  it('reads without warnings', function() {
    expect(warnings).toEqual([]);
  });


  describe('event definitions', function() {

    it('reads the timer business calendar and the time cycle end date', function() {

      // when
      const timer = definition('reminder');

      // then
      expect(timer.businessCalendarName).toBe('workdays');
      expect(timer.timeCycle.body).toBe('R3/PT1H');
      expect(timer.timeCycle.endDate).toBe('2026-12-31T23:59:59');
    });


    it('reads the error variable attributes', function() {

      // when
      const error = definition('failed');

      // then
      expect(error.errorRef.id).toBe('paymentError');
      expect(error.errorVariableName).toBe('paymentFailure');
      expect(error.errorVariableTransient).toBe(true);
      expect(error.errorVariableLocalScope).toBe(false);
    });


    it('reads messageExpression, signalExpression and the throwing signal async flag', function() {
      expect(definition('waitMessage').messageExpression).toBe('${\'order-\' + orderId}');
      expect(definition('raise').signalExpression).toBe('${alertName}');
      expect(definition('raise').async).toBe(true);
    });


    it('reads terminateAll and terminateMultiInstance', function() {
      expect(definition('stop').terminateAll).toBe(true);
      expect(definition('stop').terminateMultiInstance).toBe(false);
    });

  });


  describe('variable listener', function() {

    it('reads the variable listener event definition', function() {

      // when
      const [ listener ] = extensionsOfType(element('watch'), 'flowable:VariableListenerEventDefinition');

      // then
      expect(listener.variableName).toBe('status');
      expect(listener.variableChangeType).toBe('update-create');
    });

  });


  describe('event registry', function() {

    it('reads the start event registry elements', function() {

      // when
      const start = element('orderReceived');
      const one = type => extensionsOfType(start, type)[0];

      // then
      expect(one('flowable:EventType').body).toBe('orderCreated');
      expect(one('flowable:EventName').body).toBe('Order created');
      expect(one('flowable:EventCorrelationParameter').name).toBe('customerId');
      expect(one('flowable:EventCorrelationParameter').value).toBe('${customerId}');
      expect(one('flowable:EventCorrelationParameter').type).toBe('string');
      expect(one('flowable:EventOutParameter').sourceType).toBe('double');
      expect(one('flowable:EventOutParameter').transient).toBe(false);
      expect(one('flowable:StartEventCorrelationConfiguration').body).toBe('storeAsUniqueReferenceId');
    });

  });


  describe('roundtrip', function() {

    it('writes the fixture back without changes', async function() {

      // when
      const { original, saved } = await roundtrip(FIXTURE);

      // then
      expect(saved).toEqual(original);
    });


    it('creates and writes event definition extensions', async function() {

      // given
      const moddle = createModdle();
      const terminate = moddle.create('bpmn:TerminateEventDefinition', { terminateAll: true });
      const listener = moddle.create('flowable:VariableListenerEventDefinition', { variableName: 'x', variableChangeType: 'all' });

      // when
      const { xml: a } = await moddle.toXML(terminate);
      const { xml: b } = await moddle.toXML(listener);

      // then
      expect(a).toContain('flowable:terminateAll="true"');
      expect(b).toContain('<flowable:variableListenerEventDefinition xmlns:flowable="http://flowable.org/bpmn" variableName="x" variableChangeType="all" />');
    });

  });

});
