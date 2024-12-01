const {onRequest} = require("firebase-functions/v2/https");
const admin = require('firebase-admin');
const { getStorage, getDownloadURL } = require('firebase-admin/storage');

//const { Storage } = require('@google-cloud/storage');
//import { getStorage, ref, getDownloadURL } from "firebase/storage";

const path = require('path');
const fs = require('fs');

admin.initializeApp();
const storage = admin.storage();

exports.uploadImage = onRequest(
    { cors: true },
     async (req, res) => {
  console.log('Inside uploadImage function, request is:', req.body)
  const { imageFile, type, tripId, userId, bucketName } = req.body.data; // Changed imageFilePath to imageFile
  //const userId = req.user.uid; // Assuming user ID is available in the request context
  
  // Print the values for debugging
  console.log('imageFile:', imageFile); // Updated log statement
  console.log('tripId:', tripId);
  console.log('userId:', userId);
  console.log('bucketName:', bucketName);
  
  if (!userId || !imageFile || !tripId || !type || !bucketName) {
    console.log('Missing required parameter');
    return res.status(400).send('Missing required parameter');
  }

  const fileName = `${Date.now()}.jpg`;
  let storagePath;

  if (tripId && type !== 'trip-cover') {
    // For trip-related images
    storagePath = `user_uploads/${userId}/trips/${tripId}/${type}/${fileName}`;
  } else {
    // For trip cover uploads
    storagePath = `user_uploads/${userId}/${type}/trip_cover.jpg`;
  }
  // Print the storagePath for debugging
  console.log('Storage Path:', storagePath);
  
  try {
    const buffer = Buffer.from(imageFile, 'base64'); // Decode base64 string to buffer
    await storage.bucket(bucketName).file(storagePath).save(buffer, { contentType: 'image/jpeg' }); // Save buffer to storage
    
    const fileRef = storage.bucket(bucketName).file(storagePath);
    const downloadURL= await getDownloadURL(fileRef);
    console.log('Returning DownloadUrl:', downloadURL);
    return res.status(200).send({
        status: "success",
        data: downloadURL
      });
    
  } catch (error) {
    console.error('Error uploading image:', error);
    return res.status(500).send('Error uploading image');
  }
});