export enum SearchType {
    TEAM,
    KEYWORDS
}

export interface SeriesMeta {
    team1: string;
    team2: string;
    description: string;
}
 
export interface Series {
    meta: SeriesMeta;
    matchCount: number;
    matchVideoIds: string[];
    seriesDate: string;
}