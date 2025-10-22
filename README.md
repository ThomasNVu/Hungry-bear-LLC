# Hungry-bear-LLC

We are creating a calendar app with a focus on encryption/user privacy.
Users will be able to add edit and cancel events on their calendars as well as send event invites via link to other registered users on the app. Once a user accepts an invite they are added to the event attendees list and the event appears on their calendar. If the users rejects the invite nothing happens and the event does not appear on their calendar.

--Use Case 1--

Actors User 1, User 2, Database

Description User 1 sends an event invite link to User 2. User 2 then decides if they will accept the link or reject. If accepted, a command is sent to the API to update the database and add User 2 to the necessary tables. User 2’s calendar is then updated to reflect the new event. If User 2 rejects the link. The user’s ID is verified. Once their ID is verified it redirects them to the calendar.

Data: Event Details, Permission, Attendees Table

Stimulus: User 2 Clicks on the link

Response
User 2 Confirms: User 2’s permission gets updated and they can see the event in their calendar
User 2 Rejects: Redirects to User 2’s Calendar

Comments
• Both Users must have an account
• Permission in database updates both User

--Use Case 2--

Actors User 1, User 2, Database

Description User 1 sends an event invite link to User 2. User 2 then decides if they will accept the link or reject. If accepted, a command is sent to the API to update the database and add User 2 to the necessary tables. User 2’s calendar is then updated to reflect the new event. If User 2 rejects the link. The user’s ID is verified. Once their ID is verified it redirects them to the calendar.

Data: Event Details, Permission, Attendees Table

Stimulus: User 2 Clicks on the link

Response
User 2 Confirms: User 2’s permission gets updated and they can see the event in their calendar
User 2 Rejects: Redirects to User 2’s Calendar

Comments
• Both Users must have an account
• Permission in database updates both User

Unit Test:
https://youtu.be/O4QeY0d-43Y
