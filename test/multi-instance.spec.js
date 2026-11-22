import { beforeAll, describe, expect, it } from 'vitest';

import { createModdle, extensionsOfType, findElement, importFixture, roundtrip } from './helper.js';

const FIXTURE = 'multi-instance.bpmn';


describe('multi-instance and variable aggregation', function() {

  let definitions, warnings;

  beforeAll(async function() {
    ({ definitions, warnings } = await importFixture(FIXTURE));
  });

  const loop = id => findElement(definitions, id).loopCharacteristics;


  it('reads without warnings', function() {
    expect(warnings).toEqual([]);
  });


  it('reads collection, element variables and noWaitStatesAsyncLeave', function() {

    // when
    const characteristics = loop('review');

    // then
    expect(characteristics.$instanceOf('flowable:MultiInstanceLoopCharacteristics')).toBe(true);
    expect(characteristics.collection).toBe('${reviewers}');
    expect(characteristics.elementVariable).toBe('reviewer');
    expect(characteristics.elementIndexVariable).toBe('reviewIndex');
    expect(characteristics.noWaitStatesAsyncLeave).toBe(true);
  });


  it('reads collection handlers with string and expression children', function() {

    // when
    const [ byClass ] = extensionsOfType(loop('byClass'), 'flowable:Collection');
    const [ byDelegate ] = extensionsOfType(loop('byDelegate'), 'flowable:Collection');

    // then
    expect(byClass.class).toBe('org.example.CsvCollectionHandler');
    expect(byClass.string).toBe('a,b,c');
    expect(byDelegate.delegateExpression).toBe('${collectionHandler}');
    expect(byDelegate.expression).toBe('${orders.ids}');
  });


  it('reads variable aggregations and their unprefixed variables', function() {

    // when
    const [ reviews, summary, custom ] = extensionsOfType(loop('review'), 'flowable:VariableAggregation');

    // then
    expect(reviews.target).toBe('reviews');
    expect(reviews.createOverviewVariable).toBe(true);
    expect(reviews.storeAsTransientVariable).toBe(false);
    expect(reviews.variable.map(v => [ v.$type, v.source, v.target ])).toEqual([
      [ 'flowable:Variable', 'approved', 'approved' ],
      [ 'flowable:Variable', undefined, undefined ]
    ]);
    expect(reviews.variable[1].sourceExpression).toBe('${comment.trim()}');
    expect(reviews.variable[1].targetExpression).toBe('${review.comment}');

    expect(summary.targetExpression).toBe('${summary}');
    expect(summary.class).toBe('org.example.Aggregator');
    expect(custom.delegateExpression).toBe('${aggregator}');
  });


  it('reads a prefixed <flowable:variable> too', async function() {

    // given
    const moddle = createModdle();
    const xml = '<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" ' +
      'xmlns:flowable="http://flowable.org/bpmn" id="d" targetNamespace="t"><process id="p">' +
      '<userTask id="u"><multiInstanceLoopCharacteristics><extensionElements>' +
      '<flowable:variableAggregation target="t"><flowable:variable source="a" target="b" /></flowable:variableAggregation>' +
      '</extensionElements></multiInstanceLoopCharacteristics></userTask></process></definitions>';

    // when
    const { rootElement, warnings } = await moddle.fromXML(xml, 'bpmn:Definitions');
    const [ aggregation ] = rootElement.rootElements[0].flowElements[0].loopCharacteristics.extensionElements.values;

    // then
    expect(warnings).toEqual([]);
    expect(aggregation.variable[0].source).toBe('a');
  });


  describe('roundtrip', function() {

    it('writes the fixture back without changes', async function() {

      // when
      const { original, saved } = await roundtrip(FIXTURE);

      // then
      expect(saved).toEqual(original);
    });


    it('writes aggregation variables unprefixed, as Flowable does', async function() {

      // given
      const { moddle, definitions } = await importFixture(FIXTURE);

      // when
      const { xml } = await moddle.toXML(definitions);

      // then
      expect(xml).toContain('<flowable:variableAggregation target="reviews" storeAsTransientVariable="false" createOverviewVariable="true"><variable source="approved" target="approved" />');
    });


    it('creates and writes multi-instance extensions', async function() {

      // given
      const moddle = createModdle();
      const characteristics = moddle.create('bpmn:MultiInstanceLoopCharacteristics', {
        collection: '${items}',
        elementVariable: 'item',
        extensionElements: moddle.create('bpmn:ExtensionElements', {
          values: [
            moddle.create('flowable:VariableAggregation', {
              target: 'results',
              variable: [ moddle.create('flowable:Variable', { source: 'r', target: 'result' }) ]
            })
          ]
        })
      });

      // when
      const { xml } = await moddle.toXML(characteristics);

      // then
      expect(xml).toContain('flowable:collection="${items}" flowable:elementVariable="item"');
      expect(xml).toContain('<flowable:variableAggregation target="results"><bpmn:variable source="r" target="result" /></flowable:variableAggregation>');
    });

  });

});
