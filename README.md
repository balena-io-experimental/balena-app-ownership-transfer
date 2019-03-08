# balena-app-ownership-transfer

(This is an experimental script, use at your own risk)

This is a simple script to transfer *all* apps owned by a user in balenaCloud to another user.

The source user and target user are selected by providing SOURCE_TOKEN and TARGET_TOKEN authentication tokens
(from the Preferences section in the balenaCloud dashboard) as environment variables. Optionally a DRY_RUN=true env variable
makes the script show the apps that would be transferred and exit.
