# throttle-repeat

Repeatedly executes a given `task` at a given maximum `rate` (in milliseconds) `until` a given condition is true.

Optionally, accepts `reducer` and `initialValue` to reduce results of each iteration. Allows for a non-constant rate depending on the most recent execution.

## API

`throttleRepeat(params) : Promise<Any>`

### Required parameters

  1. **task**: `function() -> Promise<Any>`

  Defines an action to perform on each iteration. Must be yield-able.

  2. **rate**: `function(lastResult) -> Number (milliseconds)`

  Defines the minimum number of milliseconds to wait since the *start* of the most recent call to `task`. Invoked after each iteration, with `lastResult` of each iteration returned by `task`. If `task` took more than the `rate` milliseconds, then next `task` is called right away. Next task is always executed sequentially, not earlier than until the most recent task yields.

  *Example 1*. For a fixed wait time, e.g., two seconds, just provide a constant value: `waitTime: () => 2000`. This means each `task` will be called at most once in two seconds. If a `task` took more than two seconds, then the next `task` is called right after the most recent task yields.

  *Example 2*. For a variable wait time, e.g., to achieve on average at most 20 requests/s for a variable-load task:
    1. Make your task return the actual request count, so `lastResult` becomes `actualRequestCount`. (alternatively, it could be a field of the returned object).
    2. provide a formula, e.g., `waitTime: (actualRequestCount) => 1000 * actualRequestCount / 20`

  So, if `actualRequestCount` is 20, it will wait for one second since the start of the most recent task. If `actualRequestCount` is 10, it will wait only for half a second, so that, on average, the waiting time for each 20 items is one second. This is useful for tasks like polling a queue (with unknown number of messages) or a database (with unknown number of items) when throttling is important but always waiting for a constant amount of time is sub-optimal.

  3. **until**: `function(count, lastResult) -> Boolean`

  Exit condition. `task` is called until the condition evaluates as true. The condition is
  first evaluated after the end of the first call. `count` is the number of `task` executions so far (unless optional `reducer` is specified, in which case `count` becomes `accumulator`).

### Optional parameters

  4. **reducer**: `function(accumulator, lastResult) -> Any`

  Reduces results returned by `task` as if they were in an array (`reduce` function in ES6). `initialValue` is used as the initial value. Defaults to a simple increment (thus, shows the number of executions).

  5. **initialValue**: `Any`

  The initial value `accumulator` is set to. Defaults to `0`.

### Returns

  1. By default, returns the number of times `task` was called.

  2. If `reducer` and `initialValue` are specified, returns the most recent value of `accumulator`.
