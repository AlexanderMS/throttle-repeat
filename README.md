# throttle-repeat

Repeatedly executes a given `task` at a given maximum `rate` (in milliseconds) `until` a given condition is true.

Optionally, accepts `reducer` and `initialValue` to reduce results of each iteration. Allows for a non-constant rate depending on the most recent execution.

## Usage
```javascript
const throttleRepeat = require('throttle-repeat');

return throttleRepeat({
  task: (index) => {
    console.log(`An async action running every second: ${index}`);
    return Promise.resolve(index);
  },
  rate: () => 1000,
  until: (count, lastResult) => (count === 5 || lastResult > 10)
})
.then(result => console.log(result));
// returns 5
```

## API

`throttleRepeat(params) -> Promise<Any>`

### Required parameters

  * **task**: `function(index) -> Promise<Any>`

  Defines an action to perform on each iteration. Must be yield-able. `index` determines iteration number.

  * **rate**: `function(lastResult) -> Number (milliseconds)`

  Defines the minimum number of milliseconds to wait since the *start* of the most recent call to `task`. Invoked after each iteration, with `lastResult` of each iteration returned by `task`. If `task` took more than the `rate` milliseconds, then next `task` is called right away. Next task is always executed sequentially, not earlier than until the most recent task yields.

  *Example 1*. For a fixed wait time, e.g., two seconds, just provide a constant value: `rate: () => 2000`. This means each `task` will be called at most once in two seconds. If a `task` took more than two seconds, then the next `task` is called right after the most recent task yields.

  *Example 2*. For a variable wait time, e.g., to achieve on average at most 20 requests/s for a variable-load task:
    1. Make your task return the actual request count, so `lastResult` becomes `actualRequestCount`. (alternatively, it could be a field of the returned object).
    2. provide a formula, e.g., `rate: (actualRequestCount) => 1000 * actualRequestCount / 20`

  So, if `actualRequestCount` is 20, it will wait for one second since the start of the most recent task. If `actualRequestCount` is 10, it will wait only for half a second, so that, on average, the waiting time for each 20 items is one second. This is useful for tasks like polling a queue (with unknown number of messages) or a database (with unknown number of items) when throttling is important but always waiting for a constant amount of time is sub-optimal.

  * **until**: `function(count, lastResult) -> Boolean`

  Exit condition. `task` is called until the condition evaluates as true. The condition is
  first evaluated after the end of the first call. `count` is the number of `task` executions so far.

### Optional parameters

  * **reducer**: `function(accumulator, lastResult) -> Any`

  Reduces results returned by `task` as if they were in an array (`reduce` function in ES6). `initialValue` is used as the initial value. Defaults to a simple increment (thus, shows the number of executions).

  * **initialValue**: `Any`

  The initial value `accumulator` is set to. Defaults to `0`.

### Returns

  1. By default, returns the number of times `task` was called.

  2. If `reducer` and `initialValue` are specified, returns the most recent value of `accumulator`.

## More examples

### Reducer

```javascript
const throttleRepeat = require('throttle-repeat');

return throttleRepeat({
  task: (index) => {
    console.log('An async action running every second, five times');
    return Promise.resolve(index);
  },
  rate: () => 1000,
  until: (count) => (count === 5),
  reducer: (acc, lastResult) => `${acc},${lastResult + 1}`,
  initialValue: '0'
})
.then(result => console.log(result));
// returns "0,1,2,3,4,5"
```

### Advanced (polling a queue)

```javascript
const throttleRepeat = require('throttle-repeat');

return throttleRepeat({
  task: pollMessages.bind(null, QUEUE_URL),           // our poller
  rate: lastResult => 1000 * (lastResult.total / 20), // 20 msg/s
  until: (count, lastResult) =>
    lastResult.total <= 10, // until queue is almost empty
  reducer: (accumulator, lastResult) => {
    accumulator.totalProcessed += lastResult.total;
    accumulator.totalSucceeded += lastResult.succeeded;
    return accumulator;
  },
  initialValue: {
    totalProcessed: 0,
    totalSucceeded: 0
  }
})
.then(result => console.log(result));
// returns {
//   totalProcessed: 123
//   totalSucceeded: 120
// }
```
