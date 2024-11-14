// import { CalendarEvent } from '../../data/resource';
// import { get_ongoing_event } from './utils'; // Adjust the import path as necessary

// test('getOngoingEvent success', () => {
//     const events: CalendarEvent[] = [
//         {
//             id: '1',
//             event_name: 'Event 1',
//             start_time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // set start to 1 hour ago
//             end_time: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(), // set end to 1 hour from now
//             custom_buffer_time: 0,
//             mute_this_event: false,
//             is_from_google_calendar: false
//         },
//     ];
//     const result = get_ongoing_event(events);
//     expect(result).toEqual(events[0]);
// });

// test('getOngoingEvent failed', () => {
//     const events: CalendarEvent[] = [
//         {
//             id: '1',
//             event_name: 'Event 1',
//             start_time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // set start to 3 hour ago
//             end_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // set end to 2 hours ago
//             custom_buffer_time: 0,
//             mute_this_event: false,
//             is_from_google_calendar: false
//         },
//     ];
//     try{
//         const result = get_ongoing_event(events);
//     } catch (error) {
//         expect(error).toEqual(new Error('No ongoing event found'));
//     }
// });

// test('getOngoingEvent failed', () => {


// });