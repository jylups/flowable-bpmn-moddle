import { beforeAll, describe, expect, it } from 'vitest';

import { createModdle, extensionsOfType, findElement, importFixture, roundtrip } from './helper.js';

const FIXTURE = 'user-task.bpmn';


describe('user task', function() {

  let definitions, warnings;

  beforeAll(async function() {
    ({ definitions, warnings } = await importFixture(FIXTURE));
  });


  it('reads without warnings', function() {
    expect(warnings).toEqual([]);
  });


  it('reads assignment attributes', function() {

    // when
    const review = findElement(definitions, 'review');

    // then
    expect(review.assignee).toBe('${initiator}');
    expect(review.owner).toBe('kermit');
    expect(review.candidateUsers).toBe('gonzo,fozzie');
    expect(review.candidateGroups).toBe('management,sales');
  });


  it('reads scheduling attributes as text', function() {

    // when
    const review = findElement(definitions, 'review');
    const handover = findElement(definitions, 'handover');

    // then
    expect(review.dueDate).toBe('${dueDate}');
    expect(review.businessCalendarName).toBe('workdays');
    expect(review.category).toBe('approvals');
    expect(review.priority).toBe('${priority}');
    expect(handover.dueDate).toBe('P2DT4H');
    expect(handover.priority).toBe('80');
  });


  it('reads the form attributes through flowable:FormSupported', function() {

    // when
    const review = findElement(definitions, 'review');

    // then
    expect(review.$instanceOf('flowable:FormSupported')).toBe(true);
    expect(review.formKey).toBe('reviewForm');
    expect(review.formFieldValidation).toBe('false');
    expect(review.sameDeployment).toBe(true);
  });


  it('reads extensionId, skipExpression and the task variable names', function() {

    // when
    const review = findElement(definitions, 'review');

    // then
    expect(review.extensionId).toBe('review-v2');
    expect(review.skipExpression).toBe('${skipReview}');
    expect(review.taskIdVariableName).toBe('reviewTaskId');
    expect(review.taskCompleterVariableName).toBe('reviewer');
  });


  it('reads custom resources with their assignments', function() {

    // when
    const [ admin, watcher ] = extensionsOfType(findElement(definitions, 'review'), 'flowable:CustomResource');

    // then
    expect(admin.name).toBe('businessAdministrator');
    expect(admin.resourceAssignmentExpression.expression.$type).toBe('bpmn:FormalExpression');
    expect(admin.resourceAssignmentExpression.expression.body).toBe('user(admin), group(auditors)');
    expect(watcher.name).toBe('watcher');
    expect(watcher.resourceAssignmentExpression.expression.body).toBe('group(observers)');
  });


  it('reads task listeners and form properties on the user task', function() {

    // when
    const review = findElement(definitions, 'review');

    // then
    expect(extensionsOfType(review, 'flowable:TaskListener')).toHaveLength(1);
    expect(extensionsOfType(review, 'flowable:FormProperty')[0].required).toBe(true);
  });


  describe('roundtrip', function() {

    it('writes the fixture back without changes', async function() {

      // when
      const { original, saved } = await roundtrip(FIXTURE);

      // then
      expect(saved).toEqual(original);
    });


    it('writes custom resources and humanPerformer with <formalExpression>', async function() {

      // given
      const { moddle, definitions } = await importFixture(FIXTURE);

      // when
      const { xml } = await moddle.toXML(definitions);

      // then
      expect(xml).toContain('<flowable:customResource name="businessAdministrator"><resourceAssignmentExpression><formalExpression>user(admin), group(auditors)</formalExpression>');
      expect(xml).toContain('<humanPerformer><resourceAssignmentExpression><formalExpression>kermit</formalExpression>');
    });


    it('creates and writes a user task with assignment and a custom resource', async function() {

      // given
      const moddle = createModdle();
      const task = moddle.create('bpmn:UserTask', {
        id: 'task',
        assignee: 'kermit',
        candidateGroups: 'sales',
        dueDate: 'PT1H',
        extensionElements: moddle.create('bpmn:ExtensionElements', {
          values: [
            moddle.create('flowable:CustomResource', {
              name: 'businessAdministrator',
              resourceAssignmentExpression: moddle.create('bpmn:ResourceAssignmentExpression', {
                expression: moddle.create('bpmn:FormalExpression', { body: 'user(admin)' })
              })
            })
          ]
        })
      });

      // when
      const { xml } = await moddle.toXML(task);

      // then
      expect(xml).toContain('flowable:assignee="kermit" flowable:candidateGroups="sales" flowable:dueDate="PT1H"');
      expect(xml).toContain('<flowable:customResource name="businessAdministrator"><bpmn:resourceAssignmentExpression><bpmn:formalExpression>user(admin)</bpmn:formalExpression></bpmn:resourceAssignmentExpression></flowable:customResource>');
    });

  });

});
