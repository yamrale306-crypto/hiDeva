import express from 'express';
import http from 'http';
import attachStreamEndpoint from './routes/stream';

const app = express();
const server = http.createServer(app);

// TODO: mount your existing REST routes and middleware here

// Attach the real-time stream endpoint
attachStreamEndpoint(server);

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`🚀 hiDeva Telephony Node active on port ${port}`);
});

