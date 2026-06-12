# iOS RoomPlan Client

This folder is reserved for the native iOS capture client.

Do not start here unless the web-first design-card loop is validated. When this app is added, its main responsibility should be narrow:

1. Run guided RoomPlan capture.
2. Let the user confirm and correct dimensions.
3. Normalize the scan into the shared `Room` JSON contract.
4. Send that room to the API.

The API and recommendation engine should not depend on iOS-specific RoomPlan types.

