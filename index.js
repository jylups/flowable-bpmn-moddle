import flowableDescriptor from './resources/flowable.json' with { type: 'json' };

/**
 * The Flowable moddle descriptor (namespace `http://flowable.org/bpmn`,
 * prefix `flowable`).
 *
 * Pass it to bpmn-js or bpmn-moddle as `moddleExtensions: { flowable }`.
 */
export default flowableDescriptor;

export {
  ACTIVITI_NS,
  FLOWABLE_NS,
  migrateActivitiXML,
  useFlowablePrefix
} from './lib/migrate.js';
