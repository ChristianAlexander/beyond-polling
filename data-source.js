import rxjs, { Subject } from "rxjs";

async function* incrementWithDelay(delay) {
  let value = 0;

  while (true) {
    await new Promise((resolve) => setTimeout(resolve, delay));
    yield value++;
  }
}

// createDataSource returns an RxJS Subject that emits incrementing values.
// The incrementing frequency can be controlled by the delay parameter, in milliseconds.
export function createDataSource(delay = 1000) {
  const data = rxjs.from(incrementWithDelay(delay));

  const source = new Subject();
  data.subscribe(source);

  return source;
}
