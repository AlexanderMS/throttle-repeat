# throttle-repeat

Execute a task at a limited rate (in milliseconds) while a condition holds. Reduce results

```javascript
const
  throttleRepeat = require('throttle-repeat');

const output = yield throttleRepeat({
  waitTime: function(acc, lastResult) { // limit `pollMessages` to at most once a second
    return 1000,
  },
  action: pollMessages, // function to call (must be yield-able)
  whileCondition: function(acc, lastResult) {
     return context.getRemainingTimeInMillis() > 2000; // keep calling while this condition holds
  },
  reducer: function(acc, lastResult) {          // lastResult returned by pollMessages
    acc.totalProcessed += lastResult.total;
    acc.totalSucceeded += lastResult.succeeded;
    return acc;
  },
  initialValue: {
    totalProcessed: 0,
    totalSucceeded: 0
  }
});

// Example output:
// {
//    totalProcessed: 12,
//    totalSucceeded: 10
//  }
```

`initialValue` and `reducer` are optional and default to `0` and regular counting, respectively.
