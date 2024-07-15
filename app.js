/*
 * Starter Project for WhatsApp Echo Bot Tutorial
 *
 * Remix this as the starting point for following the WhatsApp Echo Bot tutorial
 *
 */
const express = require('express');
const mysql = require('mysql2/promise'); 

const app = express();
const PORT = process.env.PORT ;

// Middleware to parse JSON request bodies
app.use(express.json());
"use strict";
require('dotenv').config();
// Access token for your app
// (copy token from DevX getting started page
// and save it as environment variable into the .env file)
const token = process.env.WHATSAPP_TOKEN;

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
};


// Create MySQL pool
const pool = mysql.createPool(dbConfig);

// Imports dependencies and set up http server
//const request = require("request"),
 // express = require("express"),
  //body_parser = require("body-parser"),
  //axios = require("axios").default,
 // app = express().use(body_parser.json()); // creates express http server

// Sets server port and logs message on success


// Accepts POST requests at /webhook endpoint
app.post('/webhook', async (req, res) => {
  try {
    // Extract relevant data from the request body
    console.log(req.body);
    const { entry } = req.body;
    const { from, name, text } = entry[0].changes[0].value.messages[0];
    console.log("ENTRYYYYY: ",entry);

    var sender_name = entry[0].changes[0].value.contacts[0].profile.name;
    var sender_phone = entry[0].changes[0].value.contacts[0].wa_id;
    var type = entry[0].changes[0].value.messages[0].type;
    var message = "" ;
    if(type == "button"){
      message = entry[0].changes[0].value.messages[0].button.text ;
    }else if(type == "text"){
      message = entry[0].changes[0].value.messages[0].text.body ;
    }
    console.log(message)
    // Insert data into RDS table
    await insertMessage(sender_phone, sender_name, message);

    // Respond with success
    res.status(200).json({ message: 'Data inserted successfully' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Function to insert data into RDS table
async function insertMessage(from, name, text) {
  try {
    // Get a connection from the pool
    const connection = await pool.getConnection();

    // SQL query to insert data into your table (replace with your table name and columns)
    const sql = 'INSERT INTO webhook_data (phone, name, message) VALUES (?, ?, ?)';
    const values = [from, name, text];

    // Execute the query
    await connection.query(sql, values);

    // Release the connection
    connection.release();
  } catch (error) {
    console.error('Error inserting data into RDS:', error);
    throw error; // Rethrow the error to handle it in the caller function
  }
}

// Accepts GET requests at the /webhook endpoint. You need this URL to setup webhook initially.
// info on verification request payload: https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests 
app.get("/webhook", (req, res) => {
  /**
   * UPDATE YOUR VERIFY TOKEN
   *This will be the Verify Token value when you set up webhook
  **/
  const verify_token = process.env.VERIFY_TOKEN;

  // Parse params from the webhook verification request
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === "subscribe" && token === verify_token) {
      // Respond with 200 OK and challenge token from the request
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

app.listen(PORT, () => console.log("webhook is listening ßon port:",PORT));
