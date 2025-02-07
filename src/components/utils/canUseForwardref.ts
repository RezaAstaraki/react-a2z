const canUseRefAsProp = (() => {
  try {
    const testFn = (props: { ref?: any }) => null;
    testFn({ ref: null }); // No error means ref can be used as a prop
    return true;
  } catch {
    return false;
  }
})();
