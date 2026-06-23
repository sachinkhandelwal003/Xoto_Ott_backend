import mongoose from 'mongoose';

async function checkMovies() {
  await mongoose.connect('mongodb+srv://kotiboxserver_db_user:pS4U8tbfpRGZcPRz@cluster0.7opughx.mongodb.net/streamvault');
  
  const movies = await mongoose.connection.collection('movies').find({}, { projection: { title: 1, hlsUrl: 1, videoUrl: 1 } }).sort({ createdAt: -1 }).limit(5).toArray();
  
  console.log(JSON.stringify(movies, null, 2));
  
  mongoose.disconnect();
}

checkMovies().catch(console.error);
