/**
 * NetteJs
 *
 * @copyright  Copyright (c) 2010 David Grudl
 * @license    http://nettephp.com/license  Nette license
 */

// supported cross-browser selectors: #id  |  div  |  div.class  |  .class
var NetteJs = function(selector) {
	if (typeof selector === "string") {
		selector = this._find(document, selector);

	} else if (!selector || selector.nodeType || selector.length === void 0 || selector === window) {
		selector = [selector];
	}

	for (var i = 0, len = selector.length; i < len; i++) {
		if (selector[i]) this[this.length++] = selector[i];
	}
};


NetteJs.prototype = {
	constructor: NetteJs,

	length: 0,

	find: function(selector) {
		return new NetteJs(this._find(this[0], selector));
	},

	_find: function(context, selector) {
		if (!context || !selector) {
			return [];

		} else if (document.querySelectorAll) {
			return context.querySelectorAll(selector);

		} else if (selector.charAt(0) === '#') { // #id
			return [document.getElementById(selector.substring(1))];

		} else { // div  |  div.class  |  .class
			selector = selector.split('.');
			var elms = context.getElementsByTagName(selector[0] || '*');

			if (selector[1]) {
				var list = [], pattern = new RegExp('(^|\\s)' + selector[1] + '(\\s|$)');
				for (var i = 0, len = elms.length; i < len; i++) {
					if (pattern.test(elms[i].className)) list.push(elms[i]);
				}
				return list;
			} else {
				return elms;
			}
		}
	},

	dom: function() {
		return this[0];
	},

	each: function(callback, args) {
		for (var i = 0, res; i < this.length; i++) {
			if ((res = callback.apply(this[i], args || [])) !== void 0) { return res; }
		}
		return this;
	}
};


NetteJs.fn = {};


NetteJs.implement = function(methods) {
	for (var name in methods) {
		NetteJs.fn[name] = methods[name];
		NetteJs.prototype[name] = (function(name){
			return function() { return this.each(NetteJs.fn[name], arguments) }
		}(name));
	}
};


NetteJs.implement({
	// cross-browser event attach
	bind: function(event, handler) {
		if (document.addEventListener && (event === 'mouseenter' || event === 'mouseleave')) { // simulate mouseenter & mouseleave using mouseover & mouseout
			var old = handler;
			event = event === 'mouseenter' ? 'mouseover' : 'mouseout';
			handler = function(e) {
				for (var target = e.relatedTarget; target; target = target.parentNode) {
					if (target === this) return; // target must not be inside this
				}
				old.call(this, e);
			};
		}

		var data = NetteJs.fn.data.call(this),
			events = data.events = data.events || {}; // use own handler queue

		if (!events[event]) {
			var el = this, // fixes 'this' in iE
				handlers = events[event] = [],
				generic = NetteJs.fn.bind.genericHandler = function(e) { // dont worry, 'e' is passed in IE
					if (!e.preventDefault) e.preventDefault = function() { e.returnValue = false }; // emulate preventDefault()
					if (!e.stopPropagation) e.stopPropagation = function() { e.cancelBubble = true }; // emulate stopPropagation()
					e.stopImmediatePropagation = function() { this.stopPropagation(); i = handlers.length };
					for (var i = 0; i < handlers.length; i++) {
						handlers[i].call(el, e);
					}
				};

			if (document.addEventListener) { // non-IE
				this.addEventListener(event, generic, false);
			} else if (document.attachEvent) { // IE < 9
				this.attachEvent('on' + event, generic);
			}
		}

		events[event].push(handler);
	},

	// adds class to element
	addClass: function(className) {
		this.className = this.className.replace(/^|\s+|$/g, ' ').replace(' '+className+' ', ' ') + ' ' + className;
	},

	// removes class from element
	removeClass: function(className) {
		this.className = this.className.replace(/^|\s+|$/g, ' ').replace(' '+className+' ', ' ');
	},

	// tests whether element has given class
	hasClass: function(className) {
		return this.className.replace(/^|\s+|$/g, ' ').indexOf(' '+className+' ') > -1;
	},

	show: function() {
		this.style.display = 'block';
	},

	hide: function() {
		this.style.display = 'none';
	},

	css: function(property) {
		return this.currentStyle ? this.currentStyle[property]
			: (window.getComputedStyle ? document.defaultView.getComputedStyle(this, null).getPropertyValue(property) : void 0);
	},

	data: function() {
		return this.nette = this.nette || {};
	},

	// returns total offset for element
	offset: function(coords) {
		var el = this, ofs = coords ? {left: -coords.left || 0, top: -coords.top || 0} : NetteJs.fn.position.call(el);
		while (el = el.offsetParent) { ofs.left += el.offsetLeft; ofs.top += el.offsetTop; }

		if (coords) {
			NetteJs.fn.position.call(this, {left: -ofs.left, top: -ofs.top});
		} else {
			return ofs;
		}
	},

	// returns current position or move to new position
	position: function(coords) {
		if (coords) {
			this.nette && this.nette.onmove && this.nette.onmove.call(this, coords);
			this.style.left = (coords.left || 0) + 'px';
			this.style.top = (coords.top || 0) + 'px';
		} else {
			return {left: this.offsetLeft, top: this.offsetTop, width: this.offsetWidth, height: this.offsetHeight};
		}
	},

	// makes element draggable
	draggable: function(options) {
		var $el = new NetteJs(this), dE = document.documentElement, binded, started, options = options || {};

		(new NetteJs(options.handle || this)).bind('mousedown', function(e) {
			e.preventDefault();
			e.stopPropagation();

			if (binded) { // missed mouseup out of window?
				return dE.onmouseup(e);
			}

			var deltaX = $el[0].offsetLeft - e.clientX, deltaY = $el[0].offsetTop - e.clientY;
			binded = true;
			started = false;

			dE.onmousemove = function(e) {
				e = e || event;
				if (!started) {
					options.draggedClass && $el.addClass(options.draggedClass);
					options.start && options.start(e, $el);
					started = true;
				}
				$el.position({left: e.clientX + deltaX, top: e.clientY + deltaY});
				return false;
			};

			dE.onmouseup = function(e) {
				if (started) {
					options.draggedClass && $el.removeClass(options.draggedClass);
					options.stop && options.stop(e || event, $el);
				}
				binded = dE.onmousemove = dE.onmouseup = null;
				return false;
			};

		}).bind('click', function(e) {
			if (started) {
				e.stopImmediatePropagation();
				preventClick = false;
			}
		});
	}
});
