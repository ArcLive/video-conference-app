# broadcastr

This application is the video conference application, where you can create a room, invite guests, change brand, instant chat.

* Account SID: Your primary Twilio account identifier - find this [in the console here](https://www.twilio.com/console).
* API Key: Used to authenticate - [generate one here](https://www.twilio.com/console/runtime/api-keys).
* API Secret: Used to authenticate - [just like the above, you'll get one here](https://www.twilio.com/console/runtime/api-keys).

## Setting Up The Application

Create a configuration file for your application:
```bash
cp .env.template .env
```

Edit `.env` with the configuration.

Next, we need to install our dependencies from npm:
```bash
npm install
```

Now we should be all set! Run the application:
```bash
npm start
```

Great!
go to [http://localhost:3000/](http://localhost:3000/)

## Development mode
Using nodemon for dev mode:
```bash
npm run start:dev
```
