const express = require('express');
const { fetchClients,fetchClientRecords } = require('./handler');

const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');
app.use(cors());

app.get('/fetch-clients', async (req, res) => {
    try {
        const records = await fetchClients();
        res.json(records);
    } catch (error) {
        res.status(500).send(error);
    }
});
app.get('/fetch-details', async (req, res) => {
    try {
        const records = await fetchClientRecords(req.query.name);
        res.json(records);
    } catch (error) {
        res.status(500).send(error);
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});