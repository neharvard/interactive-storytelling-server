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


// Endpoint to get a specific story
app.get('/story/:id', async (req, res) => {
    try {
        const storyId = req.params.id;
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

// Track user choices for popularity
app.post('/story/trackChoices', async (req, res) => {
    const { storyId, pathTitle } = req.body;

    try {
        await readerChoicesCollection.updateOne(
            { storyId: new ObjectId(storyId) },
            { $inc: { [`choices.${pathTitle}`]: 1 } },
            { upsert: true }
        );
        res.status(200).send('Choice recorded');
    } catch (error) {
        console.error('Error recording choice:', error);
        res.status(500).send('Error recording choice');
    }
});


console.log("Pinged your deployment. You successfully connected to MongoDB!");

app.get('/', (req, res) => {
    res.send('Story Telling Platform is Running')
})

app.listen(port, () => {
    console.log(`Story Telling is sitting on port ${port}`);
})