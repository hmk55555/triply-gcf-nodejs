/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onCall} = require("firebase-functions/v2/https");
// const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const {GoogleGenerativeAI} = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");
const axios = require("axios");
const sharp = require("sharp");
const fs = require("fs").promises;
require('dotenv').config();

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

exports.processImage = onCall(async (request, response) => {
  // Extract parameters from request body
const { imageUrl, imageType } = request.data;

logger.info("Inside onCall, imageUrl is " , imageUrl);
logger.info("Inside onCall, imageType is " , imageType);
console.log('Environment variables loaded:', process.env.GEMINI_API_KEY ? 'Yes' : 'No');

    const APIKEY = process.env.GEMINI_API_KEY;
    if (!APIKEY) {
      return {
        status: "error",
        message: "API key not configured"
      };
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(APIKEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-002" });

    const fileManager = new GoogleAIFileManager(APIKEY);
    // Download and process image
    response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const tempPath = "/tmp/temp_image.jpg";
    await sharp(response.data)
      .jpeg()
      .toFile(tempPath);

  const uploadResult = await fileManager.uploadFile(
  `${tempPath}`,
    {
      mimeType: "image/jpeg",
      displayName: "ticket",
    },
  );

  // View the response.
console.log(
  `Uploaded file ${uploadResult.file.displayName} as: ${uploadResult.file.uri}`,
);

    // Define the schema for travel items
    const travelItemSchema = {
      type: "object",
      properties: {
        type: { type: "string" },
        airline: { type: "string" },
        flightNumber: { type: "string" },
        departureAirport: { type: "string" },
        arrivalAirport: { type: "string" },
        departureTime: { type: "string" },
        arrivalTime: { type: "string" },
        duration: { type: "string" },
        aircraftType: { type: "string" },
        gate: { type: "string" },
        terminal: { type: "string" },
        seatAssignment: { type: "string" },
        baggageAllowance: { type: "string" },
        classOfService: { type: "string" },
        confirmationNumber: { type: "string" },
        price: { type: "number" },
        passengerNames: { type: "string" },
        status: { type: "string" }
      }
    };

    // Generate content using Gemini
    const prompt = "Extract JSON from image";
    const result = await model.generateContent([
      prompt,
      {
        fileData: {
          fileUri: uploadResult.file.uri,
          mimeType: uploadResult.file.mimeType,
        },
      },
    ]);
    console.log(result.response.text());

    response = await result.response;
    const resultJson = response.text();

    // Add these debug logs
    console.log('Raw response:', response);
    console.log('Result text:', resultJson);

    const cleanedText = resultJson
            .replace(/```json/g, '')     // Remove JSON markers
            .replace(/```/g, '')         // Remove code block markers
            .replace(/^>\s+/gm, '')      // Remove '>' and spaces at start of lines
            .trim();     

    // Validate the JSON format
    if (!JSON.parse(cleanedText)) {
      return {
        status: "error",
        message: "Invalid JSON"
      };
    }

    return {
      status: "success",
      data: JSON.parse(cleanedText)
    };
});
