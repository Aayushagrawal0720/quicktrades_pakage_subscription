const router = require('express').Router();
const pool = require('../databaseconf/psqlconf');
const fs = require('fs');
const { getJSONResponse } = require('../functions/responsefunction');
const dbconstants = require('../constants/dbconstants');
const text = require('../constants/text');
const errorcodes = require('../constants/errorcodes');
const {createScheduler} = require('../functions/schedulers/packageexpiryscedulers');


router.post('/newpkgpur', (req, res)=>{
    try{
        var {id} = req.body;

        getNewPackageQuery(id, (err, newPackageQuery)=>{
           if(err) {
               if(err==='Inavlid id'){
                    res.send('Invalid id');
                    return;
                }
                else{
                    res.send('Invalid id');
                    return;
                }
           }else{
                pool.query(newPackageQuery, [id]).then((result)=>{
                    if(result.rows.length>0){
                        var packageData = result.rows[0];
                        createScheduler(packageData);

                    }
                }).catch((exception)=>{
                    console.log('------NEW PACKAGE QUERY EXCEPTION---------');
                    console.log(exception);
                    return;
                });
            }

        });
       res.send('hello');
       console.log('hello');
    }catch(err){
        console.log(err);
        res.send('some error');
    }
});

function getNewPackageQuery(id, cb){
    var query = ``;
    if(id){
        query = query +`SELECT * FROM packagesubscription WHERE id = $1`;
    }else{
        cb('Invalid id');
    }
    cb(undefined, query)
}

module.exports= router;
