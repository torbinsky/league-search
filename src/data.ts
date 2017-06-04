export enum SearchType {
    TEAM,
    KEYWORDS
}

export interface MatchMeta {
    team1: string;
    team2: string;
    description: string;
}

export interface MatchThumbnail {
    url: string;
    width: number;
    height: number;
}
 
export class Match implements MatchMeta {
    team1: string;
    team2: string;
    description: string;
    gameCount: number;
    matchVideoIds: string[];
    matchDate: string;
    thumbnail: MatchThumbnail;
    
    get meta(): MatchMeta {
        return {
            team1: this.team1,
            team2: this.team2,
            description: this.description
        };
    };

    set meta(meta: MatchMeta) {
        this.team1 = meta.team1;
        this.team2 = meta.team2;
        this.description = meta.description;
    }
}