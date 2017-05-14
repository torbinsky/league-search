import Browser from './browser'

var browser = new Browser('');

// Wait a few seconds and then "display" the browser's series
setTimeout(() => {
    for(let s of browser.series){
        console.log(s);
    }
}, 3000);