const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

//midware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qpvg1.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const verifyJWT = (req, res, next) =>{
    const authHeader = req.headers.authorization;
    if (!authHeader){
        return res.status(401).send({ message: "Unauthorized User " });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if(err){
            return res
              .status(403)
              .send({ message: "ForbiideenUser" });
        }
        req.decoded = decoded;
        console.log(decoded);
        next();
    });
}

async function run() {
    try {
        await client.connect();
        const serviceCollection = client.db("geniusCar").collection("service");
        const orderCollection = client.db("geniusCar").collection("order");


        //JWT
        app.post('/login', async (req,res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1d'
            });
            res.send({accessToken})
        })

        //Get Operation
        //load all data from db
        app.get('/services' , async (req,res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const result = await cursor.toArray();
            res.send(result)
        });
        
        //load dynamic data from  db
        app.get('/services/:id', async(req,res) => {
            const id = req.params.id;
            const query = {_id:ObjectId(id)};
            const service = await serviceCollection.findOne(query);
            res.send(service);
        })

        //Order Zone
        app.post('/order', async(req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        }); 
        app.get('/order', verifyJWT, async(req,res) => {
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            console.log(decodedEmail, email);
            if(email === decodedEmail){
                const query = {email};
                const cursor = orderCollection.find(query);
                const result = await cursor.toArray();
                res.send(result);
            } else {
                res.status(403).send({ message: "ForbiideenUser" });
            }
        })
    }
    finally{

    }
};
run().catch(console.dir)




app.get('/', (req,res) => {
    res.send("db worked");
})

app.listen(port, () => {
    console.log("listening from port" , port);
})