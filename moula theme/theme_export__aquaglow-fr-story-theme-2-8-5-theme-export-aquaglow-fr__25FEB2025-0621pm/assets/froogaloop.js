var Froogaloop = (function () {
	function e(a) {
		return new e.fn.init(a);
	}
	function g(a, c, b) {
		if (!b.contentWindow.postMessage) return !1;
		a = JSON.stringify({
			method: a,
			value: c,
		});
		b.contentWindow.postMessage(a, h);
	}
	function l(a) {
		var c, b;
		try {
			(c = JSON.parse(a.data)), (b = c.event || c.method);
		} catch (e) {}
		"ready" != b || k || (k = !0);
		if (!/^https?:\/\/player.vimeo.com/.test(a.origin)) return !1;
		"*" === h && (h = a.origin);
		b = [];
		if (!c) return !1;
		void 0 !== a && b.push(a);
	}
	function n(a, c, b) {
		b ? (d[b] || (d[b] = {}), (d[b][a] = c)) : (d[a] = c);
	}
	var d = {},
		k = !1,
		h = "*";
	e.fn = e.prototype = {
		element: null,
		init: function (a) {
			"string" === typeof a && (a = document.getElementById(a));
			this.element = a;
			return this;
		},
		api: function (a, c) {
			if (!this.element || !a) return !1;
			var b = this.element,
				d = "" !== b.id ? b.id : null,
				e = c && c.constructor && c.call && c.apply ? null : c,
				f = c && c.constructor && c.call && c.apply ? c : null;
			f && n(a, f, d);
			g(a, e, b);
			return this;
		},
		addEvent: function (a, c) {
			if (!this.element) return !1;
			var b = this.element,
				d = "" !== b.id ? b.id : null;
			n(a, c, d);
			"ready" != a
				? g("addEventListener", a, b)
				: "ready" == a && k && c.call(null, d);
			return this;
		},
		removeEvent: function (a) {
			if (!this.element) return !1;
			var c = this.element,
				b = "" !== c.id ? c.id : null;
			a: {
				if (b && d[b]) {
					if (!d[b][a]) {
						b = !1;
						break a;
					}
					d[b][a] = null;
				} else {
					if (!d[a]) {
						b = !1;
						break a;
					}
					d[a] = null;
				}
				b = !0;
			}
			"ready" != a && b && g("removeEventListener", a, c);
		},
	};
	e.fn.init.prototype = e.fn;
	window.addEventListener
		? window.addEventListener("message", l, !1)
		: window.attachEvent("onmessage", l);
	return (window.Froogaloop = window.$f = e);
})();
