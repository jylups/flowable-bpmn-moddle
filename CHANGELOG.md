# Changelog

All notable changes to this package are documented here.

## Unreleased

## 0.1.0

First stable release: the Flowable BPMN extensions the open-source engine reads (see the [coverage matrix](https://github.com/jylups/bpmn-js-env/blob/main/docs/coverage.md)), the Activiti-namespace migration helpers, and keeping unknown `flowable:*` elements.

* `FEAT`: add `registerUnknownFlowableElements` to keep `flowable:*` elements the descriptor does not define, and type the Flowable Work/Design elements `work-form-field-validation`, `task-candidates-type`, `static-process-key` and `translation` ([jylups/bpmn-js-env#65](https://github.com/jylups/bpmn-js-env/issues/65))
* `FEAT`: keep `itemSubjectRef` as text, so Flowable item types such as `xsd:int` survive load and save ([jylups/bpmn-js-env#62](https://github.com/jylups/bpmn-js-env/issues/62))

## 0.1.0-next.0

First prerelease with the Flowable extensions the open-source engine reads (see the [coverage matrix](https://github.com/jylups/bpmn-js-env/blob/main/docs/coverage.md)).

* `FEAT`: add `migrateActivitiXML` and `useFlowablePrefix` to import models written with the Activiti namespace as typed Flowable content and write them as `flowable:` ([jylups/bpmn-js-env#18](https://github.com/jylups/bpmn-js-env/issues/18))
* `FEAT`: add the signal `scope` and the sequence flow `skipExpression` (also read when written unprefixed, as Flowable does) ([jylups/bpmn-js-env#17](https://github.com/jylups/bpmn-js-env/issues/17))
* `FEAT`: add the event definition extensions (timer `businessCalendarName` and `timeCycle` `endDate`, signal `signalExpression` and `async`, message `messageExpression`, error variables, terminate `terminateAll` and `terminateMultiInstance`), `variableListenerEventDefinition` and the catch-side event registry elements (`eventName`, `eventCorrelationParameter`, `startEventCorrelationConfiguration`) ([jylups/bpmn-js-env#16](https://github.com/jylups/bpmn-js-env/issues/16))
* `FEAT`: add the multi-instance extensions (`collection`, `elementVariable`, `elementIndexVariable`, `noWaitStatesAsyncLeave`), the `collection` handler element and `variableAggregation` with its `variable` children, read with or without a prefix and written unprefixed as Flowable does ([jylups/bpmn-js-env#15](https://github.com/jylups/bpmn-js-env/issues/15))
* `FEAT`: add the call activity extensions (`calledElementType`, `processInstanceName`, `businessKey`, `inheritBusinessKey`, `inheritVariables`, `sameDeployment`, the legacy `calledElementBinding`, `useLocalScopeForOutParameters`, `completeAsync`, `fallbackToDefaultTenant`, `idVariableName`) and the `in` / `out` parameters, including the Activiti 5 forms ([jylups/bpmn-js-env#14](https://github.com/jylups/bpmn-js-env/issues/14))
* `FEAT`: add the script task (`resultVariable`, `resultVariableName`, `autoStoreVariables`, `doNotIncludeVariables`, `skipExpression`), business rule task (`ruleVariablesInput`, `rules`, `resultVariable`, `class`, `exclude`), send task (`type`) and receive task (`skipExpression`) extensions ([jylups/bpmn-js-env#13](https://github.com/jylups/bpmn-js-env/issues/13))
* `FEAT`: add the service task extensions: implementation and result attributes, `triggerable`, `skipExpression`, `extensionId`, `type`, the form attributes, `mapException`, the http, case and external-worker attributes, the HTTP request and response handlers, external worker parameters and the send-event elements (`eventType`, `triggerEventType`, `sendSynchronously`, event parameters, `triggerEventCorrelationParameter`, `channelKey`, `systemChannel`) ([jylups/bpmn-js-env#12](https://github.com/jylups/bpmn-js-env/issues/12))
* `FEAT`: add the user task extensions (`assignee`, `owner`, `candidateUsers`, `candidateGroups`, `dueDate`, `businessCalendarName`, `category`, `priority`, `extensionId`, `skipExpression`, `taskIdVariableName`, `taskCompleterVariableName`), the form attributes on user tasks and `customResource` ([jylups/bpmn-js-env#11](https://github.com/jylups/bpmn-js-env/issues/11))
* `FEAT`: add the process extensions (`candidateStarterUsers`, `candidateStarterGroups`, `isEagerExecutionFetching`, `potentialStarter`, `historyLevel`) and the start event extensions (`initiator`, `formKey`, `formFieldValidation`, `sameDeployment`, `formProperty` with `value`) ([jylups/bpmn-js-env#10](https://github.com/jylups/bpmn-js-env/issues/10))
* `FIX`: write resource assignments (`potentialOwner`, `humanPerformer`, `potentialStarter`) with a `<formalExpression>` child instead of `<expression xsi:type="tFormalExpression">`, which Flowable does not read ([jylups/bpmn-js-env#10](https://github.com/jylups/bpmn-js-env/issues/10))
* `FEAT`: add execution, task and event listeners, fields (`stringValue` and `expression` attributes, `string` and `expression` children) and scripts ([jylups/bpmn-js-env#9](https://github.com/jylups/bpmn-js-env/issues/9))
* `FEAT`: add `async`, `exclusive`, `asyncLeave` and `asyncLeaveExclusive` on flow nodes ([jylups/bpmn-js-env#8](https://github.com/jylups/bpmn-js-env/issues/8))
* `FEAT`: add the `failedJobRetryTimeCycle`, `element-name`, `jobCategory`, `includeInHistory` and `localization` (with `documentation`) extension elements ([jylups/bpmn-js-env#8](https://github.com/jylups/bpmn-js-env/issues/8))

## 0.0.1-next.0

Test prerelease of the release pipeline: published from a GitHub release by `publish.yml` through npm trusted publishing, with provenance. The descriptor is still empty.

* `CHORE`: add the package scaffold: ESM package, lint and Vitest setup ([jylups/bpmn-js-env#3](https://github.com/jylups/bpmn-js-env/issues/3))
* `CHORE`: add CI and the trusted-publishing release workflow ([jylups/bpmn-js-env#4](https://github.com/jylups/bpmn-js-env/issues/4))
