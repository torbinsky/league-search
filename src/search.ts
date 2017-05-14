import * as youtubeSearch from "youtube-search";
import * as _ from "lodash";
import {SeriesMeta, Series, SearchType} from "./data";
import {SeriesMatcher} from "./matcher";

export default class LeagueSeriesSearch {
    team: string = '';
    keywords: string = '';
    seriesMatcher: SeriesMatcher = null;
    channelId: string;

    private _apiKey: string;
    private _nextPage: string = '';
    private _prevPage: string = '';
    
    constructor(apiKey: string, channelId: string, matcher?: SeriesMatcher){
        this._apiKey = apiKey;
        this.channelId = channelId;
        if(!matcher){
            this.seriesMatcher = new SeriesMatcher();
        }
    }

    hasNext() {
        return this._nextPage != null;
    }

    hasPrev() {
        return this._prevPage != null;
    }

    load(cb: (err: Error, result?:Series[]) => void){
        this._getSeries(this._resultHandler(cb));
    }

    next(cb: (err: Error,result?:Series[]) => void) {
        if(this._nextPage){
            this._getSeries(this._resultHandler(cb), this._nextPage);
        }
    }

    prev(cb: (err: Error,result?:Series[]) => void) {
        if(this._prevPage){
            this._getSeries(this._resultHandler(cb), this._prevPage);
        }
    }

    _resultHandler(cb: (err: Error,result?:Series[]) => void): (err: Error, series: Series[], pageInfo: youtubeSearch.YouTubeSearchPageResults) => void {
        var target = this;
        return function(err: Error, series: Series[], pageInfo: youtubeSearch.YouTubeSearchPageResults){
            if(!err){
                target._nextPage = pageInfo.nextPageToken;
                target._prevPage = pageInfo.prevPageToken;
            }
            cb(err, series);
        }
    }

    _getSeries(cb: (err: Error, series: Series[], pageInfo: youtubeSearch.YouTubeSearchPageResults) => void, pageId?: string){
        var opts: youtubeSearch.YouTubeSearchOptions = {
            maxResults: 50,
            key: this._apiKey,
            channelId: this.channelId,
            order: 'date',
            pageToken: pageId
        };

        // Build youtube title query
        var query: string = this.team + ' ' + this.keywords;

        // Run the youtube search and execute results
        youtubeSearch(query, opts, (err, results, pageInfo) => {
            if(err){
                cb(err,null,null);
            }else{
                cb(null, this._parseSeries(results), pageInfo);
            }
        });
    }

    _getSeriesMetaFromTitle(title: string){
        var matcher = this.seriesMatcher;
        var match = title.match(matcher.seriesRegex);
        
        var meta: SeriesMeta = null;
        
        // If we match this regex, pull out the series meta data
        if(match && match.length >= matcher.lastIndex() - 1){
            meta = {
                team1: match[matcher.team1Idx],
                team2: match[matcher.team2Idx],
                description: match[matcher.descriptionIdx].trim()
            };
        }
        
        return meta;
    }

    _parseSeries(videos: youtubeSearch.YouTubeSearchResults[]){
        var results: Series[] = [];
        
        // processing variables
        var currentSeriesMeta: SeriesMeta, previousSeriesMeta: SeriesMeta, series: Series;
        
        // Iterate over each video and determine what series it belongs to
        for(let video of videos){
            currentSeriesMeta = this._getSeriesMetaFromTitle(video.title);
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
}