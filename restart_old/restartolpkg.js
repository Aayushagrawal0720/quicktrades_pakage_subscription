const pool = require('../databaseconf/psqlconf');
const {closeActivePackage} = require('../functions/schedulers/cronschedulers');

function startOldPackages(){
    console.log('----startOldPackages');
    getActivePendingQuery()
}


function getActivePendingQuery(){
    var query = `SELECT * FROM packagesubscription WHERE status = 'Active';`;
    pool.query(query).then((activePackages)=>{
        if(activePackages.rowCount>0){
            startCronSceheduler(activePackages.rows);
        }
    }).catch((exception)=>{
       console.log('-----getActivePendingQuery db exception-----');
       console.log(exception);
    });
}

function startCronSceheduler(allActivePackage){
    allActivePackage.forEach((activePackage)=>{
        var startTime = activePackage['startdate'];
        var endTime = activePackage['enddate'];

        var dateDiff = new Date(endTime) - new Date(startTime);
        createPkgTimeOut(dateDiff, activePackage);
    })
}


function createPkgTimeOut(mils, packageData){
    var maxDelay = Math.pow(2,31)-1;
    var rem=0;
    var delay;
    if(mils>maxDelay){
        delay=maxDelay;
        rem= mils-maxDelay;
    }else{
        delay= mils;
    }
    setTimeout(()=>{
        /*
            close this active package
            call a function that will check for any pending packagepurchase of same uid and aid
            call createCronScheduler() to active that purchased package
        */
        if(rem>0){
            createPkgTimeOut(rem, packageData);
        }else{
            closeActivePackage(packageData);
        }


    }, delay)
}


module.exports= {startOldPackages};
