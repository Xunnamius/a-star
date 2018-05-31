~function()
{
    /***CONSTANTS***/
    var VERBOSE = true;

    Array.implement({
        compare: function(b, strict)
        {
            if(!b || this.length != b.length)
                return false;

            for(var i=this.length; i--;)
            {
                if(typeOf(this[i]) == 'array') this[i].compare(b[i])
                else if(this[i] != b[i] || (strict && this[i] !== b[i])) return false;
            }

            return true;
        }
    });

    /***READOUT***/
    console.info('A* n-Slider Puzzle Solver');
    console.info('By Bernard Dickens III');
    console.info('http://ergodark.com\n\n');
    console.info('CONSTANTS:');
    console.info('VERBOSE=' + VERBOSE);
    console.info('\n');
    console.info('H is calculated using a Manhattan Distance-based heuristic, counting how far each node'
        + ' is from the goal state, and choosing whichever configuration has the lowest score of node'
        + ' displacement.');
    console.info('TODO: Instead of using the Manhattan distance, we should use the Disjoint Pattern'
        + ' Database heuristic (4x4 puzzle).');
    console.info('TODO: Instead of using a simple A* search algorithm, we should use the more memory'
        + ' efficient Iterative Depth-first A* variant.');
    console.info('TODO: use timer-thread parallelization to make this even faster!');
    console.info('---------------------------');


    /***EVENTS***/
    window.addEvent('domready', function()
    {
        var graphicalBoard = new GraphicalBoard($('board'));

        graphicalBoard.build();
        
        $('scramble').addEvent('click', function(e)
        {
            graphicalBoard.setMode(GraphicalBoard.modes.HUMAN);
            graphicalBoard.shuffle();
            $('quick-solve').set('disabled', false);
            $('step-through').set('disabled', false);
        });

        // Cleans up any graphical mess we've left on the board
        var cleanTheBoard = function()
        {
            $$('.considering, .considering-provisional, .active, .backtracking')
                .removeClass('considering')
                .removeClass('considering-provisional')
                .removeClass('active')
                .removeClass('backtracking');
        }

        $('step-through').addEvent('click', function(e)
        {
            graphicalBoard.setMode(GraphicalBoard.modes.STEPTHROUGH);
            $('scramble').set('disabled', true);
            $('quick-solve').set('disabled', true);
            $('step-through').set('disabled', true);

            // Let's do this fast...
            //graphicalBoard.setOptions({ 'animationSpeed': 75 });

            // Set up Frontier (open list) and exploredStates (closed list)
            var seedNode       = new FrontierStateSnapshotNode(graphicalBoard.getState()),
                frontier       = new Frontier(seedNode),
                exploredStates = [seedNode.getStateId()],
                lcnode         = seedNode;

            // A graphical step-by-step implementation of A*
            var animatedSolve = function(fn)
            {
                if(!lcnode.getState().compare(graphicalBoard.options.goalState))
                {
                    // Remove the lowest-cost node from the frontier
                    frontier.removeNode(lcnode);

                    // Clean up any graphical artifacts we left behind from last time
                    cleanTheBoard();

                    // Calculate game mode snapshots of possible moves
                    var adjSnaps = AlgorithmicBoard.calculateAdjacentSnapshots(lcnode);

                    // Loop over said snapshots
                    adjSnaps.each(function(snap)
                    {
                        // Get the F/G/H metrics of this state
                        var cost = snap.getCost();

                        // Get an ID represeting the snapshot state array
                        var snapstateid = snap.getStateId();

                        // Get the actual graphical tile
                        var tileActual = graphicalBoard.numberToTile(snap.getSwappedTileNumber());
                        
                        // Make the tile light up with its metrics (graphically) to
                        // let the observer know we're considering this move
                        tileActual.addClass('considering-provisional').toClass().setPathCosts(cost.f, cost.g, cost.h);

                        // Add the snapshot to the frontier for further processing,
                        // ignoring the state if we've already explored it
                        if(!exploredStates.contains(snapstateid))
                        {
                            // Okay, we're actually considering this one
                            tileActual.addClass('considering').removeClass('considering-provisional');

                            // Add current state to explored states
                            exploredStates.push(snapstateid);

                            // Update frontier with snapshot
                            frontier.addNode(snap);
                        }
                    });
                
                    // Get the number of the tile that was swapped to get to this state
                    var currentStateLastSwapNumber = lcnode.getSwappedTileNumber(),
                        currentStatePathLength     = lcnode.getPath().length;

                    // Get the cheapest node in the frontier
                    // (remember above we remove nodes!)
                    lcnode = frontier.getLowestCostNode();

                    // Get the actual graphical tile that was swapped in the
                    // lcnode state
                    var lcnodeActual = graphicalBoard.numberToTile(lcnode.getSwappedTileNumber());

                    // Get the lcnode path
                    var lcnodePath = lcnode.getPath();

                    // If the cheapest node is NOT a direct descendent of the current
                    // working state, let's throw it in reverse and speed out of here!
                    
                    // Mark it as active
                    lcnodeActual.addClass('considering').addClass('active');

                    if(lcnodePath.length - currentStatePathLength != 1)
                    {
                        var board = graphicalBoard.getBoard();
                        board.addClass('backtracking');

                        (function()
                        {
                            graphicalBoard.setState(lcnode.getState());
                            board.removeClass('backtracking');
                            animatedSolve(fn);
                        }).delay(400);
                    }

                    // Otherwise, we'll just shift the tile manually via animation
                    else
                    {
                        // Do the swap
                        (function()
                        {
                            graphicalBoard.swapWithEmpty(lcnodeActual.toClass(), function()
                            {
                                animatedSolve(fn);
                            });
                        }).delay(300);
                    }
                }

                else fn(lcnode);
            };
            
            // *kungfu hands* Shall we begin?
            animatedSolve(function(goalSnap)
            {
                cleanTheBoard();
                graphicalBoard.resetAnimationSpeed();

                // Change everything to green and say some stuff
                
                console.warn(goalSnap.getPath().join('-'));
                $('scramble').set('disabled', false);
            });
        });

        $('quick-solve').addEvent('click', function(e)
        {
            // Let's do this quickly
            graphicalBoard.setMode(GraphicalBoard.modes.QUICKSOLVE);
            $('scramble').set('disabled', true);
            $('quick-solve').set('disabled', true).set('text', 'Solving...');
            $('step-through').set('disabled', true);

            (function()
            {
                // Set up Frontier (open list) and exploredStates (closed list)
                var seedNode       = new FrontierStateSnapshotNode(graphicalBoard.getState()),
                    frontier       = new Frontier(seedNode),
                    exploredStates = [seedNode.getStateId()],
                    lcnode         = seedNode;

                var step = 0;

                // *tkd hands* Shall we begin?
                var algorithmicSolve = function(fn)
                {
                    var path = lcnode.getPath();

                    if(++step % 1000 == 0)
                        console.info('Reached computational iteration', step,
                            '; current best path = ', path.join('-'), '(' + path.length + ')');

                    if(!lcnode.getState().compare(graphicalBoard.options.goalState))
                    {
                        // Remove the lowest-cost node from the frontier
                        frontier.removeNode(lcnode);

                        // Calculate game mode snapshots of possible moves
                        var adjSnaps = AlgorithmicBoard.calculateAdjacentSnapshots(lcnode);

                        // Loop over said snapshots
                        adjSnaps.each(function(snap)
                        {
                            // Get an ID represeting the snapshot state array
                            var snapstateid = snap.getStateId();

                            // Add the snapshot to the frontier for further processing,
                            // ignoring the state if we've already explored it
                            if(!exploredStates.contains(snapstateid))
                            {
                                // Add current state to explored states
                                exploredStates.push(snapstateid);

                                // Update frontier with snapshot
                                frontier.addNode(snap);
                            }
                        });

                        // Get the cheapest node in the frontier
                        // (remember above we remove nodes!)
                        lcnode = frontier.getLowestCostNode();

                        // And reiterate!
                        algorithmicSolve(fn);
                    }

                    // We're outta here!
                    else fn();
                };

                algorithmicSolve(function()
                {
                    var path = lcnode.getPath();

                    console.warn('Optimal path found:', path.join('-'));
                    console.warn('Estimated completion:', path.length, 'moves');
                    console.warn('Graphically solving...');

                    var swapper = function(pathIndex)
                    {
                        var tileActualNumber = path[pathIndex];

                        if(!tileActualNumber)
                            return;

                        graphicalBoard.swapWithEmpty(graphicalBoard.numberToTile(tileActualNumber).toClass(), function()
                        {
                            // Update board with goal state estimation (green tiles)
                            graphicalBoard.checkGoalState();

                            // And again...!
                            swapper(++pathIndex);
                        });
                    };

                    // Let's finish this.
                    swapper(0);
                    
                    $('scramble').set('disabled', false);
                    $('quick-solve').set('text', 'Quick Solve');
                });
            }).delay(10);
        });
    });
}();
