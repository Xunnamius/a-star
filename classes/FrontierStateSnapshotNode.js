~function()
{
    this.FrontierStateSnapshotNode = new Class({
        // This class represents a snapshot of a game state in time,
        // along with the path we too to get there
        
        _state: null,

        // Too computationally intensive to store path as a tree
        // Why waste the space? Why not just store path as an array
        // of int-ish things? That's what we'll do.
        _path: null,
        _pathcost: -1,

        initialize: function(state, path)
        {
            this._state = state;
            this._path  = path || [];
        },

        getCost: function()
        {
            // Path cost is not cached, calculate!
            if(this._pathcost == -1)
            {
                var H = 0,
                    G = this._path.length;

                // Heuristic: dist of all tiles from GOALSTATE
                // TODO: actually take goalstate into account here instead of assuming
                // TODO: strategy pattern? Or is that overkill?
                this._state.each(function(nodeIndex, index)
                {
                    H += Math.abs(index - nodeIndex);
                });

                // F = G + H
                this._pathcost = {
                    f: G + H,
                    g: G,
                    h: H
                };
            }

            return this._pathcost;
        },

        getState: function()
        {
            return Array.clone(this._state);
        },

        getStateId: function()
        {
            return this._state.join('-');
        },

        getPath: function()
        {
            return Array.clone(this._path);
        },

        getSwappedTileNumber: function()
        {
            return this._path.getLast();
        }
    });
}();
