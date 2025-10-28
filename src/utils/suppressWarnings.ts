
export const suppressPointerEventsWarning = () => {
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('pointerEvents') ||
       args[0].includes('is deprecated'))
    ) {
      return;
    }
    originalWarn(...args);
  };

  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('pointerEvents')
    ) {
      return;
    }
    originalError(...args);
  };
};
