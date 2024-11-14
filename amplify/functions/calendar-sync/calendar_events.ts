import type { CalendarEvent } from "../../data/resource";
import ICAL from "ical.js";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

// Initialize the Google Calendar API with a static token
// const calendar = google.calendar({
//   version: "v3",
//   auth: "",
// });

// Function to list Google Calendar events
export async function listEvents(
  calendar_token: string
): Promise<CalendarEvent[]> {
  try {
    let url_calendar =
      "https://calendar.google.com/calendar/ical/user@gmail.com/private-1234556/basic.ics";
    // url_calendar = calendar_token
    const events = await downloadAndConvertICS(url_calendar); // Ensure the URL is passed correctly

    return events;
  } catch (error) {
    console.error("Got an error:", error);
    throw error;
  }
}

async function downloadAndConvertICS(icsURL: string): Promise<CalendarEvent[]> {
  try {
    // URL from the user DB
    const response = await axios.get(icsURL); // Fetch the ICS file
    const icsData: string = response.data;

    // Parse the ICS data
    const jcalData = ICAL.parse(icsData);
    const component = new ICAL.Component(jcalData);

    // Define the date range (today to 7 days after today)
    const currentDate = new Date();
    const timeMin = new Date(currentDate);
    const timeMax = new Date(currentDate);
    timeMax.setDate(currentDate.getDate() + 7); // Add 7 days
    timeMax.setHours(23, 59, 59, 999); // Set time to end of that day

    // Extract and filter events within the specified date range
    const events: CalendarEvent[] = component
      .getAllSubcomponents("vevent")
      .map((event) => {
        const vevent = new ICAL.Event(event);
        if (
          vevent.location &&
          vevent.summary &&
          vevent.startDate &&
          vevent.endDate &&
          !/^https?:\/\//i.test(vevent.location)
        ) {
          return {
            id: uuidv4(),
            event_name: vevent.summary,
            start_time: vevent.startDate.toJSDate().toISOString(),
            end_time: vevent.endDate.toJSDate().toISOString(),
            custom_buffer_time: 0,
            mute_this_event: false,
            location_name: vevent.location,
            is_from_google_calendar: true,
            safe_zone_id: null,
          } as CalendarEvent;
        }
        return null;
      })
      .filter((event): event is CalendarEvent => event !== null)
      .filter((event) => {
        const eventStart = new Date(event.start_time);
        return eventStart >= timeMin && eventStart <= timeMax;
      });

    return events;
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
}
