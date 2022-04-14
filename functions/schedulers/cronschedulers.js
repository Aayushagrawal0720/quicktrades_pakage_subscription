const pool = require('../../databaseconf/psqlconf');

function createCronScheduler(packageData){
    var purchasedate = packageData['purchasedate'];
    var pid = packageData['pid'];
    var id = packageData['id'];
    getActualPackageDate(pid, (err, result)=>{
        if(err){
            return;
        }else{
            var duration = result['duration'];
            if(duration !== 'One call'){
                getDateData(duration, purchasedate, (err, mils, endDate)=>{
                    getPackageActiveQuery(id, endDate, (aQuery, aQueryData)=>{
                       pool.query(aQuery, aQueryData).then((result)=>{
                            createPkgTimeOut(mils, packageData);
                        }).catch((exception)=>{
                            console.log('getPackageActiveQuery: createCronScheduler exception');
                            console.log(exception);
                            return;
                        })
                    });
                });
            }
        }
    });


}

function getActualPackageDate(pid, cb){
    pool.query('SELECT * FROM packages WHERE pid = $1;',[pid]).then((result)=>{
        if(result.rows.length>0){
            var pkg = result.rows[0];
            cb(undefined, pkg);
        }else{
            console.log('no package found on packages from pid : ' + pid + ' while getActualPackageData')
            cb('no package');
        }
    }).catch((exception)=>{
        console.log('Exception while getActualPackageDate')
        console.log(exception);
        cb(exception);
    });
}


function getDateData(duration,purchasedate ,cb){
    try{

        var oneDay = 86400000;
        var mils=0;
        var days=1;

        switch(duration){
            case 'One day' :
            {
                mils=oneDay
                days =1;
                break;
            }
            case 'One week':
            {
                mils=oneDay*7;
                days =7;
                break;
            }
            case 'One month':
            {
                mils=oneDay*30
                days =30;
                break;
            }
            case 'Three months':
            {
                mils=oneDay*90
                days =90;
                break;
            }
            case 'Six months':
            {
                mils=oneDay*180
                days =180;
                break;
            }
            case 'One year':
            {
                mils=oneDay*365
                days =365;
                break;
            }

        }

        var finalPurchaseDate= new Date(purchasedate);
        var endDate = addDays(purchasedate, mils);
        cb(undefined,mils, endDate);

    }catch(err){
        console.log('getDateData err');
        console.log(err)
        cb(err)
    }
}

function addDays(date, days) {
  var result = new Date(date);
  result.setMilliseconds(result.getMilliseconds() + days);
  return result;
}


function getPackageActiveQuery(id, endDate, cb){
    var queryData=[];
    var query=`UPDATE packagesubscription set startdate = Now(), enddate = $1, status = 'Active' where id = $2; `;
    queryData.push(endDate);
    queryData.push(id);
    cb(query, queryData);

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

function closeActivePackage(packageData){
    var id = packageData['id'];
    var query = `UPDATE packagesubscription set status = 'Closed' where id = $1`;
    pool.query(query, [id]).then((result)=>{
        checkForNewPackage(packageData['uid'], packageData['aid']);
    }).catch((exception)=>{
        console.log('closeActivePackage exception');
        console.log(exception);
    })
}

function checkForNewPackage(uid, aid){
    var query =`SELECT * FROM packagesubscription where uid = $1 and aid = $2 and status = 'Pending';`;
    pool.query(query, [uid, aid]).then((result)=>{
        if(result.rows.length>0){
            var newPackageData= result.rows[0];
            createCronScheduler(newPackageData);
        }
        return;
    }).catch((exception)=>{
        console.log('checkForNewPackage exception');
        console.log(exception);
    })
}



module.exports ={createCronScheduler, closeActivePackage};
