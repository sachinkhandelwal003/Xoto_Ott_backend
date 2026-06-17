const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://kotiboxserver_db_user:pS4U8tbfpRGZcPRz@cluster0.7opughx.mongodb.net/streamvault').then(async () => {
  const db = mongoose.connection.db;
  
  // Find episodes missing hlsUrl
  const eps = await db.collection('episodes').updateMany(
    { $or: [{ hlsUrl: null }, { hlsUrl: '' }, { hlsUrl: { $exists: false } }] },
    { $set: { hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' } }
  );
  console.log('Updated empty episodes:', eps.modifiedCount);

  // Find movies missing hlsUrl
  const movies = await db.collection('movies').updateMany(
    { $or: [{ hlsUrl: null }, { hlsUrl: '' }, { hlsUrl: { $exists: false } }] },
    { $set: { hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' } }
  );
  console.log('Updated empty movies:', movies.modifiedCount);

  mongoose.disconnect();
}).catch(e => console.error(e.message));
