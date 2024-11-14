# Find Shai


Find Shai is an open source project that provides real time geofencing based on Shai's busy calendar

## About Find Shai

This is Shai's calendar:

<img src="docs/calendar.png" alt="Logo" width="400">

Our goal is to notify shai's family when he enters/exists an event on his calendar. 

We notify his family on two main events:
1. Enter - the user has entered the location of an event on his calendar.
2. Exit - the user exits the location of a calendar event.

<img src="./docs/geofence_in_out.gif" width="300" height="300">


## Running the project

1. Set up aws cli and credentials

First get started by [setting up the AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-quickstart.html). Then make sure you have the [required permissions](https://docs.aws.amazon.com/amplify/latest/userguide/security-iam-awsmanpol.html) for AWS Amplify. 

2. Prepare the project by running:
```
npm install
``` 


3. Next, run the following command to inizialize [AWS Amplify](https://docs.amplify.aws/):

```
npx ampx sandbox
```

Now Find Shai is ready to go!



### Running the mobile app:

```
cd find-shai-mobile-app
npm install
npm run start
```
