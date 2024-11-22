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
const axios = require("axios");
const sharp = require("sharp");
const fs = require("fs").promises;

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

exports.processImage = onCall(async (request, response) => {
  // Extract parameters from request body
const { imageUrl, imageType } = request.data;

logger.info("Inside onCall, imageUrl is " , imageUrl);
logger.info("Inside onCall, imageType is " , imageType);

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

    // Download and process image
    response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const tempPath = "/tmp/temp_image.jpg";
    
    // Convert and save image using sharp
    await sharp(response.data)
      .jpeg()
      .toFile(tempPath);

    // Read the image file
    const imageBytes = await fs.readFile(tempPath);

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
    const result = await model.generateContent([imageBytes, "\n\n", prompt], {
      responseMimeType: "application/json",
      responseSchema: travelItemSchema
    });

    // Convert the result to a JSON string
    const resultJson = result.text;

    // Validate the JSON format
    if (!JSON.parse(resultJson)) {
      return {
        status: "error",
        message: "Invalid JSON"
      };
    }

    return {
      status: "success",
      data: {
        message: "Hello from Firebase!",
        timestamp: new Date().toISOString(),
        imageUrl: imageUrl || null,
        imageType: null
      }
    };
});
