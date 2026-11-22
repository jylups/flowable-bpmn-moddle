# Changelog

All notable changes to this package are documented here.

## Unreleased

* `FEAT`: add execution, task and event listeners, fields (`stringValue` and `expression` attributes, `string` and `expression` children) and scripts ([jylups/bpmn-js-env#9](https://github.com/jylups/bpmn-js-env/issues/9))
* `FEAT`: add `async`, `exclusive`, `asyncLeave` and `asyncLeaveExclusive` on flow nodes ([jylups/bpmn-js-env#8](https://github.com/jylups/bpmn-js-env/issues/8))
* `FEAT`: add the `failedJobRetryTimeCycle`, `element-name`, `jobCategory`, `includeInHistory` and `localization` (with `documentation`) extension elements ([jylups/bpmn-js-env#8](https://github.com/jylups/bpmn-js-env/issues/8))

## 0.0.1-next.0

Test prerelease of the release pipeline: published from a GitHub release by `publish.yml` through npm trusted publishing, with provenance. The descriptor is still empty.

* `CHORE`: add the package scaffold: ESM package, lint and Vitest setup ([jylups/bpmn-js-env#3](https://github.com/jylups/bpmn-js-env/issues/3))
* `CHORE`: add CI and the trusted-publishing release workflow ([jylups/bpmn-js-env#4](https://github.com/jylups/bpmn-js-env/issues/4))
