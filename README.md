# @jylups/flowable-bpmn-moddle

Flowable moddle extensions for BPMN 2.0.

Built in Phase 1 of the Flowable BPMN editor ([jylups/bpmn-js-env#7](https://github.com/jylups/bpmn-js-env/issues/7)).

## Install

```sh
npm install @jylups/flowable-bpmn-moddle
```

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

## Activiti namespace

Flowable also reads its extensions in the Activiti namespace (`http://activiti.org/bpmn`). The descriptor registers only the Flowable namespace, so import such models through the migration helpers to get typed content that is written back as `flowable:`:

```js
import { migrateActivitiXML, useFlowablePrefix } from '@jylups/flowable-bpmn-moddle';

const { rootElement } = await moddle.fromXML(migrateActivitiXML(xml), 'bpmn:Definitions');

// ... edit ...

const { xml: saved } = await moddle.toXML(useFlowablePrefix(rootElement));
```

`migrateActivitiXML` only rewrites `xmlns` declarations. It also fixes models that bind the `flowable` prefix to the Activiti namespace, which otherwise fail to export.

Attributes Flowable reads without a namespace (listener, field, in/out and similar sub-attributes, the sequence flow `skipExpression`) are read whether or not they carry a prefix.

## Unknown Flowable elements

Flowable keeps any extension element it doesn't know, and Flowable Work/Design and users add their own. With the descriptor registered, bpmn-moddle would drop `flowable:*` elements it has no type for. Call `registerUnknownFlowableElements` with the moddle instance before importing, and they are kept and written back unchanged:

```js
import { registerUnknownFlowableElements } from '@jylups/flowable-bpmn-moddle';

registerUnknownFlowableElements(moddle, xml); // in bpmn-js: modeler.get('moddle')

const { rootElement } = await moddle.fromXML(xml, 'bpmn:Definitions');
```

The Flowable Work/Design elements seen so far (`work-form-field-validation`, `task-candidates-type`, `static-process-key`, `translation`) are typed.

`itemSubjectRef` is kept as text, because Flowable uses values such as `xsd:string` without declaring an `itemDefinition`.

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
| Data objects, signals, sequence flows | data object `value` (`flowable:Value`), signal `scope`, sequence flow `skipExpression` |
| Fields and scripts | `field` with `stringValue`, `expression` (attribute) or `string` / `expression` children (`expressionElement`), `script` |

Listener, field and script attributes are written without a prefix, as Flowable's own exporter writes them; prefixed spellings such as `flowable:class` on a listener are read too.

With the descriptor registered, a `resourceAssignmentExpression` (in `potentialOwner`, `humanPerformer` and `flowable:potentialStarter`) is written with a `<formalExpression>` child, as Flowable expects, instead of bpmn-moddle's `<expression xsi:type="tFormalExpression">`.

The diagram interchange attributes Flowable writes (`sourceDockerX`/`Y` and `targetDockerX`/`Y` on `BPMNEdge`, `rotation` on `BPMNLabel`) are kept as unknown attributes and written back unchanged. They are not typed, because extending `bpmndi:BPMNEdge` or `bpmndi:BPMNLabel` from this package would make moddle write those tags as `bPMNEdge` / `bPMNLabel`.

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
