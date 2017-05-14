import Browser from './search'

var search = new Browser('API_KEY','UCQJT7rpynlR7SSdn3OyuI_Q');
search.load((err, results) => {
    if(err){
        console.log(err);
    }else{
        for(let r of results){
            console.log(r);
        }
    }
});

// Wait a few seconds and then "display" the browser's series
setTimeout(() => {
    // noop
}, 3000);