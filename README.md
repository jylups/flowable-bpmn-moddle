# @jylups/flowable-bpmn-moddle

Flowable moddle extensions for BPMN 2.0.

> Work in progress. This package is being built in Phase 1 of the Flowable BPMN editor ([jylups/bpmn-js-env#7](https://github.com/jylups/bpmn-js-env/issues/7)). It is not published yet.

## Usage

```js
import BpmnModeler from 'bpmn-js/lib/Modeler';
import flowableDescriptor from '@jylups/flowable-bpmn-moddle';

const modeler = new BpmnModeler({
  container: '#canvas',
  moddleExtensions: {
    flowable: flowableDescriptor
  }
});
```

The descriptor is also available as `@jylups/flowable-bpmn-moddle/resources/flowable.json`.

## Covered extensions

| Area | Extensions |
|---|---|
| Flow nodes | `async`, `exclusive`, `asyncLeave`, `asyncLeaveExclusive` (`flowable:AsyncCapable`) |
| Extension elements | `failedJobRetryTimeCycle`, `element-name`, `jobCategory`, `includeInHistory`, `localization` with `documentation` |
| Listeners | `executionListener`, `taskListener` (shared `flowable:Listener`), `eventListener` |
| Process | `candidateStarterUsers`, `candidateStarterGroups`, `isEagerExecutionFetching`, `potentialStarter`, `historyLevel` |
| Start event | `initiator`, `formKey`, `formFieldValidation`, `sameDeployment` (`flowable:FormSupported`), `formProperty` with `value` |
| User task | `assignee`, `owner`, `candidateUsers`, `candidateGroups`, `dueDate`, `businessCalendarName`, `category`, `priority`, `extensionId`, `skipExpression`, `taskIdVariableName`, `taskCompleterVariableName` (`flowable:UserTask`), the form attributes (`flowable:FormSupported`), `customResource` |
| Service task | `class`, `expression`, `delegateExpression`, `resultVariableName` (and `resultVariable`), `useLocalScopeForResultVariable`, `storeResultVariableAsTransient`, `skipExpression`, `extensionId`, `triggerable`, `type`, http `parallelInSameTransaction`, the case attributes, external worker `topic` and `doNotIncludeVariables` (`flowable:ServiceTask`); `mapException`, `httpRequestHandler` / `httpResponseHandler`, `externalWorkerInParameter` / `externalWorkerOutParameter` |
| Script task | `resultVariable`, `resultVariableName`, `autoStoreVariables`, `doNotIncludeVariables`, `skipExpression` |
| Business rule task | `ruleVariablesInput`, `rules`, `resultVariable`, `class`, `exclude` |
| Send and receive tasks | send task `type` (with `field`), receive task `skipExpression` |
| Call activity | `calledElementType`, `processInstanceName`, `businessKey`, `inheritBusinessKey`, `inheritVariables`, `sameDeployment`, `calledElementBinding`, `useLocalScopeForOutParameters`, `completeAsync`, `fallbackToDefaultTenant`, `idVariableName` |
| In/out parameters | `in` and `out` (on `flowable:IOParameter`: `source`, `sourceExpression`, `target`, `targetExpression`, `sourceType`, `targetType`, `transient`; plus `variables`, `local`, `businessKey`) on call activities, start events, script tasks, case tasks and events |
| Multi-instance | `collection`, `elementVariable`, `elementIndexVariable`, `noWaitStatesAsyncLeave`; the `collection` handler (`class` / `delegateExpression` with `string` / `expression`); `variableAggregation` with `variable` children |
| Event definitions | timer `businessCalendarName`, `timeCycle` `endDate`, signal `signalExpression` and `async`, message `messageExpression`, error `errorVariableName` / `errorVariableTransient` / `errorVariableLocalScope`, terminate `terminateAll` / `terminateMultiInstance`, `variableListenerEventDefinition` |
| Event registry | `eventType`, `eventName`, `eventCorrelationParameter`, `eventInParameter`, `eventOutParameter`, `startEventCorrelationConfiguration`, `triggerEventType`, `sendSynchronously`, `triggerEventCorrelationParameter`, `channelKey`, `systemChannel` |
| Fields and scripts | `field` with `stringValue`, `expression` (attribute) or `string` / `expression` children (`expressionElement`), `script` |

Listener, field and script attributes are written without a prefix, as Flowable's own exporter writes them; prefixed spellings such as `flowable:class` on a listener are read too.

With the descriptor registered, a `resourceAssignmentExpression` (in `potentialOwner`, `humanPerformer` and `flowable:potentialStarter`) is written with a `<formalExpression>` child, as Flowable expects, instead of bpmn-moddle's `<expression xsi:type="tFormalExpression">`.

The full list of Flowable extensions, and which ones are covered so far, is in the [coverage matrix](https://github.com/jylups/bpmn-js-env/blob/main/docs/coverage.md). The extensions themselves are listed in [docs/flowable-bpmn-extensions.md](https://github.com/jylups/bpmn-js-env/blob/main/docs/flowable-bpmn-extensions.md).

## Development

Work in the [bpmn-js-env](https://github.com/jylups/bpmn-js-env) workspace, which links this package with the others and with the playground. Issues for this package are tracked there.

```sh
npm install
npm run lint
npm test
```

## License

MIT
