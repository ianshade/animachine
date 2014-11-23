'use strict';

var EventEmitter = require('events').EventEmitter;
var inherits = require('inherits');
var dialogKeyOptions = require('./dialogKeyOptions');
var amgui = require('../amgui');
var Ease = require('./Ease');

function Key(opt) {

    EventEmitter.call(this);
    
    this._time =  0;
    this._value =  '';
    this.ease = new Ease();
    this._isSelected = false;
    this._height = amgui.LINE_HEIGHT;

    this._onSelectDropdown = this._onSelectDropdown.bind(this);
    this._onChangeEase = this._onChangeEase.bind(this);
    this._onChangeTape = this._onChangeTape.bind(this);
    this._onDeselectAllKeys = this._onDeselectAllKeys.bind(this);
    this._onTranslateSelectedKeys = this._onTranslateSelectedKeys.bind(this);

    this._createDomElem();

    this._deMenu = amgui.createDropdown({
        options: ['ease', 'delete']
    });
    this._deMenu.addEventListener('select', this._onSelectDropdown);

    am.timeline.on('changeTape', this._onChangeTape);
    am.timeline.on('deselectAllKeys', this._onDeselectAllKeys);
    am.timeline.on('translateSelectedKeys', this._onTranslateSelectedKeys);

    if (this.ease) {
        this.ease.on('change', this._onChangeEase);
    }

    amgui.bindDropdown({
        deTarget: this.domElem,
        deMenu: this._deMenu,
        asContextMenu: true
    });

    amgui.makeDraggable({
        deTarget: this.domElem,
        thisArg: this,
        onDown: function (e) {

            if (!e.shiftKey && !e.ctrlKey) {
                am.timeline.emit('deselectAllKeys');
            }

            //TODO shift+select (if an other key(s) selected in this line its should select thoes are between them) 
            if (e.shiftKey || e.ctrlKey) {
                if (this._isSelected) {
                    this.select();
                }
                else {
                    this.deselect();
                }
            }
            else {
                this.select();
            }
            
            return {
                dragged: 0,
            };
        },
        onMove: function (md, mx) {

            var diff = mx - md.mx,
                diffTime = (diff / am.timeline.timescale) - md.dragged;
                
            md.dragged += diffTime;

            am.timeline.emit('translateSelectedKeys', diffTime);
        }
    });

    if (opt) {
        this.useSave(opt);
    }
}

inherits(Key, EventEmitter);
var p = Key.prototype;
module.exports = Key;

Object.defineProperties(p, {

    time: {
        set: function (v) {

            if (!Number.isFinite(v) || this._time === v) return;

            this._time = parseInt(v);

            this._refreshDomElem();

            this.emit('changeTime', this);
        },
        get: function () {

            return this._time;
        }
    },
    value: {
        set: function (v) {

            if (this._value === v) return;

            this._value = v;
        },
        get: function () {

            return this._value;
        }
    }
});









p.getSave = function () {

    return {
        value: this.value,
        time: this.time,
        ease: this.ease.getSave(),
    };
};

p.useSave = function (save) {

    if ('value' in save) this.value = save.value;
    if ('time' in save) this.time = save.time;
    if ('ease' in save) this.ease.useSave(save.ease);
};

p.select = function () {

    if (this._isSelected) return;

    this._isSelected = true;

    this._refreshDomElem();

    this.emit('select');
}

p.deselect = function () {

    if (!this._isSelected) return;

    this._isSelected = false;

    this._refreshDomElem();

    this.emit('deselect');
}











p._onSelectDropdown = function (e) {
    
    var selection = e.detail.selection;

    if (selection === 'ease') {

        dialogKeyOptions.show({
            ease: this.ease,
        });
    }
    else if (selection === 'delete') {

        this.emit('delete', this);
    }
};

p._onChangeEase = function (ease) {

    this.emit('changeEase');
};

p._onChangeTape = function () {

    this._refreshDomElem();
};

p._onDeselectAllKeys = function () {

    this.deselect();
};

p._onTranslateSelectedKeys = function (offset) {

    if (this._isSelected) {

        this.time += offset;
    }
};









p._refreshDomElem = function () {

    this.domElem.style.left = Math.floor(this.time * am.timeline.timescale) + 'px';
    this.domElem.style.background = this._isSelected ? 'white' : 'none';
};









p._createDomElem = function () {

    var color = this.color || '#7700ff';

    this.domElem = document.createElement('div');
    this.domElem.style.position = 'absolute';
    this.domElem.style.transform = 'translateX(-4px)';
    this.domElem.setAttribute('debug-key', '');


    var deKey = document.createElement('div');
    deKey.style.width = '0';
    deKey.style.height = '0';
    deKey.style.borderStyle = 'solid';
    deKey.style.borderWidth = '21px 4px 0 4px';
    deKey.style.borderColor = color + ' transparent transparent transparent';
    this.domElem.appendChild(deKey);
};







p.dispose = function () {

    this._deMenu.removeEventListener('select', this._onSelectDropdown);
    am.timeline.removeListener('changeTape', this._onChangeTape);
    am.timeline.removeListener('deselectAllKeys', this._onDeselectAllKeys);
    am.timeline.removeListener('translateSelectedKeys', this._onTranslateSelectedKeys);

    if (this._deMenu.parentNode) this._deMenu.parentNode.removeChild(this._deMenu); 
};
