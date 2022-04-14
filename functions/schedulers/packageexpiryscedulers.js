const cron = require('node-cron');
const pool = require('../../databaseconf/psqlconf');
const {createCronScheduler} = require('./cronschedulers');

function createScheduler(packageData){
    var uid = packageData['uid'];
    var aid = packageData['aid'];
    var id = packageData['id'];
    getExistingPackage(uid, aid, id, (exist)=>{
        if(!exist){
            createCronScheduler(packageData);
        }
    });
}

function getExistingPackage(uid, aid, id, cb){
    getExistingPackageQuery(uid, aid,  (err, existingPackageQuery, dataSet)=>{
        pool.query(existingPackageQuery, dataSet).then((existingResult)=>{
            var exist= false;
            if(existingResult.rows.length>0){
                var existingPackages= existingResult.rows;
                existingPackages.forEach((ePackage)=>{
                    var epid= ePackage['id'];
                    if(epid!==id){
                        exist=true;
                    }
                })
            }
            cb(exist)
        }).catch((exception)=>{
            console.log(exception);
            return;
        })
    })
}

function getExistingPackageQuery(uid, aid ,cb){
    var query =``;
    var queryData =[];
    if(uid && aid){
        query = query + `SELECT * FROM packagesubscription WHERE uid = $1 and aid = $2 AND status = 'Active';`;
        queryData.push(uid);
        queryData.push(aid);
    }else{
        cb('invalid data');
        return;
    }
    cb(undefined, query, queryData);
    return;
}



module.exports= {createScheduler}
