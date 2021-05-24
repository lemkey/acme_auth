const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
app.use(express.json());
const { models: { User }} = require('./db');
const path = require('path');
const SECRET = process.env.JWT;

app.get('/', (req, res)=> res.sendFile(path.join(__dirname, 'index.html')));

app.post('/api/auth', async(req, res, next)=> {
  try {
    const { username, password } = req.body
    const user = await User.findOne({where: { username: username }})
    if (user && user.verifyPassword(password)){
      const token = await jwt.sign({ id: user.id}, SECRET)
      res.send({ token });
    }
    else {
      res.send(401).send("Incorrect Info")
    }
  }
  catch(ex){
    next(ex);
  }
});

app.get('/api/auth', async(req, res, next)=> {
  try {
    res.send(await User.byToken(req.headers.authorization));
  }
  catch(ex){
    next(ex);
  }
});

app.use((err, req, res, next)=> {
  console.log(err);
  res.status(err.status || 500).send({ error: err.message });
});

module.exports = app;