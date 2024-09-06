const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Story Telling Platform is Running')
})

app.listen(port, () => {
    console.log(`Story Telling is sitting on port ${port}`);
})