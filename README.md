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

The extensions it covers are listed in [docs/flowable-bpmn-extensions.md](https://github.com/jylups/bpmn-js-env/blob/main/docs/flowable-bpmn-extensions.md).

## Development

Work in the [bpmn-js-env](https://github.com/jylups/bpmn-js-env) workspace, which links this package with the others and with the playground. Issues for this package are tracked there.

```sh
npm install
npm run lint
npm test
```

## License

MIT
