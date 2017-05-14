import * as youtubeSearch from "youtube-search";
import * as _ from "lodash";
import {SeriesMeta, Series, SearchType} from "./data";

export default class LeagueSeriesBrowser {
    team: string = '';
    keywords: string = '';
    series: Series[] = [];

    private _apiKey: string;
    private _nextPage: string = '';
    private _prevPage: string = '';
    
    constructor(apiKey: string){
        this._apiKey = apiKey;
        this._getSeries(this._resultHandler());
    }

    hasNext() {
        return this._nextPage != null;
    }

    hasPrev() {
        return this._prevPage != null;
    }

    next() {
        if(this._nextPage){
            this._getSeries(this._resultHandler(), this._nextPage);
        }
    }

    prev() {
        if(this._prevPage){
            this._getSeries(this._resultHandler(), this._prevPage);
        }
    }

    _resultHandler(): (err: Error, series: Series[], pageInfo: youtubeSearch.YouTubeSearchPageResults) => void {
        var target = this;
        return function(err: Error, series: Series[], pageInfo: youtubeSearch.YouTubeSearchPageResults){
            if(err){
                console.log(err);
                return;
            }
            target.series = series;
            target._nextPage = pageInfo.nextPageToken;
            target._prevPage = pageInfo.prevPageToken
        }
    }

    _getSeries(cb: (err: Error, series: Series[], pageInfo: youtubeSearch.YouTubeSearchPageResults) => void, pageId?: string){
        var opts: youtubeSearch.YouTubeSearchOptions = {
            maxResults: 50,
            key: this._apiKey,
            channelId: "UCQJT7rpynlR7SSdn3OyuI_Q",
            order: "date",
            pageToken: pageId
        };

        // Build youtube title query
        var query: string = this.team + ' ' + this.keywords;

        // Run the youtube search and execute results
        youtubeSearch(query, opts, (err, results, pageInfo) => {
            if(err){
                cb(err,null,null);
            }else{
                cb(null, _parseSeries(results), pageInfo);
            }
        });
    }
}

function _getSeriesMetaFromTitle(title: string){
    var seriesRegex: RegExp = /^((\w+)\s*vs\s*(\w+)).*?-([\w\s-]+)-/;
    var match = title.match(seriesRegex);
    
    var meta: SeriesMeta = null;
    
    // If we match this regex, pull out the series meta data
    if(match && match.length >= 5){
        meta = {
            team1: match[2],
            team2: match[3],
            description: match[4].trim()
        };
    }
    
    return meta;
}

function _parseSeries(videos: youtubeSearch.YouTubeSearchResults[]){
    var results: Series[] = [];
    
    // processing variables
    var currentSeriesMeta: SeriesMeta, previousSeriesMeta: SeriesMeta, series: Series;
    
    // Iterate over each video and determine what series it belongs to
    for(let video of videos){
        currentSeriesMeta = _getSeriesMetaFromTitle(video.title);
        // skip videos we couldn't parse
        if(!currentSeriesMeta){
            continue;
        }
        
        // Check if parsed series is the same as the previous video's series
        if(!_.isEqual(currentSeriesMeta,previousSeriesMeta)){
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
    
    /*
    ** TW: Intentionally don't do the following, because it might add a partial series.
    **
    ** For example, imagine we paginate such that a 3 game series (game1, game2, game3)
    ** ends up page1: [game1, game2] page2: [game3]. This would result in the series being broken into 2 different series
    **

    // Add the last series we processed
    results.push(series); // <-- bad, will add a partial series
    */

    return results;
}