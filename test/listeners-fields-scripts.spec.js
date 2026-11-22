import { beforeAll, describe, expect, it } from 'vitest';

import { createModdle, extensionsOfType, findElement, importFixture, roundtrip } from './helper.js';

const FIXTURE = 'listeners-fields-scripts.bpmn';


describe('listeners, fields and scripts', function() {

  let definitions, warnings, process;

  beforeAll(async function() {
    ({ definitions, warnings } = await importFixture(FIXTURE));

    process = definitions.rootElements[0];
  });


  it('reads without warnings', function() {
    expect(warnings).toEqual([]);
  });


  describe('execution listeners', function() {

    it('reads class, onTransaction and the custom properties resolver', function() {

      // when
      const [ start ] = extensionsOfType(process, 'flowable:ExecutionListener');

      // then
      expect(start.event).toBe('start');
      expect(start.class).toBe('org.example.StartListener');
      expect(start.onTransaction).toBe('before-commit');
      expect(start.customPropertiesResolverClass).toBe('org.example.Resolver');
    });


    it('reads expression and delegateExpression variants', function() {

      // when
      const [ , end ] = extensionsOfType(process, 'flowable:ExecutionListener');
      const [ onStart ] = extensionsOfType(findElement(definitions, 'start'), 'flowable:ExecutionListener');

      // then
      expect(end.expression).toBe('${audit.end(execution)}');
      expect(end.customPropertiesResolverExpression).toBe('${resolver.resolve(execution)}');
      expect(onStart.delegateExpression).toBe('${startListener}');
      expect(onStart.customPropertiesResolverDelegateExpression).toBe('${resolverBean}');
    });


    it('reads a script listener on a sequence flow', function() {

      // when
      const [ take ] = extensionsOfType(findElement(definitions, 'toReview'), 'flowable:ExecutionListener');

      // then
      expect(take.event).toBe('take');
      expect(take.type).toBe('script');
      expect(take.script.$type).toBe('flowable:Script');
      expect(take.script.language).toBe('groovy');
      expect(take.script.resultVariable).toBe('taken');
      expect(take.script.body).toBe('execution.setVariable(\'taken\', true)');
    });


    it('is a flowable:Listener', function() {
      const [ start ] = extensionsOfType(process, 'flowable:ExecutionListener');

      expect(start.$instanceOf('flowable:Listener')).toBe(true);
    });

  });


  describe('fields', function() {

    it('reads stringValue, expression and the string and expression children', function() {

      // when
      const [ start ] = extensionsOfType(process, 'flowable:ExecutionListener');
      const [ plain, computed, text, nested ] = start.fields;

      // then
      expect(start.fields).toHaveLength(4);
      expect(plain.$type).toBe('flowable:Field');

      expect(plain.name).toBe('plain');
      expect(plain.stringValue).toBe('audit');

      expect(computed.expression).toBe('${auditLevel}');

      expect(text.string).toBe('multi\nline');

      expect(nested.expression).toBeUndefined();
      expect(nested.expressionElement.$type).toBe('flowable:Expression');
      expect(nested.expressionElement.body).toBe('${channel.name}');
    });

  });


  describe('task listeners', function() {

    it('reads every event type and implementation', function() {

      // when
      const listeners = extensionsOfType(findElement(definitions, 'review'), 'flowable:TaskListener');

      // then
      expect(listeners.map(l => l.event)).toEqual([ 'create', 'assignment', 'complete', 'delete', 'all' ]);
      expect(listeners[0].class).toBe('org.example.Notify');
      expect(listeners[0].fields[0].stringValue).toBe('review-created');
      expect(listeners[1].expression).toBe('${notify.assigned(task)}');
      expect(listeners[2].delegateExpression).toBe('${completeListener}');
      expect(listeners[2].onTransaction).toBe('committed');
      expect(listeners[3].type).toBe('script');
      expect(listeners[3].script.language).toBe('javascript');
    });

  });


  describe('event listeners', function() {

    it('reads class, delegateExpression and the throw-event forms', function() {

      // when
      const [ byClass, signal, message, error, byDelegate ] = extensionsOfType(process, 'flowable:EventListener');

      // then
      expect(byClass.events).toBe('TASK_CREATED,TASK_COMPLETED');
      expect(byClass.entityType).toBe('task');
      expect(byClass.class).toBe('org.example.TaskEvents');
      expect(byClass.onTransaction).toBe('committed');

      expect(signal.throwEvent).toBe('signal');
      expect(signal.signalName).toBe('jobFailed');

      expect(message.throwEvent).toBe('message');
      expect(message.messageName).toBe('cancelled');

      expect(error.throwEvent).toBe('error');
      expect(error.errorCode).toBe('failure');

      expect(byDelegate.delegateExpression).toBe('${entityListener}');
    });

  });


  describe('roundtrip', function() {

    it('writes the fixture back without changes', async function() {

      // when
      const { original, saved } = await roundtrip(FIXTURE);

      // then
      expect(saved).toEqual(original);
    });


    it('reads prefixed listener attributes and writes them unprefixed, as Flowable does', async function() {

      // given
      const moddle = createModdle();
      const xml = '<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" ' +
        'xmlns:flowable="http://flowable.org/bpmn" id="d" targetNamespace="t">' +
        '<process id="p"><userTask id="u"><extensionElements>' +
        '<flowable:taskListener flowable:event="complete" flowable:class="org.example.Done" />' +
        '</extensionElements></userTask></process></definitions>';

      // when
      const { rootElement, warnings } = await moddle.fromXML(xml, 'bpmn:Definitions');
      const listener = rootElement.rootElements[0].flowElements[0].extensionElements.values[0];
      const { xml: saved } = await moddle.toXML(rootElement);

      // then
      expect(warnings).toEqual([]);
      expect(listener.event).toBe('complete');
      expect(listener.class).toBe('org.example.Done');
      expect(saved).toContain('<flowable:taskListener event="complete" class="org.example.Done" />');
    });


    it('creates and writes listeners with fields and scripts', async function() {

      // given
      const moddle = createModdle();
      const listener = moddle.create('flowable:ExecutionListener', {
        event: 'start',
        type: 'script',
        script: moddle.create('flowable:Script', { language: 'groovy', body: 'println "hi"' })
      });
      const withFields = moddle.create('flowable:TaskListener', {
        event: 'create',
        class: 'org.example.Notify',
        fields: [
          moddle.create('flowable:Field', { name: 'a', stringValue: 'x' }),
          moddle.create('flowable:Field', {
            name: 'b',
            expressionElement: moddle.create('flowable:Expression', { body: '${b}' })
          })
        ]
      });

      // when
      const { xml: a } = await moddle.toXML(listener);
      const { xml: b } = await moddle.toXML(withFields);

      // then
      expect(a).toContain('<flowable:executionListener xmlns:flowable="http://flowable.org/bpmn" event="start" type="script">');
      expect(a).toContain('<flowable:script language="groovy">println "hi"</flowable:script>');
      expect(b).toContain('<flowable:field name="a" stringValue="x" />');
      expect(b).toContain('<flowable:field name="b"><flowable:expression>${b}</flowable:expression></flowable:field>');
    });

  });

});
