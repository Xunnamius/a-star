~function()
{
    var modes = {
        HUMAN: 0,
        QUICKSOLVE: 1,
        STEPTHROUGH: 2
    };


    // TODO: decouple this class from the JavaScript console
    this.GraphicalBoard = new Class({
        // This class represents the visual graphical game board
        // Composes: SmartTile instances

        Implements: Options,
        options: {
            cssclass: 'tile',
            emptyclass: 'empty',
            tileCount: 9,
            goalState: [0, 1, 2, 3, 4, 5, 6, 7, 8],
            resetStyles: { top: 0, left: 0 },
            defaultAnimationSpeed: 200, //milliseconds
        },
        
        _board: null,
        _emptyTile: null,
        _movecount: 0,
        _mode: modes.HUMAN,
        _busy: false,

        initialize: function(boardContainer, options)
        {
            this.setOptions(options);
            this.resetAnimationSpeed();

            this._board = boardContainer;

            // Listen for clicks on the game board using event delegation
            this._board.addEvent('click:relay(.{0})'.substitute([this.options.cssclass]), function(e, el)
            {
                e.stop();
                el = el.toClass();

                // No human interaction if the AI is solving!
                if(this.getMode() != modes.HUMAN || this._board.hasClass('busy'))
                    return;

                // User is trying to make a move
                var emptyXY  = this._emptyTile.getXY(),
                    elXY     = el.getXY(),
                    dist     = Math.abs((emptyXY.y - elXY.y)) + Math.abs((emptyXY.x - elXY.x));

                // If legal, make the (animated) move and check goal state
                if(dist == 1)
                {
                    var totalGoalState;

                    this._board.addClass('busy');

                    this.swapWithEmpty(el, function()
                    {
                        console.log('Move ' + (++this._movecount)
                                + ': ' + el.getNumber()
                                + (el.isInGoalState() ? '*' : ''));

                        // Check for goal state(s)
                        totalGoalState = this.checkGoalState();
                        
                        if(totalGoalState)
                        {
                            $('solve').set('disabled', true);
                            console.log('Game completed in ' + this._movecount + ' moves (average is 25).'
                                + ' Winning piece was #' + el.getNumber());
                            this._movecount = 0;
                        }

                        else
                            this._board.removeClass('busy');
                    }.bind(this));
                }
            }.bind(this));
        },

        // TODO: take this.options.tileCount constant into account in build process
        // so that boards can be of any this.options.tileCount designation
        build: function(customSeed)
        {
            var seed = customSeed || this.getGoalState(),
                anteseed = [];

            this._board.grab(new Element('div#overlay', { text: 'BACKTRACKING...' }));

            for(var i=0, j=this.options.tileCount; i < j; ++i)
            {
                var num = customSeed ? seed[0] : seed.getRandom();

                seed.erase(num);
                anteseed.push(num);

                var empty = !num,
                    el = new SmartTile({
                        number: num,
                        cssclass: this.options.cssclass,
                        emptyclass: this.options.emptyclass
                    });

                this._board.grab(el);

                if(empty)
                    this._emptyTile = el;
            }

            if(this.checkGoalState())
            {
                console.warn('Bad board, regenerating...');
                this.shuffle();
            }

            if(!customSeed)
                console.warn('New board configuration (0 is "empty"): [{0}]'.substitute([anteseed.join('-')]));

            return this;
        },

        // Returns a state array in the same format as AlgorithmicBoard
        getState: function()
        {
            var state = [];

            this._board.getChildren('.' + this.options.cssclass).each(function(tile)
            {
                state.push(tile.toClass().getNumber());
            });

            return state;
        },

        setState: function(state)
        {
            this._board.addClass('busy');
            this._board.empty();
            this.build(state);
            this._board.removeClass('busy');

            return this;
        },

        getGoalState: function()
        {
            return Array.clone(this.options.goalState);
        },

        swapWithEmpty: function(smartTile, fn)
        {
            if(!(smartTile instanceof SmartTile))
                throw new TypeError('A swap can only be performed on an instance of the SmartTile class');

            // Animate the element in question and then swap it with
            // the empty tile element
            
            var tileEl  = smartTile.toElement(),
                emptyEl = this._emptyTile.toElement(),
                parent = tileEl.getParent(),
                offset  = tileEl.getPosition(emptyEl),
                tINextSib = smartTile.getIndex() < this.options.tileCount-1,
                prevStyle = tileEl.getParent().getStyle('position'),
                tileElSibling;

            tileEl.getParent().setStyle('position', 'relative');
            tileEl.setStyles({
                position: 'relative',
                top: 0,
                left: 0,
            });

            var fx = new Fx.Morph(tileEl, {
                duration: this.options.animationSpeed,
                transition: Fx.Transitions.Sine.easeOut
            });

            fx.start({
                top: -1 * (offset.y + 1),
                left: -1 * (offset.x + 1)
            }).chain(function()
            {
                tileElSibling = tINextSib ? tileEl.getNext() : tileEl.getPrevious()
                 
                if(tileElSibling === emptyEl)
                    tileElSibling = tileEl;

                tileEl.setStyles(this.options.resetStyles).inject(this._emptyTile, 'before');
                emptyEl.inject(tileElSibling, tINextSib ? 'before' : 'after');
                tileEl.getParent().setStyle('position', prevStyle);

                if(fn) fn();
            }.bind(this));

            return this;
        },

        checkGoalState: function()
        {
            if(!this._board.getChildren('.' + this.options.cssclass).length)
                return false;

            var totalGoalState = true;

            this._board.getChildren('.' + this.options.cssclass).each(function(tile)
            {
                if(tile.toClass().isInGoalState())
                {
                    if(!tile.hasClass('goalState'))
                        tile.addClass('goalState');
                }

                else
                {
                    tile.removeClass('goalState');
                    totalGoalState = false;
                }
            });

            return totalGoalState;
        },

        getMoveCount: function()
        {
            return this.movecount;
        },

        getMode: function()
        {
            return this._mode;
        },

        setMode: function(mode)
        {
            this._mode = mode;
            return this;
        },

        getBoard: function()
        {
            return this._board;
        },

        resetAnimationSpeed: function()
        {
            this.setOptions({ 'animationSpeed': this.options.defaultAnimationSpeed });
            return this;
        },

        shuffle: function()
        {
            this._board.addClass('busy');
            this._board.empty();
            this.build();
            this._board.removeClass('busy');

            return this;
        },

        numberToTile: function(number)
        {
            var tile = null;

            this._board.getChildren('.tile').every(function(tileEl)
            {
                var num = parseInt(tileEl.getElement('.content').get('text'));

                if(num == number)
                {
                    tile = tileEl;
                    return false;
                }

                return true;
            });

            return tile;
        }
    });

    this.GraphicalBoard.modes = modes;
}();
