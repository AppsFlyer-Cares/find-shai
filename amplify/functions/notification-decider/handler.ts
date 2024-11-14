import type { Handler } from "aws-lambda";
import type {
  Schema,
  LovedOne,
  SafeZone,
  Caregiver,
} from "../../data/resource";
import { generateClient } from "aws-amplify/api";
import { Amplify } from "aws-amplify";
import outputs from "../../../amplify_outputs.json";
import { pushNotificationToApp } from "./pushNotification";
import {
  buildNotificationMessage,
  get_ongoing_event,
  checkUserPreferences,
  get_safe_zone_by_id,
} from "./utils";

const client = generateClient<Schema>({ authMode: "iam" });
Amplify.configure(outputs);

export const handler: Handler = async (event) => {
  console.log(event);
  try {
    // check if event exists for loved one in this time
    // get the location name
    // build the meesage
    // upload to notifications DB
    // send push notifcation to the phone
    const { loved_one_id, geofence_id, position, event_type } = event.detail;

    const start_time = new Date("2024-11-03T14:00:00.000Z");
    const end_time = new Date("2024-11-03T17:15:00.000Z");
    const time_happend = new Date(
      (start_time.getTime() + end_time.getTime()) / 2
    ).getTime();
    // const time_happend = Date.now();

    console.log(
      `loved one id: ${loved_one_id}, geofence id: ${geofence_id}, time happened: ${time_happend}, position: ${position}, event type: ${event_type}`
    );

    const loved_one_user_data = await fetch_user_from_dynamodb(loved_one_id);

    const calendar_events = loved_one_user_data.calander_events.filter(
      (event) => event !== null && event !== undefined
    );

    const ongoingEvent = get_ongoing_event(calendar_events, time_happend);

    if (!ongoingEvent) {
      console.log(
        "no on going event, the function trigered from geofence but not in existing event"
      );
      return;
    }

    const safe_zone = get_safe_zone_by_id(
      loved_one_user_data.safe_zones as SafeZone[],
      geofence_id
    );

    const location_name = safe_zone.location_name;

    console.log("location name: " + location_name);

    const care_givers = await get_care_givers(loved_one_user_data);

    for (const care_giver of care_givers) {
      // Check if the event should trigger a notification based on caregiver preferences
      const { shouldSendNotification, isAsExpected } = checkUserPreferences(
        care_giver,
        time_happend.toString(),
        ongoingEvent.end_time,
        ongoingEvent.start_time
      );

      // Build the message
      const message_text = buildNotificationMessage(
        event_type,
        location_name,
        loved_one_user_data.name || ""
      );

      console.log("the message is:", message_text);

      //? we should write notification even if we did not send a actual push notification

      if (shouldSendNotification) {
        // Push message to the user's application
        if (care_giver.push_token) {
          await pushNotificationToApp(care_giver.id, care_giver.push_token, message_text);
          console.log("send push notfication");
        } else {
          console.log("Push token is undefined, cannot send push notification");
        }
        console.log("send push notfication");
      } else {
        console.log("DONT send push notfication but write to DB");
      }

      // Write notification to the notification DB with TTL
      const ttl = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days in seconds from now
      const result = await client.models.Notification.create({
        message: message_text,
        ttl: ttl,
        is_as_expected: isAsExpected,
        geofence_id: geofence_id,
        caregiver_id: care_giver.id,
        location_name: location_name,
        longitude: position[0],
        latitude: position[1],
        calander_event: ongoingEvent,
        safe_zone: safe_zone,
      });

      console.log("Notification created:", result.data);
    }
  } catch (error) {
    console.error("Error processing event:", error);
  }

  return "notifcation decider success!";
};

async function fetch_user_from_dynamodb(user_id: string): Promise<LovedOne> {
  return new Promise(async (resolve, reject) => {
    if (!user_id || user_id == "") {
      reject("empty user_id");
    }

    try {
      const result = await client.models.LovedOne.get({
        id: user_id,
      });
      console.log("result before check:", result);

      if (result && result.data) {
        resolve(result.data);
      }

      reject("user not found");
    } catch (error) {
      console.error("Error fetching user:", error);
      reject(error);
    }
  });
}

async function get_care_givers(loved_one_data: LovedOne): Promise<Caregiver[]> {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await loved_one_data.caregivers.call({
        loved_one_id: loved_one_data.id,
      });

      console.log("result before check:", result);

      if (result && result.data) {
        console.log("care givers found:", result.data);
        resolve(result.data);
      }

      reject("care givers not fount for this loved one");
    } catch (error) {
      console.error("Error fetching caregivers:", error);
      reject(error);
    }
  });
}
