import {
  PinpointClient,
  SendMessagesCommand,
  SendMessagesCommandInput,
} from "@aws-sdk/client-pinpoint";

// Push notification to the user's application, checking if it's an Android or iOS device

export async function pushNotificationToApp(
  care_giver_id: string,
  token: string,
  message_text: string
): Promise<void> {
  // console.log(
  //   `Pushing notification to caregiver ${care_giver_id}: ${message_text}`
  // );

  console.log("Pushing notification to caregiver:", care_giver_id);

  const applicationId = "5d9dcb687b7d43aba8ef3f6465c8039c"; // Replace with your Pinpoint application ID

  const pinpointClient = new PinpointClient({ region: "eu-west-1" });

  const params: SendMessagesCommandInput = {
    ApplicationId: applicationId,
    MessageRequest: {
      Addresses: {
        [token]: {
          // This should be the endpoint ID or user identifier
          ChannelType: "APNS_SANDBOX", // APNS for iOS, GCM for Android devices
        },
      },
      MessageConfiguration: {
        APNSMessage: {
          Action: "OPEN_APP",
          Body: message_text,
          Title: "Find Shai Notification",
          TimeToLive: 60, // TTL in seconds
          Priority: "high",
        },
      },
    },
  };

  console.log("Sending notification to Pinpoint...");
  try {
    const command = new SendMessagesCommand(params);
    const response = await pinpointClient.send(command);
    console.log("Notification response: ", response);
  } catch (error) {
    console.error("Error sending notification: ", error);
  }
}
