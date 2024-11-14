import { defineFunction } from "@aws-amplify/backend";

// Define createCode function
export const createCode = defineFunction({
  name: "createCode",
  entry: "./createCode.ts", // Points to createCode.ts handler
  environment: {
    NAME: "World",
  },
});

// Define checkForCode function
export const checkForCode = defineFunction({
  name: "checkForCode",
  entry: "./checkForCode.ts", // Points to checkForCode.ts handler
  environment: {
    NAME: "World",
  },
});
