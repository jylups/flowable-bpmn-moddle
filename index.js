import flowableDescriptor from './resources/flowable.json' with { type: 'json' };

/**
 * The Flowable moddle descriptor (namespace `http://flowable.org/bpmn`,
 * prefix `flowable`).
 *
 * Pass it to bpmn-js or bpmn-moddle as `moddleExtensions: { flowable }`.
 */
export default flowableDescriptor;
