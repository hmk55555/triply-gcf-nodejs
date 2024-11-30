/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const processImage = require('./processImage');
const uploadImage = require('./uploadImage');
exports.processImage = processImage.processImage;
exports.uploadImage = uploadImage.uploadImage;

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started


