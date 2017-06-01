export enum SearchType {
    TEAM,
    KEYWORDS
}

export interface MatchMeta {
    team1: string;
    team2: string;
    description: string;
}
 
export interface Match {
    meta: MatchMeta;
    gameCount: number;
    matchVideoIds: string[];
    matchDate: string;
}