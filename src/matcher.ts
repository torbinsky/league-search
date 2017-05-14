export class SeriesMatcher {
    seriesRegex: RegExp = /^((\w+)\s*vs\s*(\w+)).*?-([\w\s-]+)-/;
    team1Idx: number = 2;
    team2Idx: number = 3;
    descriptionIdx: number = 4;

    lastIndex(){
        let lastIdx = 0;
        for(let i of [this.team1Idx, this.team2Idx, this.descriptionIdx]){
            if(i > lastIdx){
                lastIdx = i;
            }
        }

        return lastIdx;
    }
}