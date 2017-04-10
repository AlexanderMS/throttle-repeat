# throttle-repeat

[![npm version](https://badge.fury.io/js/throttle-repeat.svg)](https://badge.fury.io/js/throttle-repeat)
[![CircleCI](https://circleci.com/gh/AlexanderMS/throttle-repeat.svg?style=shield)](https://circleci.com/gh/AlexanderMS/throttle-repeat)
[![Coverage Status](https://coveralls.io/repos/github/AlexanderMS/throttle-repeat/badge.svg?branch=master)](https://coveralls.io/github/AlexanderMS/throttle-repeat?branch=master)

Repeatedly executes a given `task` at a given maximum `rate` (in milliseconds) `until` a given condition is true.

Optionally, accepts `reducer` and `initialValue` to reduce results of each iteration. 

Allows for variable rates (based on the most recent iteration).

## Usage
```javascript
const throttleRepeat = require('throttle-repeat');

return throttleRepeat({
  task: (index) => {
    console.log(`An async action running every second: ${index}`);
    return Promise.resolve(index);
  },
  rate: () => 1000,
  until: (count, iterationResult) => (count === 5 || iterationResult > 10)
})
.then(result => console.log(result));
// returns 5
```

## API

`throttleRepeat(params) -> Promise<Any>`

### Required parameters

  * **task**: `function(index) -> Promise<Any>`

  An action to perform on each iteration. Must be yield-able. Iteration `index` is passed to the `task` function.

  * **rate**: `function(iterationResult) -> Number (milliseconds)`

  The number of milliseconds between the *start* of the completed iteration and the *start* of the next iteration. After each iteration, the module invokes the `rate` function with `iterationResult` of the completed iteration and computes the waiting time before starting the next iteration according to the formula: `<time before next iteration> = <result of rate(...)> - <execution time of the completed iteration>`. If completed iteration took more than the `rate` milliseconds, the next iteration is started immediately upon completion of the iteration. 

  *Example 1*. Fixed wait time. Just provide a constant value: `rate: () => 2000`. This means each `task` will be called every two seconds. If a `task` takes more than two seconds, the next iteration follows as soon as the most recent task yields, even if it is more than two seconds.

  *Example 2*. Variable wait time. A variable-load `task` could be instructed to return the actual request count, and `rate` could be defined as something like: `rate: (actualRequestCount) => 1000 * actualRequestCount / 20`. If 20 requests are sent, it waits for one second. If 10 requests are sent, the wait time is proportionally reduced to half a second. This is useful for tasks like polling a queue (with unknown number of messages) or a database (with unknown number of items) when throttling is important, but waiting for a constant amount of time is sub-optimal.

  * **until**: `function(count, iterationResult) -> Boolean`

  Exit condition. `task` is called until the condition evaluates as true. The condition is first evaluated after the end of the first call. `count` is the number of `task` executions so far, `iterationResult` is the result of the completed iteration.

### Optional parameters

  * **reducer**: `function(accumulator, iterationResult) -> Any`
  * **initialValue**: `Any`

  Applies the `reducer` function against an `accumulator` and each `iterationResult` to reduce it to a single value. `initialValue` is the initial value of `accumulator`. `reducer` defaults to a simple increment, while `initialValue` defaults to `0`.

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
  reducer: (acc, iterationResult) => `${acc},${iterationResult + 1}`,
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
  rate: iterationResult => 1000 * (iterationResult.total / 20), // 20 msg/s
  until: (count, iterationResult) =>
    iterationResult.total <= 10, // until queue is almost empty
  reducer: (accumulator, iterationResult) => {
    accumulator.totalProcessed += iterationResult.total;
    accumulator.totalSucceeded += iterationResult.succeeded;
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
