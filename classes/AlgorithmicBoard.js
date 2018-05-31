~function()
{
    this.AlgorithmicBoard = new Class({
        // This class represents the game board (algorithmically)
        // Composes: SmartTile instances
    });

    this.AlgorithmicBoard.calculateAdjacentSnapshots = function(stateSnapshot)
    {
        var adjacentSnapshots = [],
            state = stateSnapshot.getState(),
            ei = state.indexOf(0),
            ex = ei % 3,
            ey = Math.floor(ei / 3);

        state.each(function(tile, tileIndex)
        {
            var x  = tileIndex % 3,
                y  = Math.floor(tileIndex / 3);

            if(Math.abs(ey - y) + Math.abs(ex - x) == 1)
            {
                var newstate = Array.clone(state);
                newstate[state.indexOf(0)] = tile;
                newstate[state.indexOf(tile)] = 0;

                var path = stateSnapshot.getPath();
                path.push(tile);

                adjacentSnapshots.push(new FrontierStateSnapshotNode(newstate, path));
            }
        });

        return adjacentSnapshots;
    };
}();
