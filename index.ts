import * as youtubeSearch from "youtube-search";
import * as _ from "lodash";
 
var opts: youtubeSearch.YouTubeSearchOptions = {
  maxResults: 50,
  key: "API_KEY",
  channelId: "UCQJT7rpynlR7SSdn3OyuI_Q",
  order: "date"
};

interface SeriesMeta {
    team1: String;
    team2: String;
    description: String;
}
 
interface Series {
    meta: SeriesMeta;
    matchCount: number;
    matchVideoIds: String[];
    seriesDate: String;
}

function _getSeriesMetaFromTitle(title: String){
    var seriesRegex: RegExp = /^((\w+)\s*vs\s*(\w+)).*?-([\w\s]+)?-/;
    var match = title.match(seriesRegex);
    
    var meta: SeriesMeta = null;
    
    // If we match this regex, pull out the series meta data
    if(match && match.length >= 4){
        meta = {
            team1: match[1],
            team2: match[2],
            description: match[3]
        };
    }
    
    return meta;
}

function parseSeries(videos: youtubeSearch.YouTubeSearchResults[]){
    var results: Series[] = [];
    
    // processing variables
    var currentSeriesMeta: SeriesMeta, previousSeriesMeta: SeriesMeta, series: Series;
    
    // Iterate over each video and determine what series it belongs to
    for(let video of videos){
        currentSeriesMeta = _getSeriesMetaFromTitle(video.title);
        
        // Check if parsed series is the same as the previous video's series
        if(_.isEqual(currentSeriesMeta,previousSeriesMeta)){
            // If we already had a series, push that to results and start the next one
            if(series != null){
                results.push(series);
            }

            // Start new series
            series = {
                matchCount: 1,
                matchVideoIds: [video.id],
                seriesDate: video.publishedAt, // date of series is publish date of first game
                meta: currentSeriesMeta
            };
        }else{
            // Add to existing series
            series.matchCount++;
            series.matchVideoIds.push(video.id);
        }

        // remember which series name we had last so we can detect when we encounter a new series
        previousSeriesMeta = currentSeriesMeta;
    }
    
    // Add the last series we processed
    results.push(series);

    return results;
}

youtubeSearch("", opts, (err, results) => {
  if(err) return console.log(err);
  
  var series = parseSeries(results);

  for(let s of series){
      console.log(s);
  }
});