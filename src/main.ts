import Browser from './browser'

var browser = new Browser('API_KEY','UCQJT7rpynlR7SSdn3OyuI_Q');

// Wait a few seconds and then "display" the browser's series
setTimeout(() => {
    for(let s of browser.series){
        console.log(s);
    }
}, 3000);