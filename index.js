const express = require('express');
const app = express();
const pool = require('./databaseconf/psqlconf');

const newpurchase= require('./newpkgpurchase/newpkgpurchase');
const {startOldPackages} = require('./restart_old/restartolpkg');

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', parameterLimit: 50000, extended: true }));

app.use(newpurchase);


app.listen(3002, ()=>{
    console.log('3002')
    startOldPackages();
})
