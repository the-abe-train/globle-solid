globalThis.fetch = async () => {
  throw new Error('Unit test attempted network access; provide an explicit fixture');
};
