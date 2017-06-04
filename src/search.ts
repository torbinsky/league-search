import * as youtubeSearch from "youtube-search";
import * as _ from "lodash";
import {Match, SearchType, MatchMeta} from "./data";
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

    _generateQuery(team: string, keywords: string){
        let query = ' ';
        if(team){
            query = team + query;
        }
        if(keywords){
            query = query + keywords;
        }

        return query;
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
        let query = this._generateQuery(this.team, this.keywords);

        // Run the youtube search and execute results
        youtubeSearch(query, opts, (err, results, pageInfo) => {
            if(err){
                cb(err,null,null);
            }else{
                cb(null, this._parseMatch(results), pageInfo);
            }
        });
    }

    _getMatchMetaFromTitle(title: string): MatchMeta {
        var matcher = this.matchMatcher;
        var match = title.match(matcher.matchRegex);
        var meta = null;
        
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
        let results: Match[] = [];
        
        // processing variables
        let previousMatch: Match, match: Match;
        
        // Iterate over each video and determine what match it belongs to
        for(let video of videos){
            var matchMeta = this._getMatchMetaFromTitle(video.title);
            // skip videos we couldn't parse
            if(!matchMeta){
                continue;
            }
            
            // Check if parsed match is the same as the previous video's match
            if(!previousMatch || !_.isEqual(matchMeta,previousMatch.meta)){
                // If we already had a match, push that to results and start the next one
                if(match != null){
                    results.push(match);
                }

                // Start new match
                match = new Match();
                match.gameCount = 1; // we have 1 video so far
                match.matchVideoIds = [video.id]; // initialize with first video
                match.matchDate = video.publishedAt; // date of match is publish date of first game
                match.thumbnail = video.thumbnails.default; // use the first video's thumbnail as the match thumbnail
                match.meta = matchMeta;
            }else{
                // Add to existing match
                match.gameCount++;
                match.matchVideoIds.push(video.id);
            }

            // remember which match name we had last so we can detect when we encounter a new match
            previousMatch = match;
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