import * as youtubeSearch from "youtube-search";
import * as _ from "lodash";
import {MatchMeta, Match, SearchType} from "./data";
import {MatchParser} from "./parser";

export class LeagueSearch {
    team: string = '';
    keywords: string = '';
    matchMatcher: MatchParser = null;
    channelId: string;

    private _apiKey: string;
    private _nextPage: string = '';
    private _prevPage: string = '';
    
    constructor(apiKey: string, channelId: string, parser?: MatchParser){
        this._apiKey = apiKey;
        this.channelId = channelId;
        if(!parser){
            this.matchMatcher = new MatchParser();
        }
    }

    hasNext() {
        return this._nextPage != null;
    }

    hasPrev() {
        return this._prevPage != null;
    }

    load(cb: (err: Error, result?:Match[]) => void){
        this._searchMatches(this._resultHandler(cb));
    }

    next(cb: (err: Error,result?:Match[]) => void) {
        if(this._nextPage){
            this._searchMatches(this._resultHandler(cb), this._nextPage);
        }
    }

    prev(cb: (err: Error,result?:Match[]) => void) {
        if(this._prevPage){
            this._searchMatches(this._resultHandler(cb), this._prevPage);
        }
    }

    _resultHandler(cb: (err: Error,result?:Match[]) => void): (err: Error, match: Match[], pageInfo: youtubeSearch.YouTubeSearchPageResults) => void {
        var target = this;
        return function(err: Error, match: Match[], pageInfo: youtubeSearch.YouTubeSearchPageResults){
            if(!err){
                target._nextPage = pageInfo.nextPageToken;
                target._prevPage = pageInfo.prevPageToken;
            }
            cb(err, match);
        }
    }

    _searchMatches(cb: (err: Error, match: Match[], pageInfo: youtubeSearch.YouTubeSearchPageResults) => void, pageId?: string){
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
                cb(null, this._parseMatch(results), pageInfo);
            }
        });
    }

    _getMatchMetaFromTitle(title: string){
        var matcher = this.matchMatcher;
        var match = title.match(matcher.matchRegex);
        
        var meta: MatchMeta = null;
        
        // If we match this regex, pull out the match meta data
        if(match && match.length >= matcher.lastIndex() - 1){
            meta = {
                team1: match[matcher.team1Idx],
                team2: match[matcher.team2Idx],
                description: match[matcher.descriptionIdx].trim()
            };
        }
        
        return meta;
    }

    _parseMatch(videos: youtubeSearch.YouTubeSearchResults[]){
        var results: Match[] = [];
        
        // processing variables
        var currentMatchMeta: MatchMeta, previousMatchMeta: MatchMeta, match: Match;
        
        // Iterate over each video and determine what match it belongs to
        for(let video of videos){
            currentMatchMeta = this._getMatchMetaFromTitle(video.title);
            // skip videos we couldn't parse
            if(!currentMatchMeta){
                continue;
            }
            
            // Check if parsed match is the same as the previous video's match
            if(!_.isEqual(currentMatchMeta,previousMatchMeta)){
                // If we already had a match, push that to results and start the next one
                if(match != null){
                    results.push(match);
                }

                // Start new match
                match = {
                    gameCount: 1,
                    matchVideoIds: [video.id],
                    matchDate: video.publishedAt, // date of match is publish date of first game
                    meta: currentMatchMeta
                };
            }else{
                // Add to existing match
                match.gameCount++;
                match.matchVideoIds.push(video.id);
            }

            // remember which match name we had last so we can detect when we encounter a new match
            previousMatchMeta = currentMatchMeta;
        }
        
        /*
        ** TW: Intentionally don't do the following, because it might add a partial match.
        **
        ** For example, imagine we paginate such that a 3 game match (game1, game2, game3)
        ** ends up page1: [game1, game2] page2: [game3]. This would result in the match being broken into 2 different match
        **

        // Add the last match we processed
        results.push(match); // <-- bad, will add a partial match
        */

        return results;
    }
}