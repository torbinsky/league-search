import * as youtubeSearch from "youtube-search";
 
var opts: youtubeSearch.YouTubeSearchOptions = {
  maxResults: 50,
  key: "API_KEY",
  channelId: "UCQJT7rpynlR7SSdn3OyuI_Q",
  order: "date"
};
 
interface Series {
    matchCount: number;
    matchVideoIds: String[];
    seriesName: String;
    seriesDate: String;
}

function _getSeriesNameFromTitle(title: String){
    var matchupNameRegex: RegExp = /^((\w+)\s*vs\s*(\w+)).*?-([\w\s]+)?-/;
    return title.match(matchupNameRegex)[0];
}

function parseSeries(videos: youtubeSearch.YouTubeSearchResults[]){
    var results: Series[] = [];

    var currentSeriesName: String, previousSeriesName: String, series: Series;
    for(let video of videos){
        currentSeriesName = _getSeriesNameFromTitle(video.title);
        
        // Check if new series
        if(currentSeriesName != previousSeriesName){
            // If we already had a series, push that to results and start the next one
            if(series != null){
                results.push(series);
            }

            // Start new series
            series = {
                matchCount: 1,
                matchVideoIds: [video.id],
                seriesDate: video.publishedAt, // date of series is publish date of first game
                seriesName: currentSeriesName
            };
        }else{
            // Add to existing series
            series.matchCount++;
            series.matchVideoIds.push(video.id);
        }

        // remember which series name we had last so we can detect when we encounter a new series
        previousSeriesName = currentSeriesName;
    }

    return results;
}

youtubeSearch("TSM", opts, (err, results) => {
  if(err) return console.log(err);
  
  var matches = parseSeries(results);

  for(let match of matches){
      console.log(match);
  }
});