export const getEnv = (key: string, defaultValue: string = "") => {
  const value = process.env[key] || defaultValue;
  if (value === undefined || value === null) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value;
};
