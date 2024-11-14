import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { calendarSync } from "./functions/calendar-sync/resource";
import {
  createCode,
  checkForCode,
} from "./functions/link-code-generator/resource";
import { notificationDecider } from "./functions/notification-decider/resource";
import { Policy, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { aws_events } from "aws-cdk-lib";
import { CfnApp } from "aws-cdk-lib/aws-pinpoint";
import { Stack } from "aws-cdk-lib/core";
import { postConfirmation } from "./auth/post-confirmation/resource";
import { locationFetcher } from "./functions/location-fetcher/resource";

import * as iam from "aws-cdk-lib/aws-iam";

const backend = defineBackend({
  auth,
  data,
  calendarSync,
  notificationDecider,
  postConfirmation,
  locationFetcher,
  createCode,
  checkForCode,
});

const { cfnResources } = backend.data.resources;

// Enable TTL for WatchPairing model
cfnResources.amplifyDynamoDbTables["WatchPairing"].timeToLiveAttribute = {
  attributeName: "ttl", // Ensure this is the name used in the Lambda handler
  enabled: true,
};

const notificationDeciderLambda = backend.notificationDecider.resources.lambda;
const locationFetcherLambda = backend.locationFetcher.resources.lambda;

const analyticsStack = backend.createStack("analytics-stack");

// Reference or create an EventBridge EventBus
const eventBus = aws_events.EventBus.fromEventBusName(
  analyticsStack,
  "MyEventBus",
  "default"
);

backend.data.addEventBridgeDataSource("MyEventBridgeDataSource", eventBus);

// create a Pinpoint app
const pinpointApp = new CfnApp(analyticsStack, "Pinpoint", {
  name: "myPinpointApp",
});

const postConfirmationLambda = backend.postConfirmation.resources.lambda;
const calendarSyncLambda = backend.calendarSync.resources.lambda;

const statement = new iam.PolicyStatement({
  sid: "AllowAllGeo",
  actions: ["geo:*"],
  resources: ["*"],
});

postConfirmationLambda.addToRolePolicy(statement);
calendarSyncLambda.addToRolePolicy(statement);
locationFetcherLambda.addToRolePolicy(statement);

const notificationDeciderStatement = new iam.PolicyStatement({
  sid: "AllowSendPushNotification",
  actions: ["mobiletargeting:*"],
  resources: ["*"],
});

notificationDeciderLambda.addToRolePolicy(notificationDeciderStatement);

// create an IAM policy to allow interacting with Pinpoint
const pinpointPolicy = new Policy(analyticsStack, "PinpointPolicy", {
  policyName: "PinpointPolicy",
  statements: [
    new PolicyStatement({
      actions: ["mobiletargeting:UpdateEndpoint", "mobiletargeting:PutEvents"],
      resources: [pinpointApp.attrArn + "/*"],
    }),
  ],
});

const appSyncAllPolicy = new Policy(analyticsStack, "AppSyncPolicy", {
  policyName: "AppSyncPolicy",
  statements: [
    new PolicyStatement({
      actions: ["appsync:*"],
      resources: ["*"],
    }),
  ],
});

// apply the policy to the authenticated and unauthenticated roles
backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(
  pinpointPolicy
);
backend.auth.resources.unauthenticatedUserIamRole.attachInlinePolicy(
  pinpointPolicy
);
backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(
  appSyncAllPolicy
);
backend.auth.resources.unauthenticatedUserIamRole.attachInlinePolicy(
  appSyncAllPolicy
);

backend.addOutput({
  notifications: {
    aws_region: Stack.of(pinpointApp).region,
    amazon_pinpoint_app_id: pinpointApp.ref,
    channels: ["APNS"],
  },
});
