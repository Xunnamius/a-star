~function()
{
    this.SmartTile = new Class({
        // This class represents a tile on the game board
        Implements: Options,

        options: {
            number: 0,
            cssclass: null,
            emptyclass: null,
        },

        _element: null,

        initialize: function(options)
        {
            this.setOptions(options);

            this._element = new Element('div', {
                'class': this.options.cssclass + (this.isEmpty() ? ' ' + this.options.emptyclass : '')
            });

            this._element.grab(
                new Element('span', { 'class': 'content', 'text': (this.isEmpty() ? ' ' : this.options.number) }));

            if(!this.isEmpty())
            {
                this._element.adopt([
                    new Element('span', { 'class': 'F', 'text': '...' }),
                    new Element('span', { 'class': 'G', 'text': '...' }),
                    new Element('span', { 'class': 'H', 'text': '... '})
                ]);
            }

            this._element.toClass = function()
            {
               return this;
            }.bind(this);
        },

        isEmpty: function()
        {
            return !this.options.number;
        },

        isInGoalState: function()
        {
            return this.options.number == this.getIndex();
        },

        getNumber: function()
        {
            return this.options.number;
        },

        getCSSClass: function()
        {
            return this.options.cssclass;
        },

        getIndex: function()
        {
            return this._element.getParent().getChildren('.'+this.options.cssclass).indexOf(this._element);
        },

        getXY: function()
        {
            return {
                x: (this.getIndex() % 3),
                y: Math.floor(this.getIndex() / 3)
            };
        },

        setPathCosts: function(F, G, H)
        {
            this._element.getElement('span.F').set('text', F);
            this._element.getElement('span.G').set('text', G);
            this._element.getElement('span.H').set('text', H);
        },

        toElement: function()
        {
            return this._element;
        }
    });
}();
