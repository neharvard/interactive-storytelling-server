const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hotnctf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// Creating DB In MongoDB
const storyCollection = client.db('storyDB').collection('story');
const interactionCollection = client.db('storyDB').collection('interactions');
const readerChoicesCollection = client.db('storyDB').collection('readerChoices');

// Endpoint to create a story
app.post('/story', async (req, res) => {
    const storyData = req.body;
    const result = await storyCollection.insertOne(storyData);
    res.send(result);
});


// Endpoint to get all stories
app.get('/allStory', async (req, res) => {
    try {
        const stories = await storyCollection.find().toArray();
        res.send(stories);
    } catch (error) {
        console.error('Error fetching stories:', error);
        res.status(500).send('Error fetching stories');
    }
});


// Endpoint to get a specific story PREVIOUS
app.get('/story/:id', async (req, res) => {
    try {
        const storyId = req.params.id;

        // Validate the storyId to make sure it is a valid 24-character hex string
        if (!ObjectId.isValid(storyId)) {
            return res.status(400).json({ error: 'Invalid story ID' });
        }

        const story = await storyCollection.findOne({ _id: new ObjectId(storyId) });
        if (story) {
            res.json(story);
        } else {
            res.status(404).json({ error: 'Story not found' });
        }
    } catch (error) {
        console.error('Error fetching story:', error);
        res.status(500).json({ error: 'Error fetching story' });
    }
});

// Track interactions like which path was chosen and time spent on the path
app.post('/story/interaction', async (req, res) => {
    const { storyId, pathTitle, timeSpent } = req.body;

    // Validate the storyId to make sure it is a valid 24-character hex string
    if (!ObjectId.isValid(storyId)) {
        return res.status(400).json({ error: 'Invalid story ID' });
    }

    const interaction = {
        storyId: new ObjectId(storyId),
        pathTitle,
        timeSpent,
        timestamp: new Date(),
    };

    try {
        await interactionCollection.insertOne(interaction);
        res.status(200).send('Interaction recorded');
    } catch (error) {
        console.error('Error recording interaction:', error);
        res.status(500).send('Error recording interaction');
    }
});

app.get('/story/interaction', async (req, res) => {
    try {
        console.log('Incoming request to /story/interaction');
        const interactions = await interactionCollection.find().toArray();
        if (!interactions) {
            return res.status(400).json({ message: 'No interactions found' });
        }
        res.json(interactions);
    } catch (error) {
        console.error('Error fetching interaction data:', error);
        res.status(500).json({ message: 'Error fetching interaction data' });
    }
});


// app.get('/story/interaction', async (req, res) => {
//     try {
//         const interactions = await interactionCollection.find().toArray();
//         res.json(interactions);
//     } catch (error) {
//         console.error('Error fetching interaction data:', error);
//         res.status(500).json({ message: 'Error fetching interaction data' });
//     }
// });



// Track user choices for popularity
app.post('/story/trackChoices', async (req, res) => {
    const { storyId, pathTitle, userId } = req.body; // Make sure you send userId if necessary

    try {
        await readerChoicesCollection.updateOne(
            { storyId: new ObjectId(storyId), pathTitle },
            { 
                $inc: { count: 1 },
                $setOnInsert: { storyId: new ObjectId(storyId), pathTitle, userId }, // Optional: Track userId
            },
            { upsert: true } // Creates new entry if it doesn't exist
        );
        res.status(200).send('Choice recorded');
    } catch (error) {
        console.error('Error recording choice:', error);
        res.status(500).send('Error recording choice');
    }
});


// Endpoint to get path popularity for a specific story
app.get('/story/:id/popularity', async (req, res) => {
    try {
        const storyId = new ObjectId(req.params.id);
        const choices = await readerChoicesCollection.findOne({ storyId });
        res.json(choices);
    } catch (error) {
        console.error('Error fetching popularity data:', error);
        res.status(500).send('Error fetching popularity data');
    }
});

// Endpoint to get time spent insights
app.get('/story/:id/timeSpent', async (req, res) => {
    const storyId = req.params.id;

    // Validate if the provided storyId is a valid ObjectId
    if (!ObjectId.isValid(storyId)) {
        return res.status(400).json({ error: 'Invalid story ID format' });
    }

    try {
        const timeSpentData = await interactionCollection.aggregate([
            { $match: { storyId: new ObjectId(storyId) } },
            {
                $group: {
                    _id: "$pathTitle",
                    averageTimeSpent: { $avg: "$timeSpent" },
                    totalTimeSpent: { $sum: "$timeSpent" }
                }
            }
        ]).toArray();

        res.json(timeSpentData);
    } catch (error) {
        console.error('Error fetching time spent data:', error);
        res.status(500).json({ error: 'Error fetching time spent insights' });
    }
});

console.log("Pinged your deployment. You successfully connected to MongoDB!");

app.get('/', (req, res) => {
    res.send('Story Telling Platform is Running')
})

app.listen(port, () => {
    console.log(`Story Telling is sitting on port ${port}`);
})