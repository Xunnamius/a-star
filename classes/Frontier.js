~function()
{
    this.Frontier = new Class({
        // This class represents the frontier map or "open list" of
        // all known game states
        // Composes: FrontierStateSnapshotNode instances
        
        _nodes: [],

        initialize: function(seedNode)
        {
            this.addNode(seedNode);
        },

        addNode: function(node)
        {
            this._nodes.push(node);
        },

        removeNode: function(node)
        {
            this._nodes.erase(node);
        },

        getLowestCostNode: function()
        {
            if(!this._nodes.length)
                throw new Error('Frontier is somehow empty. Algorithm has experienced a fatal error.');

            var lowest = null;

            // Get all node costs and choose the lowest of the bunch
            this._nodes.each(function(node)
            {
                // Biased towards the latter path found in all cases
                // of equality
                if(lowest === null || node.getCost().f <= lowest.getCost().f)
                    lowest = node;
            });

            return lowest;
        }
    });
}();
