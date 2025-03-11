import type { Handler } from "aws-lambda";
import type { Schema } from "../../data/resource";
import { generateClient } from "aws-amplify/api";
import { Amplify } from "aws-amplify";
import {
  LocationClient,
  CreateGeofenceCollectionCommand,
  CreateTrackerCommand,
  AssociateTrackerConsumerCommand,
  CreateTrackerCommandInput,
  AssociateTrackerConsumerCommandInput,
  CreateGeofenceCollectionCommandInput,
} from "@aws-sdk/client-location";
import outputs from "../../../amplify_outputs.json";

Amplify.configure(outputs);
const client = generateClient<Schema>();
const location_client = new LocationClient({});

export const handler: Handler = async (event, context) => {
  console.log(event);

  if (!event["userName"] || event["userName"] == "") {
    // mock create loved one event for testing
    const id = event["arguments"]["user_data"];
    event = {
      version: "1",
      region: "eu-west-1",
      userPoolId: "eu-west-1_*****",
      userName: id,
      callerContext: {
        awsSdkVersion: "aws-sdk-swift-1.0",
        clientId: "2**********1",
      },
      triggerSource: "PostConfirmation_ConfirmSignUp",
      request: {
        userAttributes: {
          sub: id,
          email_verified: "true",
          "cognito:user_status": "CONFIRMED",
          email: id + "@gmail.com",
          given_name: "jonathan",
          preferred_username: "lovedone",
        },
      },
      response: {},
    };
  }

  var user_id = event["userName"];
  if (user_id.includes("google")) {
    user_id = event["request"]["userAttributes"]["sub"]
  }
  console.log('user_id is: ', user_id)
  const user_email = event["request"]["userAttributes"]["email"];
  const given_name = event["request"]["userAttributes"]["given_name"];
  const type = event["request"]["userAttributes"]["preferred_username"];
  const isLovedOne = type === "lovedone";

  try {
    if (isLovedOne) {
      console.log("creating a loved one");
      // Create geofence collection
      const collectionArn = await get_geofence_collection_arn(user_id);

      // Create tracker
      const trackerArn = await get_tracker_arn(user_id);

      // Associate tracker with grofence collection
      await associate_tracker_with_geo_collection(user_id, collectionArn);

      const { data, errors } = await client.models.LovedOne.create({
        id: user_id,
        email: user_email,
        name: given_name,
        calander_token: "none",
        calander_events: [],
        safe_zones: [],
        default_radius: 100,
        extra_time_in_calender: 15,
        geofence_collection_arn: collectionArn,
        tracker_arn: trackerArn,
        known_locations: [],
      });

      if (errors) {
        console.error(errors);
      }

      console.log(data);
    } else {
      // case for careGiver
      const { data, errors } = await client.models.Caregiver.create({
        id: user_id,
        email: user_email,
        name: given_name,
        loved_one_id: "none",
        should_send_messages: true,
        send_just_if_not_exepected: false,
        location_update_frequent: 15,
        quite_hours: [],
        time_buffer: 0,
      });

      if (errors) {
        console.error(errors);
      }

      console.log(data);
    }
  } catch (error) {
    console.log("error creating user");
    console.error("Error creating user:", error);
  }

  console.log("create user success");

  return event;
};

const get_geofence_collection_arn = async (
  user_id: string
): Promise<string> => {
  // Create geofence collection
  return new Promise(async (resolve, reject) => {
    try {
      const geofenceInput: CreateGeofenceCollectionCommandInput = {
        CollectionName: user_id,
      };
      const geofenceCommand = new CreateGeofenceCollectionCommand(
        geofenceInput
      );
      const geofenceResponse = await location_client.send(geofenceCommand);
      if (geofenceResponse && geofenceResponse["CollectionArn"]) {
        console.log(
          "create geofence collection success ",
          geofenceResponse["CollectionArn"]
        );
        resolve(geofenceResponse["CollectionArn"]);
      }
      reject("geofence arn not defined");
    } catch (error) {
      reject(error);
    }
  });
};

const get_tracker_arn = async (user_id: string): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      const trackerInput: CreateTrackerCommandInput = {
        TrackerName: user_id,
        PositionFiltering: "AccuracyBased",
      };
      const trackerCommand = new CreateTrackerCommand(trackerInput);
      const trackerResponse = await location_client.send(trackerCommand);
      if (trackerResponse && trackerResponse["TrackerArn"]) {
        console.log("create tracker success ", trackerResponse["TrackerArn"]);
        resolve(trackerResponse["TrackerArn"]);
      }
      reject("tracker arn not defined");
    } catch (error) {
      reject(error);
    }
  });
};

const associate_tracker_with_geo_collection = async (
  user_id: string,
  geofence_collection_arn: string
) => {
  // Links the geofence collection to the tracker.
  const input: AssociateTrackerConsumerCommandInput = {
    TrackerName: user_id,
    ConsumerArn: geofence_collection_arn,
  };
  const command = new AssociateTrackerConsumerCommand(input);
  await location_client.send(command);
};
