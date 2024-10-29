require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const Journals = require("./models/journalModels");
const cors = require("cors");
const cloudinary = require("cloudinary").v2;
const multer = require("multer"); // Import multer for file handling

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up storage with multer for handling file uploads
const storage = multer.memoryStorage(); // Use memory storage for uploading files
const upload = multer({ storage: storage });

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.send("hello");
});

app.patch("/journalEntries/:id/like", async (req, res) => {
    try {
      const { id } = req.params;
  
      // Find the journal entry and increment the Likes field
      const journal = await Journals.findByIdAndUpdate(
        id,
        { $inc: { Likes: 1 } }, // Increment the Likes field by 1
        { new: true } // Return the updated document
      );
    
      if (!journal) {
        return res.status(404).json({ message: `Cannot find journal with id ${id}` });
      }
  
      res.status(200).json(journal);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

// POST /journalEntries to upload a journal entry with a photo
app.post("/journalEntries", upload.single("Photo"), async (req, res) => {
    try {
        // Ensure a file is uploaded
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded." });
        }

        // Create a readable stream from the file buffer
        const stream = cloudinary.uploader.upload_stream(
            { resource_type: "auto" }, // Automatically detect file type
            async (error, result) => {
                if (error) {
                    return res.status(500).json({ message: error.message });
                }

                // Create a new journal entry using Cloudinary's secure URL
                const journalEntry = {
                    Title: req.body.Title,
                    Description: req.body.Description,
                    Photo: result.secure_url, // Secure URL from Cloudinary
                };

                try {
                    // Save the new journal entry to MongoDB
                    const journal = await Journals.create(journalEntry);
                    res.status(201).json(journal);
                } catch (err) {
                    res.status(500).json({ message: err.message });
                }
            }
        );

        // Pass the file buffer to the upload stream
        stream.end(req.file.buffer);

    } catch (error) {
        console.error("Error uploading to Cloudinary:", error.message);
        res.status(500).json({ message: error.message });
    }
});
  

// GET /journalEntries to retrieve all journal entries
app.get("/journalEntries", async (req, res) => {
  try {
    const journals = await Journals.find({});
    res.status(200).json(journals);
  } catch (error) {
    console.error("Error fetching journal entries:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// DELETE /journalEntries/:id to delete a specific journal entry
app.delete("/journalEntries/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const journal = await Journals.findByIdAndDelete(id);
    if (!journal) {
      return res.status(404).json({ message: `Cannot find journal with id ${id}` });
    }
    console.log("Journal entry deleted:", journal);
    res.status(200).json(journal);
  } catch (error) {
    console.error("Error deleting journal entry:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// Connect to MongoDB and start the server
mongoose
  .connect(process.env.DATABASE_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(3000, () => {
      console.log("Node API App is running on port 3000");
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });
