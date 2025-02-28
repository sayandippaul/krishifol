// server.js
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(cors());
const port = 3000;

app.use(bodyParser.json());

const blockchain = [];
const PINATA_API_KEY = 'b36ec7b77eef3f9b579e';
const PINATA_SECRET_API_KEY = 'a6801139ac75310e33d6fcc77eaa8fbccc060c365c5fac39c3fd774cdb640fed';

// Create a new block
function createBlock(data) {
    const block = {
        index: blockchain.length + 1,
        timestamp: Date.now(),
        data,
        previousHash: blockchain.length ? blockchain[blockchain.length - 1].hash : '',
        hash: crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex')
    };
    blockchain.push(block);
    return block;
}

// Upload data to IPFS via Pinata
async function uploadToPinata(name) {
    name =name+"seller :- "+" satima markets "+" address :- "+" sabitamore 42/4 "+" phone:- "+" 9876543210";
    const response = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        name
    },{
        headers: {
            'pinata_api_key': PINATA_API_KEY,
            'pinata_secret_api_key': PINATA_SECRET_API_KEY,
            'Content-Type': 'application/json'
        }
    });
    return response.data.IpfsHash;
}

// Save name and send to recipient
app.post('/save-name', async (req, res) => {
    const { name, recipient } = req.body;
    if (!name || !recipient) return res.status(400).send('Name and recipient are required!');

    try {
        const ipfsHash = await uploadToPinata(name);
        const block = createBlock({ ipfsHash, recipient });
        res.json({ message: 'Name saved!', block });
    } catch (error) {
        console.error('Error saving name:', error);
        res.status(500).send('Failed to save name');
    }
});

// Retrieve name by address
app.get('/get-name/:address', async (req, res) => {
    const { address } = req.params;
    const record = blockchain.find(block => block.data.recipient === address);

    if (record) {
        const ipfsHash = record.data.ipfsHash;
        const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
        res.json({ name: response.data.name });
    } else {
        res.json({ message: 'No name found for this address' });
    }
});
app.get('/', (req, res) => {
    // res.render("hi");
});
app.get('/get-all-data', async (req, res) => {
    const data = await Promise.all(blockchain.map(async (block) => {
        const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${block.data.ipfsHash}`);
        return {
            name: response.data.name,
            hash: block.data.ipfsHash,
            recipient: block.data.recipient
        };
    }));
    res.json(data);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});