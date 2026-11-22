import { beforeAll, describe, expect, it } from 'vitest';

import { createModdle, extensionsOfType, findElement, importFixture, roundtrip } from './helper.js';

const FIXTURE = 'service-task.bpmn';


describe('service task', function() {

  let definitions, warnings;

  beforeAll(async function() {
    ({ definitions, warnings } = await importFixture(FIXTURE));
  });

  const task = id => findElement(definitions, id);


  it('reads without warnings', function() {
    expect(warnings).toEqual([]);
  });


  describe('implementation and result', function() {

    it('reads class, result variable options, skipExpression, extensionId and triggerable', function() {

      // when
      const javaClass = task('javaClass');

      // then
      expect(javaClass.$instanceOf('flowable:ServiceTask')).toBe(true);
      expect(javaClass.class).toBe('org.example.Delegate');
      expect(javaClass.resultVariableName).toBe('result');
      expect(javaClass.useLocalScopeForResultVariable).toBe(true);
      expect(javaClass.storeResultVariableAsTransient).toBe(false);
      expect(javaClass.skipExpression).toBe('${skip}');
      expect(javaClass.extensionId).toBe('java-v1');
      expect(javaClass.triggerable).toBe(true);
    });


    it('reads expression with the legacy resultVariable and delegateExpression with a form', function() {
      expect(task('expressionTask').expression).toBe('${calculator.add(a, b)}');
      expect(task('expressionTask').resultVariable).toBe('sum');
      expect(task('delegateTask').delegateExpression).toBe('${myDelegate}');
      expect(task('delegateTask').formKey).toBe('serviceForm');
      expect(task('delegateTask').formFieldValidation).toBe('true');
    });


    it('reads mapException entries', function() {

      // when
      const [ validation, root ] = extensionsOfType(task('javaClass'), 'flowable:MapException');

      // then
      expect(validation.errorCode).toBe('validationError');
      expect(validation.includeChildExceptions).toBe(true);
      expect(validation.body).toBe('org.example.ValidationException');
      expect(root.rootCause).toBe('org.example.RootCause');
      expect(root.includeChildExceptions).toBeUndefined();
    });

  });


  describe('types', function() {

    it('reads the type and the type fields', function() {

      // when
      const mail = task('mail');

      // then
      expect(mail.type).toBe('mail');
      expect(extensionsOfType(mail, 'flowable:Field').map(f => f.name)).toEqual([ 'to', 'subject' ]);
      expect(task('dmn').type).toBe('dmn');
    });


    it('reads http with its request and response handlers', function() {

      // when
      const http = task('http');
      const [ request ] = extensionsOfType(http, 'flowable:HttpRequestHandler');
      const [ response ] = extensionsOfType(http, 'flowable:HttpResponseHandler');

      // then
      expect(http.parallelInSameTransaction).toBe(true);
      expect(request.class).toBe('org.example.RequestHandler');
      expect(request.fields[0].stringValue).toBe('X-Test');
      expect(response.type).toBe('script');
      expect(response.script.language).toBe('groovy');
      expect(response.$instanceOf('flowable:HttpHandler')).toBe(true);
    });


    it('reads handler fields wrapped in extensionElements, which Flowable also accepts', function() {

      // when
      const [ response ] = extensionsOfType(task('httpNested'), 'flowable:HttpResponseHandler');

      // then
      expect(response.extensionElements.values[0].$type).toBe('flowable:Field');
      expect(response.extensionElements.values[0].string).toBe('firstName,lastName');
    });


    it('reads the case task attributes, including sameDeployment from flowable:FormSupported', function() {

      // when
      const caseTask = task('caseTask');

      // then
      expect(caseTask.caseDefinitionKey).toBe('claimCase');
      expect(caseTask.caseInstanceName).toBe('Claim ${claimId}');
      expect(caseTask.businessKey).toBe('${claimId}');
      expect(caseTask.inheritBusinessKey).toBe(false);
      expect(caseTask.inheritVariables).toBe(true);
      expect(caseTask.sameDeployment).toBe(true);
      expect(caseTask.fallbackToDefaultTenant).toBe(true);
      expect(caseTask.idVariableName).toBe('caseId');
    });


    it('reads the external worker topic and parameters', function() {

      // when
      const worker = task('worker');
      const [ input ] = extensionsOfType(worker, 'flowable:ExternalWorkerInParameter');
      const [ output ] = extensionsOfType(worker, 'flowable:ExternalWorkerOutParameter');

      // then
      expect(worker.topic).toBe('orders');
      expect(worker.doNotIncludeVariables).toBe(true);
      expect(worker.exclusive).toBe(false);
      expect([ input.source, input.target ]).toEqual([ 'orderId', 'id' ]);
      expect(output.transient).toBe(true);
      expect(output.$instanceOf('flowable:IOParameter')).toBe(true);
    });


    it('reads the send-event elements', function() {

      // when
      const sendEvent = task('sendEvent');
      const body = type => extensionsOfType(sendEvent, type)[0];

      // then
      expect(sendEvent.triggerable).toBe(true);
      expect(body('flowable:EventType').body).toBe('orderPlaced');
      expect(body('flowable:TriggerEventType').body).toBe('orderConfirmed');
      expect(body('flowable:SendSynchronously').body).toBe('true');
      expect(body('flowable:EventInParameter').sourceExpression).toBe('${order.id}');
      expect(body('flowable:EventOutParameter').sourceType).toBe('string');
      expect(body('flowable:TriggerEventCorrelationParameter').name).toBe('orderId');
      expect(body('flowable:TriggerEventCorrelationParameter').value).toBe('${order.id}');
      expect(body('flowable:ChannelKey').body).toBe('orders,audit');
      expect(body('flowable:SystemChannel')).toBeDefined();
    });

  });


  describe('roundtrip', function() {

    it('writes the fixture back without changes', async function() {

      // when
      const { original, saved } = await roundtrip(FIXTURE);

      // then
      expect(saved).toEqual(original);
    });


    it('creates and writes an external worker task', async function() {

      // given
      const moddle = createModdle();
      const serviceTask = moddle.create('bpmn:ServiceTask', {
        id: 'worker',
        type: 'external-worker',
        topic: 'orders',
        extensionElements: moddle.create('bpmn:ExtensionElements', {
          values: [
            moddle.create('flowable:ExternalWorkerInParameter', { source: 'a', target: 'b' }),
            moddle.create('flowable:MapException', { errorCode: 'e', body: 'java.lang.Exception' }),
            moddle.create('flowable:SystemChannel')
          ]
        })
      });

      // when
      const { xml } = await moddle.toXML(serviceTask);

      // then
      expect(xml).toContain('flowable:type="external-worker" flowable:topic="orders"');
      expect(xml).toContain('<flowable:externalWorkerInParameter source="a" target="b" />');
      expect(xml).toContain('<flowable:mapException errorCode="e">java.lang.Exception</flowable:mapException>');
      expect(xml).toContain('<flowable:systemChannel />');
    });

  });

});
