/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ht = globalThis, Nt = ht.ShadowRoot && (ht.ShadyCSS === void 0 || ht.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, jt = Symbol(), qt = /* @__PURE__ */ new WeakMap();
let ue = class {
  constructor(t, s, n) {
    if (this._$cssResult$ = !0, n !== jt) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = s;
  }
  get styleSheet() {
    let t = this.o;
    const s = this.t;
    if (Nt && t === void 0) {
      const n = s !== void 0 && s.length === 1;
      n && (t = qt.get(s)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), n && qt.set(s, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const Ee = (e) => new ue(typeof e == "string" ? e : e + "", void 0, jt), w = (e, ...t) => {
  const s = e.length === 1 ? e[0] : t.reduce((n, r, i) => n + ((a) => {
    if (a._$cssResult$ === !0) return a.cssText;
    if (typeof a == "number") return a;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + a + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(r) + e[i + 1], e[0]);
  return new ue(s, e, jt);
}, Se = (e, t) => {
  if (Nt) e.adoptedStyleSheets = t.map((s) => s instanceof CSSStyleSheet ? s : s.styleSheet);
  else for (const s of t) {
    const n = document.createElement("style"), r = ht.litNonce;
    r !== void 0 && n.setAttribute("nonce", r), n.textContent = s.cssText, e.appendChild(n);
  }
}, Kt = Nt ? (e) => e : (e) => e instanceof CSSStyleSheet ? ((t) => {
  let s = "";
  for (const n of t.cssRules) s += n.cssText;
  return Ee(s);
})(e) : e;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: Ce, defineProperty: Pe, getOwnPropertyDescriptor: Te, getOwnPropertyNames: Oe, getOwnPropertySymbols: De, getPrototypeOf: ze } = Object, yt = globalThis, Gt = yt.trustedTypes, Ne = Gt ? Gt.emptyScript : "", je = yt.reactiveElementPolyfillSupport, et = (e, t) => e, ut = { toAttribute(e, t) {
  switch (t) {
    case Boolean:
      e = e ? Ne : null;
      break;
    case Object:
    case Array:
      e = e == null ? e : JSON.stringify(e);
  }
  return e;
}, fromAttribute(e, t) {
  let s = e;
  switch (t) {
    case Boolean:
      s = e !== null;
      break;
    case Number:
      s = e === null ? null : Number(e);
      break;
    case Object:
    case Array:
      try {
        s = JSON.parse(e);
      } catch {
        s = null;
      }
  }
  return s;
} }, Rt = (e, t) => !Ce(e, t), Xt = { attribute: !0, type: String, converter: ut, reflect: !1, useDefault: !1, hasChanged: Rt };
Symbol.metadata ??= Symbol("metadata"), yt.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let W = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ??= []).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, s = Xt) {
    if (s.state && (s.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((s = Object.create(s)).wrapped = !0), this.elementProperties.set(t, s), !s.noAccessor) {
      const n = Symbol(), r = this.getPropertyDescriptor(t, n, s);
      r !== void 0 && Pe(this.prototype, t, r);
    }
  }
  static getPropertyDescriptor(t, s, n) {
    const { get: r, set: i } = Te(this.prototype, t) ?? { get() {
      return this[s];
    }, set(a) {
      this[s] = a;
    } };
    return { get: r, set(a) {
      const o = r?.call(this);
      i?.call(this, a), this.requestUpdate(t, o, n);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? Xt;
  }
  static _$Ei() {
    if (this.hasOwnProperty(et("elementProperties"))) return;
    const t = ze(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(et("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(et("properties"))) {
      const s = this.properties, n = [...Oe(s), ...De(s)];
      for (const r of n) this.createProperty(r, s[r]);
    }
    const t = this[Symbol.metadata];
    if (t !== null) {
      const s = litPropertyMetadata.get(t);
      if (s !== void 0) for (const [n, r] of s) this.elementProperties.set(n, r);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [s, n] of this.elementProperties) {
      const r = this._$Eu(s, n);
      r !== void 0 && this._$Eh.set(r, s);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(t) {
    const s = [];
    if (Array.isArray(t)) {
      const n = new Set(t.flat(1 / 0).reverse());
      for (const r of n) s.unshift(Kt(r));
    } else t !== void 0 && s.push(Kt(t));
    return s;
  }
  static _$Eu(t, s) {
    const n = s.attribute;
    return n === !1 ? void 0 : typeof n == "string" ? n : typeof t == "string" ? t.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise((t) => this.enableUpdating = t), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((t) => t(this));
  }
  addController(t) {
    (this._$EO ??= /* @__PURE__ */ new Set()).add(t), this.renderRoot !== void 0 && this.isConnected && t.hostConnected?.();
  }
  removeController(t) {
    this._$EO?.delete(t);
  }
  _$E_() {
    const t = /* @__PURE__ */ new Map(), s = this.constructor.elementProperties;
    for (const n of s.keys()) this.hasOwnProperty(n) && (t.set(n, this[n]), delete this[n]);
    t.size > 0 && (this._$Ep = t);
  }
  createRenderRoot() {
    const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return Se(t, this.constructor.elementStyles), t;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((t) => t.hostConnected?.());
  }
  enableUpdating(t) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((t) => t.hostDisconnected?.());
  }
  attributeChangedCallback(t, s, n) {
    this._$AK(t, n);
  }
  _$ET(t, s) {
    const n = this.constructor.elementProperties.get(t), r = this.constructor._$Eu(t, n);
    if (r !== void 0 && n.reflect === !0) {
      const i = (n.converter?.toAttribute !== void 0 ? n.converter : ut).toAttribute(s, n.type);
      this._$Em = t, i == null ? this.removeAttribute(r) : this.setAttribute(r, i), this._$Em = null;
    }
  }
  _$AK(t, s) {
    const n = this.constructor, r = n._$Eh.get(t);
    if (r !== void 0 && this._$Em !== r) {
      const i = n.getPropertyOptions(r), a = typeof i.converter == "function" ? { fromAttribute: i.converter } : i.converter?.fromAttribute !== void 0 ? i.converter : ut;
      this._$Em = r;
      const o = a.fromAttribute(s, i.type);
      this[r] = o ?? this._$Ej?.get(r) ?? o, this._$Em = null;
    }
  }
  requestUpdate(t, s, n, r = !1, i) {
    if (t !== void 0) {
      const a = this.constructor;
      if (r === !1 && (i = this[t]), n ??= a.getPropertyOptions(t), !((n.hasChanged ?? Rt)(i, s) || n.useDefault && n.reflect && i === this._$Ej?.get(t) && !this.hasAttribute(a._$Eu(t, n)))) return;
      this.C(t, s, n);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, s, { useDefault: n, reflect: r, wrapped: i }, a) {
    n && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t) && (this._$Ej.set(t, a ?? s ?? this[t]), i !== !0 || a !== void 0) || (this._$AL.has(t) || (this.hasUpdated || n || (s = void 0), this._$AL.set(t, s)), r === !0 && this._$Em !== t && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (s) {
      Promise.reject(s);
    }
    const t = this.scheduleUpdate();
    return t != null && await t, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
        for (const [r, i] of this._$Ep) this[r] = i;
        this._$Ep = void 0;
      }
      const n = this.constructor.elementProperties;
      if (n.size > 0) for (const [r, i] of n) {
        const { wrapped: a } = i, o = this[r];
        a !== !0 || this._$AL.has(r) || o === void 0 || this.C(r, void 0, i, o);
      }
    }
    let t = !1;
    const s = this._$AL;
    try {
      t = this.shouldUpdate(s), t ? (this.willUpdate(s), this._$EO?.forEach((n) => n.hostUpdate?.()), this.update(s)) : this._$EM();
    } catch (n) {
      throw t = !1, this._$EM(), n;
    }
    t && this._$AE(s);
  }
  willUpdate(t) {
  }
  _$AE(t) {
    this._$EO?.forEach((s) => s.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(t)), this.updated(t);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(t) {
    return !0;
  }
  update(t) {
    this._$Eq &&= this._$Eq.forEach((s) => this._$ET(s, this[s])), this._$EM();
  }
  updated(t) {
  }
  firstUpdated(t) {
  }
};
W.elementStyles = [], W.shadowRootOptions = { mode: "open" }, W[et("elementProperties")] = /* @__PURE__ */ new Map(), W[et("finalized")] = /* @__PURE__ */ new Map(), je?.({ ReactiveElement: W }), (yt.reactiveElementVersions ??= []).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ut = globalThis, Jt = (e) => e, mt = Ut.trustedTypes, Qt = mt ? mt.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, me = "$lit$", O = `lit$${Math.random().toFixed(9).slice(2)}$`, fe = "?" + O, Re = `<${fe}>`, L = document, st = () => L.createComment(""), nt = (e) => e === null || typeof e != "object" && typeof e != "function", Lt = Array.isArray, Ue = (e) => Lt(e) || typeof e?.[Symbol.iterator] == "function", kt = `[ 	
\f\r]`, Q = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, te = /-->/g, ee = />/g, j = RegExp(`>|${kt}(?:([^\\s"'>=/]+)(${kt}*=${kt}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), se = /'/g, ne = /"/g, ve = /^(?:script|style|textarea|title)$/i, ge = (e) => (t, ...s) => ({ _$litType$: e, strings: t, values: s }), c = ge(1), g = ge(2), Y = Symbol.for("lit-noChange"), p = Symbol.for("lit-nothing"), re = /* @__PURE__ */ new WeakMap(), R = L.createTreeWalker(L, 129);
function ye(e, t) {
  if (!Lt(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return Qt !== void 0 ? Qt.createHTML(t) : t;
}
const Le = (e, t) => {
  const s = e.length - 1, n = [];
  let r, i = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", a = Q;
  for (let o = 0; o < s; o++) {
    const l = e[o];
    let d, u, h = -1, v = 0;
    for (; v < l.length && (a.lastIndex = v, u = a.exec(l), u !== null); ) v = a.lastIndex, a === Q ? u[1] === "!--" ? a = te : u[1] !== void 0 ? a = ee : u[2] !== void 0 ? (ve.test(u[2]) && (r = RegExp("</" + u[2], "g")), a = j) : u[3] !== void 0 && (a = j) : a === j ? u[0] === ">" ? (a = r ?? Q, h = -1) : u[1] === void 0 ? h = -2 : (h = a.lastIndex - u[2].length, d = u[1], a = u[3] === void 0 ? j : u[3] === '"' ? ne : se) : a === ne || a === se ? a = j : a === te || a === ee ? a = Q : (a = j, r = void 0);
    const y = a === j && e[o + 1].startsWith("/>") ? " " : "";
    i += a === Q ? l + Re : h >= 0 ? (n.push(d), l.slice(0, h) + me + l.slice(h) + O + y) : l + O + (h === -2 ? o : y);
  }
  return [ye(e, i + (e[s] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), n];
};
class rt {
  constructor({ strings: t, _$litType$: s }, n) {
    let r;
    this.parts = [];
    let i = 0, a = 0;
    const o = t.length - 1, l = this.parts, [d, u] = Le(t, s);
    if (this.el = rt.createElement(d, n), R.currentNode = this.el.content, s === 2 || s === 3) {
      const h = this.el.content.firstChild;
      h.replaceWith(...h.childNodes);
    }
    for (; (r = R.nextNode()) !== null && l.length < o; ) {
      if (r.nodeType === 1) {
        if (r.hasAttributes()) for (const h of r.getAttributeNames()) if (h.endsWith(me)) {
          const v = u[a++], y = r.getAttribute(h).split(O), T = /([.?@])?(.*)/.exec(v);
          l.push({ type: 1, index: i, name: T[2], strings: y, ctor: T[1] === "." ? Ie : T[1] === "?" ? Fe : T[1] === "@" ? Be : $t }), r.removeAttribute(h);
        } else h.startsWith(O) && (l.push({ type: 6, index: i }), r.removeAttribute(h));
        if (ve.test(r.tagName)) {
          const h = r.textContent.split(O), v = h.length - 1;
          if (v > 0) {
            r.textContent = mt ? mt.emptyScript : "";
            for (let y = 0; y < v; y++) r.append(h[y], st()), R.nextNode(), l.push({ type: 2, index: ++i });
            r.append(h[v], st());
          }
        }
      } else if (r.nodeType === 8) if (r.data === fe) l.push({ type: 2, index: i });
      else {
        let h = -1;
        for (; (h = r.data.indexOf(O, h + 1)) !== -1; ) l.push({ type: 7, index: i }), h += O.length - 1;
      }
      i++;
    }
  }
  static createElement(t, s) {
    const n = L.createElement("template");
    return n.innerHTML = t, n;
  }
}
function Z(e, t, s = e, n) {
  if (t === Y) return t;
  let r = n !== void 0 ? s._$Co?.[n] : s._$Cl;
  const i = nt(t) ? void 0 : t._$litDirective$;
  return r?.constructor !== i && (r?._$AO?.(!1), i === void 0 ? r = void 0 : (r = new i(e), r._$AT(e, s, n)), n !== void 0 ? (s._$Co ??= [])[n] = r : s._$Cl = r), r !== void 0 && (t = Z(e, r._$AS(e, t.values), r, n)), t;
}
let He = class {
  constructor(t, s) {
    this._$AV = [], this._$AN = void 0, this._$AD = t, this._$AM = s;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t) {
    const { el: { content: s }, parts: n } = this._$AD, r = (t?.creationScope ?? L).importNode(s, !0);
    R.currentNode = r;
    let i = R.nextNode(), a = 0, o = 0, l = n[0];
    for (; l !== void 0; ) {
      if (a === l.index) {
        let d;
        l.type === 2 ? d = new at(i, i.nextSibling, this, t) : l.type === 1 ? d = new l.ctor(i, l.name, l.strings, this, t) : l.type === 6 && (d = new Ve(i, this, t)), this._$AV.push(d), l = n[++o];
      }
      a !== l?.index && (i = R.nextNode(), a++);
    }
    return R.currentNode = L, r;
  }
  p(t) {
    let s = 0;
    for (const n of this._$AV) n !== void 0 && (n.strings !== void 0 ? (n._$AI(t, n, s), s += n.strings.length - 2) : n._$AI(t[s])), s++;
  }
};
class at {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t, s, n, r) {
    this.type = 2, this._$AH = p, this._$AN = void 0, this._$AA = t, this._$AB = s, this._$AM = n, this.options = r, this._$Cv = r?.isConnected ?? !0;
  }
  get parentNode() {
    let t = this._$AA.parentNode;
    const s = this._$AM;
    return s !== void 0 && t?.nodeType === 11 && (t = s.parentNode), t;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t, s = this) {
    t = Z(this, t, s), nt(t) ? t === p || t == null || t === "" ? (this._$AH !== p && this._$AR(), this._$AH = p) : t !== this._$AH && t !== Y && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : Ue(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== p && nt(this._$AH) ? this._$AA.nextSibling.data = t : this.T(L.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    const { values: s, _$litType$: n } = t, r = typeof n == "number" ? this._$AC(t) : (n.el === void 0 && (n.el = rt.createElement(ye(n.h, n.h[0]), this.options)), n);
    if (this._$AH?._$AD === r) this._$AH.p(s);
    else {
      const i = new He(r, this), a = i.u(this.options);
      i.p(s), this.T(a), this._$AH = i;
    }
  }
  _$AC(t) {
    let s = re.get(t.strings);
    return s === void 0 && re.set(t.strings, s = new rt(t)), s;
  }
  k(t) {
    Lt(this._$AH) || (this._$AH = [], this._$AR());
    const s = this._$AH;
    let n, r = 0;
    for (const i of t) r === s.length ? s.push(n = new at(this.O(st()), this.O(st()), this, this.options)) : n = s[r], n._$AI(i), r++;
    r < s.length && (this._$AR(n && n._$AB.nextSibling, r), s.length = r);
  }
  _$AR(t = this._$AA.nextSibling, s) {
    for (this._$AP?.(!1, !0, s); t !== this._$AB; ) {
      const n = Jt(t).nextSibling;
      Jt(t).remove(), t = n;
    }
  }
  setConnected(t) {
    this._$AM === void 0 && (this._$Cv = t, this._$AP?.(t));
  }
}
let $t = class {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, s, n, r, i) {
    this.type = 1, this._$AH = p, this._$AN = void 0, this.element = t, this.name = s, this._$AM = r, this.options = i, n.length > 2 || n[0] !== "" || n[1] !== "" ? (this._$AH = Array(n.length - 1).fill(new String()), this.strings = n) : this._$AH = p;
  }
  _$AI(t, s = this, n, r) {
    const i = this.strings;
    let a = !1;
    if (i === void 0) t = Z(this, t, s, 0), a = !nt(t) || t !== this._$AH && t !== Y, a && (this._$AH = t);
    else {
      const o = t;
      let l, d;
      for (t = i[0], l = 0; l < i.length - 1; l++) d = Z(this, o[n + l], s, l), d === Y && (d = this._$AH[l]), a ||= !nt(d) || d !== this._$AH[l], d === p ? t = p : t !== p && (t += (d ?? "") + i[l + 1]), this._$AH[l] = d;
    }
    a && !r && this.j(t);
  }
  j(t) {
    t === p ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
};
class Ie extends $t {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === p ? void 0 : t;
  }
}
class Fe extends $t {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== p);
  }
}
class Be extends $t {
  constructor(t, s, n, r, i) {
    super(t, s, n, r, i), this.type = 5;
  }
  _$AI(t, s = this) {
    if ((t = Z(this, t, s, 0) ?? p) === Y) return;
    const n = this._$AH, r = t === p && n !== p || t.capture !== n.capture || t.once !== n.once || t.passive !== n.passive, i = t !== p && (n === p || r);
    r && this.element.removeEventListener(this.name, this, n), i && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class Ve {
  constructor(t, s, n) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = s, this.options = n;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    Z(this, t);
  }
}
const We = Ut.litHtmlPolyfillSupport;
We?.(rt, at), (Ut.litHtmlVersions ??= []).push("3.3.3");
const Ye = (e, t, s) => {
  const n = s?.renderBefore ?? t;
  let r = n._$litPart$;
  if (r === void 0) {
    const i = s?.renderBefore ?? null;
    n._$litPart$ = r = new at(t.insertBefore(st(), i), i, void 0, s ?? {});
  }
  return r._$AI(e), r;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ht = globalThis;
class x extends W {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const t = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t.firstChild, t;
  }
  update(t) {
    const s = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = Ye(s, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return Y;
  }
}
x._$litElement$ = !0, x.finalized = !0, Ht.litElementHydrateSupport?.({ LitElement: x });
const Ze = Ht.litElementPolyfillSupport;
Ze?.({ LitElement: x });
(Ht.litElementVersions ??= []).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const M = (e) => (t, s) => {
  s !== void 0 ? s.addInitializer(() => {
    customElements.define(e, t);
  }) : customElements.define(e, t);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const qe = { attribute: !0, type: String, converter: ut, reflect: !1, hasChanged: Rt }, Ke = (e = qe, t, s) => {
  const { kind: n, metadata: r } = s;
  let i = globalThis.litPropertyMetadata.get(r);
  if (i === void 0 && globalThis.litPropertyMetadata.set(r, i = /* @__PURE__ */ new Map()), n === "setter" && ((e = Object.create(e)).wrapped = !0), i.set(s.name, e), n === "accessor") {
    const { name: a } = s;
    return { set(o) {
      const l = t.get.call(this);
      t.set.call(this, o), this.requestUpdate(a, l, e, !0, o);
    }, init(o) {
      return o !== void 0 && this.C(a, void 0, e, o), o;
    } };
  }
  if (n === "setter") {
    const { name: a } = s;
    return function(o) {
      const l = this[a];
      t.call(this, o), this.requestUpdate(a, l, e, !0, o);
    };
  }
  throw Error("Unsupported decorator location: " + n);
};
function f(e) {
  return (t, s) => typeof s == "object" ? Ke(e, t, s) : ((n, r, i) => {
    const a = r.hasOwnProperty(i);
    return r.constructor.createProperty(i, n), a ? Object.getOwnPropertyDescriptor(r, i) : void 0;
  })(e, t, s);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function F(e) {
  return f({ ...e, state: !0, attribute: !1 });
}
const St = {
  live: "Live · updated {time}",
  liveNoTime: "Live",
  unavailable: "Unavailable",
  stale: "Data is {n} min old",
  free: "Free",
  busy: "In use",
  done: "Done – take out the laundry",
  doneShort: "Done",
  error: "Error",
  unknown: "Unknown",
  almostDone: "Almost done",
  finishAt: "done at {time}",
  nextFree: "Next free",
  nextFinish: "Next to finish",
  nextFreeChip: "{name} in {time}",
  nextFreeNow: "{name} any moment",
  allBusy: "All {types} are in use",
  availability: "Availability",
  free_of: "{free} of {total} free",
  type_washer: "Washer",
  type_dryer: "Dryer",
  type_mangle: "Mangle",
  type_other: "Machine",
  types_washer: "Washers",
  types_dryer: "Dryers",
  types_mangle: "Mangles",
  types_other: "Other",
  typesLower_washer: "washers",
  typesLower_dryer: "dryers",
  typesLower_mangle: "mangles",
  typesLower_other: "machines",
  min: "{n} min",
  lessThanMin: "under 1 min",
  hourMin: "{h} h {m} min",
  hour: "{h} h",
  balance: "Balance",
  owed: "Owed",
  credit: "Credit",
  settled: "Settled",
  vsPrevious: "vs. previous period",
  lastPayment: "Last payment",
  payment: "Payment",
  monthlySpend: "Monthly spending",
  spend: "Spending",
  last12: "Last 12 months",
  washing: "Washing",
  drying: "Drying",
  total: "Total",
  avgWash: "Avg. per wash",
  avgDry: "Avg. per dry",
  washes: "Washes",
  dries: "Dries",
  favourite: "Favourite machine",
  topTemp: "Most used temp.",
  uses: "{n} uses",
  heatmap: "When you do laundry",
  insight: "You usually do laundry on {day} {from}–{to}",
  insightNone: "Not enough data yet to spot a pattern",
  less: "Less",
  more: "More",
  uses_n: "{n} uses",
  activity: "Recent activity",
  noActivity: "No recent activity",
  program: "Program {n}",
  setupTitle: "E-Vaskeri is not set up yet",
  setupBody: "The E-Vaskeri sensors were not found. Add the E-Vaskeri integration under Settings → Devices & services, or point the card at your sensors with machines_entity / account_entity.",
  noAccount: "The account sensor was not found, so balance and spending are hidden.",
  noMachines: "The machine sensor was not found.",
  unavailableBody: "The laundry data is currently unavailable. The card will recover automatically.",
  editor_title: "Title",
  editor_show: "Sections",
  editor_compact: "Compact (header, availability and machines only)",
  editor_machine_types: "Machine types",
  editor_language: "Language",
  editor_machines_entity: "Machines entity (optional)",
  editor_account_entity: "Account entity (optional)",
  editor_auto: "Automatic",
  sec_machines: "Machines",
  sec_balance: "Balance",
  sec_spend: "Spending",
  sec_heatmap: "Heatmap",
  sec_activity: "Recent activity",
  cardDescription: "Laundry room availability, countdowns, balance and usage statistics"
}, Ge = {
  live: "Live · opdateret {time}",
  liveNoTime: "Live",
  unavailable: "Utilgængelig",
  stale: "Data er {n} min. gammel",
  free: "Fri",
  busy: "Optaget",
  done: "Færdig – tag tøjet ud",
  doneShort: "Færdig",
  error: "Fejl",
  unknown: "Ukendt",
  almostDone: "Færdig snart",
  finishAt: "færdig kl. {time}",
  nextFree: "Næste ledige",
  nextFinish: "Næste færdig",
  nextFreeChip: "{name} om {time}",
  nextFreeNow: "{name} lige om lidt",
  allBusy: "Alle {types} er optaget",
  availability: "Ledighed",
  free_of: "{free} af {total} ledige",
  type_washer: "Vaskemaskine",
  type_dryer: "Tørretumbler",
  type_mangle: "Strygerulle",
  type_other: "Maskine",
  types_washer: "Vaskemaskiner",
  types_dryer: "Tørretumblere",
  types_mangle: "Strygerulle",
  types_other: "Andet",
  typesLower_washer: "vaskemaskiner",
  typesLower_dryer: "tørretumblere",
  typesLower_mangle: "strygerulle",
  typesLower_other: "maskiner",
  min: "{n} min.",
  lessThanMin: "under 1 min.",
  hourMin: "{h} t. {m} min.",
  hour: "{h} t.",
  balance: "Saldo",
  owed: "Skyldigt",
  credit: "Til gode",
  settled: "Udlignet",
  vsPrevious: "ift. forrige periode",
  lastPayment: "Sidste betaling",
  payment: "Betaling",
  monthlySpend: "Månedligt forbrug",
  spend: "Forbrug",
  last12: "Seneste 12 måneder",
  washing: "Vask",
  drying: "Tørring",
  total: "I alt",
  avgWash: "Gns. pr. vask",
  avgDry: "Gns. pr. tørring",
  washes: "Vaske",
  dries: "Tørringer",
  favourite: "Yndlingsmaskine",
  topTemp: "Mest brugte temp.",
  uses: "{n} gange",
  heatmap: "Hvornår vasker du",
  insight: "Du vasker oftest {day} kl. {from}–{to}",
  insightNone: "Endnu ikke nok data til at se et mønster",
  less: "Mindre",
  more: "Mere",
  uses_n: "{n} gange",
  activity: "Seneste aktivitet",
  noActivity: "Ingen seneste aktivitet",
  program: "Program {n}",
  setupTitle: "E-Vaskeri er ikke sat op endnu",
  setupBody: "E-Vaskeri-sensorerne blev ikke fundet. Tilføj E-Vaskeri-integrationen under Indstillinger → Enheder og tjenester, eller peg kortet på dine sensorer med machines_entity / account_entity.",
  noAccount: "Konto-sensoren blev ikke fundet, så saldo og forbrug er skjult.",
  noMachines: "Maskin-sensoren blev ikke fundet.",
  unavailableBody: "Vaskeridata er midlertidigt utilgængelige. Kortet genopretter sig selv.",
  editor_title: "Titel",
  editor_show: "Sektioner",
  editor_compact: "Kompakt (kun overskrift, ledighed og maskiner)",
  editor_machine_types: "Maskintyper",
  editor_language: "Sprog",
  editor_machines_entity: "Maskin-entitet (valgfri)",
  editor_account_entity: "Konto-entitet (valgfri)",
  editor_auto: "Automatisk",
  sec_machines: "Maskiner",
  sec_balance: "Saldo",
  sec_spend: "Forbrug",
  sec_heatmap: "Varmekort",
  sec_activity: "Seneste aktivitet",
  cardDescription: "Ledige vaskemaskiner, nedtælling, saldo og forbrugsstatistik"
}, Xe = { en: St, da: Ge };
function it(e) {
  const t = Xe[e] ?? St;
  return (s, n) => {
    let r = t[s] ?? St[s] ?? s;
    if (n)
      for (const [i, a] of Object.entries(n))
        r = r.split(`{${i}}`).join(String(a));
    return r;
  };
}
function Je(e, t) {
  return e(t === "done" ? "done" : t);
}
function ft(e, t, s = !1) {
  return e(`${s ? "types" : "type"}_${t}`);
}
function Qe(e, t) {
  return e(`typesLower_${t}`);
}
const ts = "−";
function Ct(e, t) {
  return (t && t !== "auto" ? t : e?.locale?.language ?? e?.language ?? "en").toLowerCase().startsWith("da") ? "da" : "en";
}
function es(e, t) {
  const s = !!t && t !== "auto", n = Ct(e, t), r = s ? t : e?.locale?.language ?? e?.language ?? "en", i = s ? "language" : e?.locale?.number_format ?? "language";
  let a = r, o = !0;
  switch (i) {
    case "comma_decimal":
      a = "en-US";
      break;
    case "decimal_comma":
      a = "de";
      break;
    case "space_comma":
      a = "fr";
      break;
    case "none":
      o = !1;
      break;
    case "system":
      a = void 0;
      break;
  }
  const l = e?.locale?.time_zone === "server" ? e.config?.time_zone : void 0;
  return { lang: n, locale: r, numberLocale: a, grouping: o, timeZone: l, hour12: e?.locale?.time_format === "12" };
}
function pt(e, t, s = 2) {
  return new Intl.NumberFormat(e.numberLocale, {
    minimumFractionDigits: s,
    maximumFractionDigits: s,
    useGrouping: e.grouping
  }).format(Math.abs(t));
}
function k(e, t, s = "auto", n = 2) {
  const r = Math.round(Math.abs(t) * 10 ** n) / 10 ** n, i = `${pt(e, r, n)} kr`;
  return s === "never" || r === 0 ? i : t < 0 ? `${ts}${i}` : s === "always" ? `+${i}` : i;
}
function ss(e, t) {
  const s = typeof t == "number" ? new Date(t) : t, n = new Intl.DateTimeFormat(e.hour12 ? "en-US" : "en-GB", {
    hour: e.hour12 ? "numeric" : "2-digit",
    minute: "2-digit",
    hour12: e.hour12,
    timeZone: e.timeZone
  }).formatToParts(s), r = (o) => n.find((l) => l.type === o)?.value ?? "", a = `${r("hour") === "24" ? "00" : r("hour")}:${r("minute")}`;
  return e.hour12 ? `${a} ${r("dayPeriod")}`.trim() : a;
}
function ns(e) {
  const t = /^(\d{4})-(\d{2})-(\d{2})/.exec(e);
  return t ? new Date(Date.UTC(Number(t[1]), Number(t[2]) - 1, Number(t[3]))) : null;
}
const It = (e) => e.replace(/\.$/, "");
function $e(e, t) {
  const s = ns(t);
  return s ? It(
    new Intl.DateTimeFormat(e.locale, { day: "numeric", month: "short", timeZone: "UTC" }).format(s)
  ) : t;
}
function be(e, t) {
  const s = /^(\d{4})-(\d{2})/.exec(t);
  if (!s) return t;
  const n = new Date(Date.UTC(Number(s[1]), Number(s[2]) - 1, 1));
  return It(new Intl.DateTimeFormat(e.locale, { month: "short", timeZone: "UTC" }).format(n));
}
function rs(e, t) {
  const s = /^(\d{4})-(\d{2})/.exec(t);
  if (!s) return t;
  const n = new Date(Date.UTC(Number(s[1]), Number(s[2]) - 1, 1));
  return new Intl.DateTimeFormat(e.locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(n);
}
function ie(e, t = "short") {
  const s = new Intl.DateTimeFormat(e.locale, { weekday: t, timeZone: "UTC" });
  return Array.from({ length: 7 }, (n, r) => It(s.format(new Date(Date.UTC(2024, 0, 1 + r)))));
}
function ct(e, t) {
  return new Intl.NumberFormat(e.numberLocale, { style: "percent", maximumFractionDigits: 0 }).format(t);
}
function Ft(e) {
  if (!/[\u00c2\u00c3]/.test(e)) return e;
  const t = new Uint8Array(e.length);
  for (let s = 0; s < e.length; s++) {
    const n = e.charCodeAt(s);
    if (n > 255) return e;
    t[s] = n;
  }
  try {
    return new TextDecoder("utf-8", { fatal: !0 }).decode(t);
  } catch {
    return e;
  }
}
const is = "e_vaskeri";
function as(e, t = {}) {
  const s = (n) => {
    for (const r of Object.values(e?.entities ?? {}))
      if (r.platform === is && r.translation_key === n) return r.entity_id;
    return null;
  };
  return {
    machinesEntity: t.machines_entity || s("machines_overview"),
    accountEntity: t.account_entity || s("account_overview")
  };
}
const xe = ["washer", "dryer", "mangle", "other"], os = ["free", "busy", "done", "error", "unknown"], m = (e) => typeof e == "number" && Number.isFinite(e) ? e : null, $ = (e) => typeof e == "string" && e !== "" ? e : null, _ = (e) => typeof e == "object" && e !== null && !Array.isArray(e);
function _e(e) {
  const t = $(e);
  if (!t) return null;
  const s = Date.parse(t);
  return Number.isNaN(s) ? null : s;
}
function ls(e) {
  if (!_(e)) return null;
  const t = m(e.id);
  if (t == null) return null;
  const s = xe.includes(e.type) ? e.type : "other", n = os.includes(e.state) ? e.state : "unknown", r = (i) => {
    const a = $(i);
    return a ? Ft(a) : null;
  };
  return {
    id: t,
    name: r(e.name) ?? `#${t}`,
    type: s,
    state: n,
    raw_status: r(e.raw_status),
    program: r(e.program),
    step: r(e.step),
    remaining_seconds: m(e.remaining_seconds),
    ends_at: $(e.ends_at),
    entity_id: $(e.entity_id)
  };
}
function cs(e) {
  const t = {};
  for (const r of e) {
    const i = t[r.type] ??= { total: 0, free: 0, busy: 0 };
    i.total++, r.state === "free" && i.free++, r.state === "busy" && i.busy++;
  }
  const s = e.filter((r) => r.state === "free").length, n = e.filter((r) => r.state === "busy").length;
  return { total: e.length, free: s, busy: n, by_type: t, next_free: null };
}
function hs(e, t) {
  const s = cs(t);
  if (!_(e)) return s;
  const n = {};
  if (_(e.by_type))
    for (const i of xe) {
      const a = e.by_type[i];
      _(a) && m(a.total) != null && (n[i] = { total: m(a.total), free: m(a.free) ?? 0, busy: m(a.busy) ?? 0 });
    }
  const r = e.next_free;
  return {
    total: m(e.total) ?? s.total,
    free: m(e.free) ?? s.free,
    busy: m(e.busy) ?? s.busy,
    by_type: Object.keys(n).length ? n : s.by_type,
    next_free: _(r) && m(r.id) != null ? { id: m(r.id), name: $(r.name) ?? `#${r.id}`, ends_at: $(r.ends_at) } : null
  };
}
function we(e) {
  return e === void 0 || e === "unavailable" || e === "unknown";
}
function ps(e, t) {
  if (!t) return null;
  const s = e?.states?.[t];
  if (!s) return null;
  const n = s.attributes ?? {}, r = (Array.isArray(n.machines) ? n.machines : []).map(ls).filter((i) => i !== null).sort((i, a) => i.id - a.id);
  return {
    available: !we(s.state) && r.length > 0,
    location: $(n.location),
    updatedAt: _e(n.updated_at),
    upstreamUpdated: $(n.upstream_updated),
    summary: hs(n.summary, r),
    machines: r
  };
}
function ds(e) {
  if (!_(e)) return null;
  const t = (Array.isArray(e.months) ? e.months : []).filter(_).map((r) => ({
    month: $(r.month) ?? "",
    washer_dkk: m(r.washer_dkk) ?? 0,
    dryer_dkk: m(r.dryer_dkk) ?? 0,
    total_dkk: m(r.total_dkk) ?? (m(r.washer_dkk) ?? 0) + (m(r.dryer_dkk) ?? 0)
  })).filter((r) => r.month), s = e.totals, n = e.favourite_machine;
  return {
    months: t,
    totals: _(s) ? {
      washer_dkk: m(s.washer_dkk) ?? 0,
      dryer_dkk: m(s.dryer_dkk) ?? 0,
      total_dkk: m(s.total_dkk) ?? 0,
      washes: m(s.washes) ?? 0,
      dries: m(s.dries) ?? 0
    } : null,
    current_month_spend_dkk: m(e.current_month_spend_dkk),
    avg_cost_per_wash_dkk: m(e.avg_cost_per_wash_dkk),
    avg_cost_per_dry_dkk: m(e.avg_cost_per_dry_dkk),
    favourite_machine: _(n) && $(n.name) ? { name: $(n.name), count: m(n.count) ?? 0 } : null,
    top_programs: (Array.isArray(e.top_programs) ? e.top_programs : []).filter(_).map((r) => ({ program: r.program ?? "", count: m(r.count) ?? 0 })),
    top_temperatures: (Array.isArray(e.top_temperatures) ? e.top_temperatures : []).filter(_).filter((r) => m(r.temperature_c) != null).map((r) => ({ temperature_c: m(r.temperature_c), count: m(r.count) ?? 0 })),
    heatmap: Array.isArray(e.heatmap) ? e.heatmap.map((r) => Array.isArray(r) ? r.map((i) => m(i) ?? 0) : []) : []
  };
}
function us(e) {
  return !_(e) || !$(e.date) ? null : {
    date: $(e.date),
    time: $(e.time),
    kind: e.kind === "payment" ? "payment" : "usage",
    unit_id: m(e.unit_id),
    unit_type: $(e.unit_type),
    unit_label: $(e.unit_label),
    description: $(e.description) ? Ft($(e.description)) : null,
    program: e.program ?? null,
    temperature_c: m(e.temperature_c),
    duration_min: m(e.duration_min),
    amount_dkk: m(e.amount_dkk) ?? 0
  };
}
function ms(e, t) {
  if (!t) return null;
  const s = e?.states?.[t];
  if (!s) return null;
  const n = s.attributes ?? {}, r = Number(s.state), i = m(n.balance_dkk) ?? (Number.isFinite(r) && s.state !== "" ? r : null), a = n.last_payment;
  return {
    available: !we(s.state) && i != null,
    balance: i,
    currency: $(n.currency) ?? "DKK",
    previousPeriod: m(n.previous_period_dkk),
    owed: m(n.owed_dkk),
    lastPayment: _(a) && $(a.date) ? { date: $(a.date), amount_dkk: m(a.amount_dkk) ?? 0, description: $(a.description) ? Ft($(a.description)) : null } : null,
    updatedAt: _e(n.updated_at),
    stats: ds(n.stats),
    recent: (Array.isArray(n.recent) ? n.recent : []).map(us).filter((o) => o !== null)
  };
}
function Bt(e, t) {
  if (e.ends_at) {
    const s = Date.parse(e.ends_at);
    if (!Number.isNaN(s)) return s;
  }
  return e.remaining_seconds != null && t != null ? t + e.remaining_seconds * 1e3 : null;
}
function Vt(e, t, s) {
  const n = Bt(e, s);
  return n == null ? null : Math.max(0, Math.ceil((n - t) / 1e3));
}
function ae(e) {
  const t = Math.max(0, Math.floor(e)), s = Math.floor(t / 3600), n = Math.floor(t % 3600 / 60), r = t % 60, i = (a) => String(a).padStart(2, "0");
  return s > 0 ? `${s}:${i(n)}:${i(r)}` : `${i(n)}:${i(r)}`;
}
class Wt {
  constructor() {
    this.maxRemaining = /* @__PURE__ */ new Map();
  }
  static {
    this.MIN_DROP = 5;
  }
  observe(t, s, n) {
    const r = /* @__PURE__ */ new Set();
    for (const i of t) {
      if (i.state !== "busy") continue;
      const a = Vt(i, s, n);
      if (a == null) continue;
      r.add(i.id);
      const o = this.maxRemaining.get(i.id) ?? 0;
      a > o && this.maxRemaining.set(i.id, a);
    }
    for (const i of [...this.maxRemaining.keys()])
      r.has(i) || this.maxRemaining.delete(i);
  }
  /** Elapsed fraction 0..1, or null when it cannot be determined yet. */
  fraction(t, s) {
    const n = this.maxRemaining.get(t);
    return n == null || s == null || n <= 0 ? null : n - s < Wt.MIN_DROP ? s === 0 ? 1 : null : Math.min(1, Math.max(0, 1 - s / n));
  }
  reset() {
    this.maxRemaining.clear();
  }
}
const fs = ["washer", "dryer", "mangle", "other"], vs = 2 * 60 * 1e3;
function gs(e, t) {
  return e == null ? null : Math.max(0, Math.floor((t - e) / 6e4));
}
function ys(e, t) {
  return e != null && t - e > vs;
}
function $s(e, t) {
  return !e || !e.available ? "unavailable" : ys(e.updatedAt, t) ? "stale" : "live";
}
function bs(e, t) {
  return t && t.length ? e.filter((s) => t.includes(s.type)) : e;
}
function vt(e) {
  return fs.map((t) => {
    const s = e.filter((n) => n.type === t).sort((n, r) => n.id - r.id);
    return {
      type: t,
      machines: s,
      counts: {
        total: s.length,
        free: s.filter((n) => n.state === "free").length,
        busy: s.filter((n) => n.state === "busy").length
      }
    };
  }).filter((t) => t.machines.length > 0);
}
function oe(e, t, s, n) {
  let r = null;
  for (const i of e) {
    if (i.state !== "busy" || n && i.type !== n || Bt(i, s) == null) continue;
    const a = Vt(i, t, s) ?? 0;
    (!r || a < r.seconds) && (r = { machine: i, seconds: a });
  }
  return r;
}
function xs(e, t) {
  const s = Math.ceil(t / 60);
  if (t < 30) return e("lessThanMin");
  if (s < 60) return e("min", { n: s });
  const n = Math.floor(s / 60), r = s % 60;
  return r === 0 ? e("hour", { h: n }) : e("hourMin", { h: n, m: r });
}
function Pt(e, t) {
  return t.type === "other" ? t.name : `${e(`type_${t.type}`)} ${t.id}`;
}
function _s(e, t) {
  const s = /^(washer|dryer|mangle)\s+(\d+)$/i.exec(t.trim());
  return s ? `${e(`type_${s[1].toLowerCase()}`)} ${s[2]}` : t;
}
const S = w`
  :host {
    --ev-washer: #3b8cff;
    --ev-dryer: #ff8a3d;
    --ev-mangle: #9a7cf0;
    --ev-other: #8a94a6;
    --ev-free: #2fb67c;
    --ev-done: #f5a524;
    --ev-error: #e5484d;
    --ev-unknown: var(--disabled-text-color, #9aa0a6);
    --ev-text: var(--primary-text-color, #212121);
    --ev-text-2: var(--secondary-text-color, #727272);
    --ev-line: var(--divider-color, rgba(127, 127, 127, 0.25));
    --ev-surface: color-mix(in srgb, var(--ev-text) 4%, transparent);
    --ev-surface-2: color-mix(in srgb, var(--ev-text) 7%, transparent);
    --ev-radius: 18px;
    --ev-radius-sm: 12px;
  }
`, C = w`
  :host {
    display: block;
    color: var(--ev-text);
    font-family: var(--paper-font-body1_-_font-family, var(--primary-font-family, inherit));
  }
  * {
    box-sizing: border-box;
  }
  svg {
    display: block;
  }
  .panel {
    background: var(--ev-surface);
    border: 1px solid color-mix(in srgb, var(--ev-line) 60%, transparent);
    border-radius: var(--ev-radius);
    padding: 16px;
    min-width: 0;
  }
  .label {
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ev-text-2);
  }
  .panel-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 12px;
  }
  .sub {
    font-size: 0.78rem;
    color: var(--ev-text-2);
  }
  .num {
    font-variant-numeric: tabular-nums;
  }
  .t-washer {
    --accent: var(--ev-washer);
  }
  .t-dryer {
    --accent: var(--ev-dryer);
  }
  .t-mangle {
    --accent: var(--ev-mangle);
  }
  .t-other {
    --accent: var(--ev-other);
  }
`, P = w`
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.001ms !important;
      animation-iteration-count: 1 !important;
      animation-delay: 0s !important;
      transition-duration: 0.001ms !important;
    }
  }
`, b = (e) => g`<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${e}</g></svg>`;
function ws(e) {
  if (e === "mangle")
    return g`<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="4" y="9" width="40" height="27" rx="7"/>
        <path d="M10 36v5M38 36v5"/>
        <circle cx="17" cy="22.5" r="7.5"/>
        <circle cx="31" cy="22.5" r="7.5"/>
        <g class="spin" style="transform-origin:17px 22.5px"><path d="M17 17.5v10M12 22.5h10" stroke-width="1.6" opacity=".75"/></g>
        <g class="spin rev" style="transform-origin:31px 22.5px"><path d="M31 17.5v10M26 22.5h10" stroke-width="1.6" opacity=".75"/></g>
      </g>
    </svg>`;
  const t = e === "dryer" ? g`<g class="spin" style="transform-origin:24px 29px"><circle cx="24" cy="29" r="7.5" stroke-width="1.6" stroke-dasharray="3.5 3.2" opacity=".6"/></g>
        <path class="flame" fill="currentColor" stroke="none" d="M24 21.5c.9 2.8 4 4.3 4 7.7a4 4 0 0 1-8 0c0-1.3.7-2.5 1.5-3.4.3 1.2.9 1.8 1.7 2.1-.4-2.3.2-4.4.8-6.4z"/>` : g`<g class="spin" style="transform-origin:24px 29px">
          <path d="M16.5 29c2.5-3 5-3 7.5 0s5 3 7.5 0"/>
          <circle cx="28" cy="24.5" r="1.6" fill="currentColor" stroke="none"/>
        </g>`;
  return g`<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="7" y="4" width="34" height="40" rx="7"/>
      <path d="M7 13h34"/>
      <circle cx="13" cy="8.5" r=".9" fill="currentColor" stroke="none"/>
      <circle cx="18" cy="8.5" r=".9" fill="currentColor" stroke="none"/>
      <circle cx="24" cy="29" r="11"/>
      ${t}
    </g>
  </svg>`;
}
function U(e) {
  switch (e) {
    case "washer":
      return b(g`<path d="M12 3.5c3.3 4 5.5 6.7 5.5 9.7a5.5 5.5 0 0 1-11 0c0-3 2.2-5.7 5.5-9.7z"/>`);
    case "dryer":
      return b(g`<path d="M12 3c.8 3.2 5.5 5.3 5.5 10.2a5.5 5.5 0 0 1-11 0c0-1.8.9-3.3 2-4.5.4 1.6 1.2 2.4 2.2 2.8C10 9.4 10.8 6.2 12 3z"/>`);
    case "mangle":
      return b(g`<rect x="3" y="6" width="18" height="12" rx="4"/><circle cx="9" cy="12" r="3"/><circle cx="15" cy="12" r="3"/>`);
    default:
      return b(g`<rect x="5" y="3" width="14" height="18" rx="3.5"/><circle cx="12" cy="13" r="4"/>`);
  }
}
const ks = b(
  g`<circle cx="9" cy="14" r="5.5"/><circle cx="17" cy="8" r="3.5"/><circle cx="17.5" cy="17.5" r="2"/><path d="M6.8 12.3a3 3 0 0 1 2.2-1.1" opacity=".7"/>`
), ke = b(g`<path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4.5"/><circle cx="12" cy="17" r=".6" fill="currentColor"/>`), As = b(g`<circle cx="12" cy="12" r="9"/><path d="m8 12.3 2.8 2.8 5.4-5.6"/>`), Ae = b(g`<path d="M4 11 12 4l8 7"/><path d="M6 10v9h12v-9"/><path d="M10 19v-5h4v5"/>`), Me = b(g`<path d="M3.5 9.5 12 4l8.5 5.5z"/><path d="M6 12v6M10 12v6M14 12v6M18 12v6M4 20.5h16"/>`), Ms = b(g`<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>`), Es = b(g`<path d="m12 3.5 2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8z"/>`), Ss = b(g`<path d="M10 14.5V5a2 2 0 0 1 4 0v9.5a4 4 0 1 1-4 0z"/><path d="M12 9v7"/>`), le = b(g`<circle cx="12" cy="12" r="9"/><path d="M9 9.5c.5-1 1.6-1.5 3-1.5 1.8 0 3 .8 3 2s-1.2 1.7-3 2-3 .8-3 2 1.2 2 3 2c1.4 0 2.5-.5 3-1.5"/>`), Cs = b(g`<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="8" r=".6" fill="currentColor"/>`);
var Ps = Object.defineProperty, Ts = Object.getOwnPropertyDescriptor, X = (e, t, s, n) => {
  for (var r = n > 1 ? void 0 : n ? Ts(t, s) : t, i = e.length - 1, a; i >= 0; i--)
    (a = e[i]) && (r = (n ? a(t, s, r) : a(r)) || r);
  return n && r && Ps(t, s, r), r;
};
let D = class extends x {
  constructor() {
    super(...arguments), this.title = "", this.status = "live", this.upstream = null, this.ageMin = null;
  }
  render() {
    const e = this.t;
    let t;
    return this.status === "unavailable" ? t = e("unavailable") : this.status === "stale" && this.ageMin != null ? t = e("stale", { n: this.ageMin }) : t = this.upstream ? e("live", { time: this.upstream }) : e("liveNoTime"), c`
      <div class="head ${this.status}">
        <div class="logo">${ks}</div>
        <div class="text">
          <h2>${this.title || "E-Vaskeri"}</h2>
          <div class="status" role="status">
            <span class="dot"></span><span>${t}</span>
            ${this.status === "stale" && this.upstream ? c`<span>· ${this.upstream}</span>` : p}
          </div>
        </div>
      </div>
    `;
  }
};
D.styles = [
  S,
  C,
  P,
  w`
      :host {
        display: block;
      }
      .head {
        display: flex;
        align-items: center;
        gap: 14px;
        min-width: 0;
      }
      .logo {
        flex: none;
        width: 46px;
        height: 46px;
        border-radius: 15px;
        display: grid;
        place-items: center;
        color: #fff;
        background: linear-gradient(145deg, var(--ev-washer), color-mix(in srgb, var(--ev-washer) 55%, var(--ev-mangle)));
        box-shadow: 0 6px 16px -6px color-mix(in srgb, var(--ev-washer) 70%, transparent);
      }
      .logo svg {
        width: 26px;
        height: 26px;
      }
      .text {
        min-width: 0;
      }
      h2 {
        margin: 0;
        font-size: 1.25rem;
        line-height: 1.2;
        font-weight: 650;
        letter-spacing: -0.01em;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .status {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 3px;
        font-size: 0.82rem;
        color: var(--ev-text-2);
      }
      .dot {
        position: relative;
        flex: none;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--ev-free);
      }
      .live .dot::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: var(--ev-free);
        animation: ping 2.4s cubic-bezier(0, 0, 0.2, 1) infinite;
      }
      .stale .dot {
        background: var(--ev-done);
      }
      .unavailable .dot {
        background: var(--ev-error);
      }
      .unavailable .status {
        color: var(--ev-error);
      }
      @keyframes ping {
        0% {
          transform: scale(1);
          opacity: 0.6;
        }
        80%,
        100% {
          transform: scale(3);
          opacity: 0;
        }
      }
    `
];
X([
  f({ attribute: !1 })
], D.prototype, "t", 2);
X([
  f()
], D.prototype, "title", 2);
X([
  f()
], D.prototype, "status", 2);
X([
  f()
], D.prototype, "upstream", 2);
X([
  f({ type: Number })
], D.prototype, "ageMin", 2);
D = X([
  M("ev-header")
], D);
var Os = Object.defineProperty, Ds = Object.getOwnPropertyDescriptor, ot = (e, t, s, n) => {
  for (var r = n > 1 ? void 0 : n ? Ds(t, s) : t, i = e.length - 1, a; i >= 0; i--)
    (a = e[i]) && (r = (n ? a(t, s, r) : a(r)) || r);
  return n && r && Os(t, s, r), r;
};
const Tt = 34, At = 2 * Math.PI * Tt;
let H = class extends x {
  constructor() {
    super(...arguments), this.machines = [], this.now = Date.now(), this.updatedAt = null;
  }
  ring(e, t, s) {
    const n = s > 0 ? t / s : 0;
    return c`
      <div class="ring t-${e} ${t === 0 ? "zero" : ""}" role="img" aria-label="${ft(this.t, e, !0)}: ${this.t("free_of", { free: t, total: s })}">
        <div class="dial">
          ${g`<svg class="arc" viewBox="0 0 84 84" aria-hidden="true">
            <circle class="track" cx="42" cy="42" r="${Tt}" fill="none" stroke-width="8"/>
            <circle class="fill" cx="42" cy="42" r="${Tt}" fill="none" stroke-width="8" stroke-linecap="round"
              style="--c:${At};--off:${n > 0 ? At * (1 - n) : At}" opacity="${n > 0 ? 1 : 0}"/>
          </svg>`}
          <div class="center"><span class="big num">${t}<small>/${s}</small></span></div>
        </div>
        <div class="name">${U(e)}<span>${ft(this.t, e, !0)}</span></div>
      </div>
    `;
  }
  chip(e, t, s = !1) {
    return c`<div class="chip ${s ? "subtle" : ""} ${t ? `t-${t}` : ""}">${Ms}<span>${e}</span></div>`;
  }
  nextText(e, t) {
    const s = this.t;
    return t < 30 ? s("nextFreeNow", { name: e }) : s("nextFreeChip", { name: e, time: xs(s, t) });
  }
  chips() {
    const e = this.t, t = vt(this.machines), s = [];
    for (const n of t) {
      if (n.counts.free > 0 || n.counts.busy === 0) continue;
      const r = oe(this.machines, this.now, this.updatedAt, n.type);
      r && s.push(
        this.chip(
          c`${e("allBusy", { types: Qe(e, n.type) })} · ${e("nextFree")}:
            <b>${this.nextText(Pt(e, r.machine), r.seconds)}</b>`,
          n.type
        )
      );
    }
    if (!s.length) {
      const n = oe(this.machines, this.now, this.updatedAt);
      n && s.push(
        this.chip(c`${e("nextFinish")}: <b>${this.nextText(Pt(e, n.machine), n.seconds)}</b>`, void 0, !0)
      );
    }
    return s.length ? c`<div class="chips">${s}</div>` : p;
  }
  render() {
    const e = vt(this.machines);
    return e.length ? c`
      <div class="panel" style="padding:0">
        <div class="rings">${e.map((t) => this.ring(t.type, t.counts.free, t.counts.total))}</div>
        ${this.chips()}
      </div>
    ` : p;
  }
};
H.styles = [
  S,
  C,
  P,
  w`
      .rings {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(88px, 1fr));
        gap: 8px;
        padding: 14px 10px 12px;
      }
      .ring {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }
      .dial {
        position: relative;
        width: 84px;
        height: 84px;
      }
      svg.arc {
        width: 84px;
        height: 84px;
        transform: rotate(-90deg);
      }
      .track {
        stroke: color-mix(in srgb, var(--accent) 16%, transparent);
      }
      .fill {
        stroke: var(--accent);
        stroke-dasharray: var(--c);
        stroke-dashoffset: var(--off);
        animation: ring-in 1.1s cubic-bezier(0.22, 1, 0.36, 1) both;
        transition: stroke-dashoffset 0.8s cubic-bezier(0.22, 1, 0.36, 1);
        filter: drop-shadow(0 0 4px color-mix(in srgb, var(--accent) 45%, transparent));
      }
      @keyframes ring-in {
        from {
          stroke-dashoffset: var(--c);
        }
      }
      .center {
        position: absolute;
        inset: 0;
        display: grid;
        place-content: center;
        text-align: center;
        line-height: 1;
      }
      .big {
        font-size: 1.7rem;
        font-weight: 700;
        letter-spacing: -0.02em;
      }
      .big small {
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--ev-text-2);
        letter-spacing: 0;
      }
      .zero .big {
        color: var(--ev-text-2);
      }
      .name {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.82rem;
        font-weight: 550;
        color: var(--ev-text);
        text-align: center;
        justify-content: center;
        overflow-wrap: anywhere;
      }
      @container (max-width: 480px) {
        .name {
          font-size: 0.74rem;
        }
        .name svg {
          display: none;
        }
      }
      .name svg {
        width: 16px;
        height: 16px;
        color: var(--accent);
        flex: none;
      }
      .chips {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 0 12px 14px;
      }
      .chip {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 9px 14px;
        border-radius: 999px;
        font-size: 0.84rem;
        background: color-mix(in srgb, var(--accent, var(--ev-text-2)) 13%, transparent);
        border: 1px solid color-mix(in srgb, var(--accent, var(--ev-text-2)) 28%, transparent);
        line-height: 1.3;
      }
      .chip.subtle {
        --accent: var(--ev-text-2);
        background: var(--ev-surface);
        border-color: transparent;
        color: var(--ev-text-2);
      }
      .chip svg {
        width: 18px;
        height: 18px;
        flex: none;
        color: var(--accent);
      }
      .chip b {
        font-weight: 650;
        color: var(--ev-text);
      }
    `
];
ot([
  f({ attribute: !1 })
], H.prototype, "t", 2);
ot([
  f({ attribute: !1 })
], H.prototype, "machines", 2);
ot([
  f({ type: Number })
], H.prototype, "now", 2);
ot([
  f({ attribute: !1 })
], H.prototype, "updatedAt", 2);
H = ot([
  M("ev-rings")
], H);
const zs = 128, Yt = 10;
function Ns(e, t = zs, s = Yt) {
  return e > 0 ? Math.max(1, Math.floor((e + s) / (t + s))) : 3;
}
function js(e, t, s = Yt) {
  return Math.floor((e - s * (t - 1)) / t);
}
function Rs(e, t) {
  if (e <= 0) return 1;
  let s = Math.min(e, t), n = Math.ceil(e / s), r = n * s - e;
  for (let i = Math.min(e, t); i >= 1; i--) {
    const a = Math.ceil(e / i), o = a * i - e;
    (a < n || a === n && o < r) && (s = i, n = a, r = o);
  }
  return s;
}
var Us = Object.defineProperty, Ls = Object.getOwnPropertyDescriptor, B = (e, t, s, n) => {
  for (var r = n > 1 ? void 0 : n ? Ls(t, s) : t, i = e.length - 1, a; i >= 0; i--)
    (a = e[i]) && (r = (n ? a(t, s, r) : a(r)) || r);
  return n && r && Us(t, s, r), r;
};
const Ot = 34, dt = 2 * Math.PI * Ot;
let E = class extends x {
  constructor() {
    super(...arguments), this.displayName = "", this.remaining = null, this.fraction = null, this.finishTime = null, this.open = () => {
      const e = this.machine.entity_id;
      e && this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: e }, bubbles: !0, composed: !0 }));
    }, this.onKey = (e) => {
      (e.key === "Enter" || e.key === " ") && (e.preventDefault(), this.open());
    };
  }
  get clickable() {
    return !!this.machine.entity_id;
  }
  a11yLabel() {
    const e = this.t, t = this.machine, s = [this.displayName, Je(e, t.state)];
    return t.state === "busy" && (this.remaining === 0 ? s.push(e("almostDone")) : this.remaining != null && s.push(ae(this.remaining)), this.finishTime && s.push(e("finishAt", { time: this.finishTime }))), s.join(", ");
  }
  dial(e) {
    const t = this.machine, s = t.state === "done", n = !s && this.fraction == null, r = s ? 0 : dt * (1 - (this.fraction ?? 0));
    return c`
      <div class="dial">
        <svg class="ring" viewBox="0 0 80 80" aria-hidden="true">
          <circle class="track" cx="40" cy="40" r="${Ot}" fill="none" stroke-width="5"></circle>
          ${e ? c`<circle class="prog ${n ? "indet" : ""}" cx="40" cy="40" r="${Ot}" fill="none" stroke-width="5"
                stroke-linecap="round" style="${n ? "" : `stroke-dashoffset:${r}`}"></circle>` : p}
        </svg>
        <div class="icon">${ws(t.type)}</div>
        ${t.state === "error" ? c`<span class="overlay">${ke}</span>` : p}
        ${t.state === "done" ? c`<span class="overlay ok">${As}</span>` : p}
      </div>
    `;
  }
  name() {
    const e = /^(.*?)\s+(\d+)$/.exec(this.displayName);
    return e ? c`<div class="name" title="${this.displayName}"><span class="ty">${e[1]}</span><span class="id">${e[2]}</span></div>` : c`<div class="name"><span class="ty">${this.displayName}</span></div>`;
  }
  body() {
    const e = this.t, t = this.machine;
    switch (t.state) {
      case "busy": {
        const s = [t.program, t.step].filter(Boolean).join(" · "), n = this.remaining === 0;
        return c`
          ${this.dial(!0)}
          <div class="count ${n ? "soon" : ""}">${n ? e("almostDone") : this.remaining != null ? ae(this.remaining) : e("busy")}</div>
          ${s ? c`<div class="prog-line" title="${s}">${s}</div>` : p}
          ${this.finishTime && !n ? c`<div class="until">${e("finishAt", { time: this.finishTime })}</div>` : p}
        `;
      }
      case "done":
        return c`${this.dial(!0)}<div class="status">${e("done")}</div>
          ${t.program ? c`<div class="prog-line">${t.program}</div>` : p}`;
      case "error":
        return c`${this.dial(!1)}<div class="status">${e("error")}</div>
          ${t.raw_status ? c`<div class="prog-line">${t.raw_status}</div>` : p}`;
      case "free":
        return c`${this.dial(!1)}<div class="status"><span class="pip"></span>${e("free")}</div>`;
      default:
        return c`${this.dial(!1)}<div class="status">${e("unknown")}</div>`;
    }
  }
  render() {
    const e = this.machine;
    if (!e) return p;
    const t = this.clickable;
    return c`
      <div
        class="tile t-${e.type} ${e.state} ${t ? "" : "nobtn"}"
        role="${t ? "button" : "group"}"
        tabindex="${t ? 0 : -1}"
        aria-label="${this.a11yLabel()}"
        @click=${this.open}
        @keydown=${this.onKey}
      >
        ${this.name()}
        ${this.body()}
      </div>
    `;
  }
};
E.styles = [
  S,
  C,
  P,
  w`
      :host {
        display: block;
      }
      .tile {
        --state: var(--ev-unknown);
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        height: 100%;
        min-height: 156px;
        padding: 12px 8px;
        border-radius: var(--ev-radius);
        text-align: center;
        cursor: pointer;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
        color: var(--ev-text);
        background:
          radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, var(--accent) 10%, transparent), transparent 70%),
          var(--ev-surface);
        border: 1px solid color-mix(in srgb, var(--ev-line) 70%, transparent);
        box-shadow: inset 0 1px 0 color-mix(in srgb, #fff 18%, transparent);
        transition:
          transform 0.15s ease,
          border-color 0.25s ease,
          box-shadow 0.25s ease,
          background 0.25s ease;
        outline: none;
      }
      .tile:hover {
        transform: translateY(-2px);
        background:
          radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 70%),
          var(--ev-surface-2);
      }
      .tile:active {
        transform: scale(0.98);
      }
      .tile:focus-visible {
        box-shadow: 0 0 0 2px var(--primary-color, var(--accent));
      }
      .tile.nobtn {
        cursor: default;
      }
      .name {
        display: flex;
        justify-content: center;
        gap: 0.3em;
        max-width: 100%;
        font-size: 0.76rem;
        font-weight: 600;
        line-height: 1.2;
        color: var(--ev-text-2);
      }
      .name .ty {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .name .id {
        flex: none;
        color: var(--ev-text);
      }
      .dial {
        position: relative;
        width: 76px;
        height: 76px;
        margin: 2px 0;
        flex: none;
      }
      .dial .icon {
        position: absolute;
        inset: 14px;
        color: var(--ev-unknown);
        transition: color 0.3s;
      }
      .icon svg {
        width: 100%;
        height: 100%;
        overflow: visible;
      }
      svg.ring {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        transform: rotate(-90deg);
        overflow: visible;
      }
      .ring .track {
        stroke: color-mix(in srgb, var(--state) 14%, transparent);
      }
      .ring .prog {
        stroke: var(--state);
        stroke-dasharray: ${dt};
        transition: stroke-dashoffset 1s linear;
        filter: drop-shadow(0 0 3px color-mix(in srgb, var(--state) 50%, transparent));
      }
      .ring .prog.indet {
        stroke-dasharray: ${dt * 0.26} ${dt};
        transform-origin: 40px 40px;
        animation: orbit 1.8s linear infinite;
        opacity: 0.8;
      }
      .status {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.9rem;
        font-weight: 600;
        line-height: 1.25;
      }
      .status .pip {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--state);
        flex: none;
      }
      .status svg {
        width: 16px;
        height: 16px;
        flex: none;
      }

      /* free */
      .free {
        --state: var(--ev-free);
      }
      .free .status {
        color: color-mix(in srgb, var(--ev-free) 85%, var(--ev-text));
      }
      .free .dial .icon {
        color: color-mix(in srgb, var(--ev-text-2) 75%, transparent);
      }
      .free .ring .track {
        stroke: color-mix(in srgb, var(--ev-text) 7%, transparent);
      }
      .free .status .pip {
        opacity: 0.8;
      }

      /* busy */
      .busy {
        --state: var(--accent);
        border-color: color-mix(in srgb, var(--accent) 35%, var(--ev-line));
      }
      .busy .dial .icon {
        color: var(--accent);
      }
      .busy .spin {
        animation: spin 3.4s linear infinite;
      }
      .busy .spin.rev {
        animation-direction: reverse;
      }
      .busy .flame {
        transform-box: fill-box;
        transform-origin: 50% 100%;
        animation: flicker 1.3s ease-in-out infinite;
      }
      .count {
        font-size: 1.28rem;
        font-weight: 700;
        letter-spacing: -0.01em;
        line-height: 1.15;
        font-variant-numeric: tabular-nums;
      }
      .count.soon {
        font-size: 0.98rem;
        color: var(--accent);
      }
      .prog-line {
        font-size: 0.74rem;
        line-height: 1.3;
        color: var(--ev-text-2);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        max-width: 100%;
        overflow-wrap: anywhere;
      }
      .until {
        font-size: 0.74rem;
        font-weight: 600;
        color: var(--accent);
        font-variant-numeric: tabular-nums;
        text-wrap: balance;
      }

      /* done */
      .done {
        --state: var(--ev-done);
        border-color: color-mix(in srgb, var(--ev-done) 60%, transparent);
        animation: pulse 2.2s ease-in-out infinite;
      }
      .done .dial .icon {
        color: var(--ev-done);
      }
      .done .status {
        color: color-mix(in srgb, var(--ev-done) 80%, var(--ev-text));
        flex-direction: column;
        gap: 2px;
      }
      .done .status svg {
        width: 22px;
        height: 22px;
      }

      /* error */
      .error {
        --state: var(--ev-error);
        border-color: color-mix(in srgb, var(--ev-error) 65%, transparent);
        box-shadow: 0 0 0 1px color-mix(in srgb, var(--ev-error) 25%, transparent);
      }
      .error .dial .icon {
        color: var(--ev-error);
      }
      .error .status {
        color: var(--ev-error);
      }
      .overlay {
        position: absolute;
        right: -4px;
        bottom: -2px;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        color: #fff;
        background: var(--ev-error);
        border: 2px solid var(--card-background-color, #fff);
      }
      .overlay svg {
        width: 14px;
        height: 14px;
      }
      .overlay.ok {
        background: var(--ev-done);
      }

      .unknown .status {
        color: var(--ev-text-2);
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      @keyframes orbit {
        to {
          transform: rotate(360deg);
        }
      }
      @keyframes flicker {
        0%,
        100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.12, 0.94);
        }
      }
      @keyframes pulse {
        0%,
        100% {
          box-shadow: 0 0 0 0 color-mix(in srgb, var(--ev-done) 0%, transparent);
        }
        50% {
          box-shadow: 0 0 0 4px color-mix(in srgb, var(--ev-done) 28%, transparent);
        }
      }
    `
];
B([
  f({ attribute: !1 })
], E.prototype, "t", 2);
B([
  f({ attribute: !1 })
], E.prototype, "machine", 2);
B([
  f()
], E.prototype, "displayName", 2);
B([
  f({ attribute: !1 })
], E.prototype, "remaining", 2);
B([
  f({ attribute: !1 })
], E.prototype, "fraction", 2);
B([
  f()
], E.prototype, "finishTime", 2);
E = B([
  M("ev-machine-tile")
], E);
var Hs = Object.defineProperty, Is = Object.getOwnPropertyDescriptor, N = (e, t, s, n) => {
  for (var r = n > 1 ? void 0 : n ? Is(t, s) : t, i = e.length - 1, a; i >= 0; i--)
    (a = e[i]) && (r = (n ? a(t, s, r) : a(r)) || r);
  return n && r && Hs(t, s, r), r;
};
let A = class extends x {
  constructor() {
    super(...arguments), this.machines = [], this.now = Date.now(), this.updatedAt = null, this.width = 0;
  }
  connectedCallback() {
    super.connectedCallback(), typeof ResizeObserver < "u" && (this.observer = new ResizeObserver((e) => {
      const t = Math.floor(e[0]?.contentRect.width ?? 0);
      t > 0 && t !== this.width && (this.width = t);
    }), this.observer.observe(this));
  }
  disconnectedCallback() {
    this.observer?.disconnect(), super.disconnectedCallback();
  }
  tile(e) {
    const t = e.state === "busy" ? Vt(e, this.now, this.updatedAt) : null, s = e.state === "busy" ? Bt(e, this.updatedAt) : null;
    return c`<ev-machine-tile
      .t=${this.t}
      .machine=${e}
      .displayName=${Pt(this.t, e)}
      .remaining=${t}
      .fraction=${this.tracker.fraction(e.id, t)}
      .finishTime=${s != null ? ss(this.fmt, s) : null}
    ></ev-machine-tile>`;
  }
  render() {
    const e = vt(this.machines);
    if (!e.length) return p;
    const t = Ns(this.width), s = js(this.width, t);
    return c`${e.map((n) => {
      const r = Rs(n.machines.length, t), i = this.width > 0 ? `grid-template-columns:repeat(${r},minmax(0,${s}px))` : "";
      return c`
        <section class="group t-${n.type}" aria-label="${ft(this.t, n.type, !0)}">
          <div class="group-head">
            ${U(n.type)}<span class="label">${ft(this.t, n.type, !0)}</span>
            <span class="count">${this.t("free_of", { free: n.counts.free, total: n.counts.total })}</span>
          </div>
          <div class="grid" style="${i}">${n.machines.map((a) => this.tile(a))}</div>
        </section>
      `;
    })}`;
  }
};
A.styles = [
  S,
  C,
  P,
  w`
      .group + .group {
        margin-top: 18px;
      }
      .group-head {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 4px 10px;
        color: var(--ev-text-2);
      }
      .group-head svg {
        width: 16px;
        height: 16px;
        color: var(--accent);
      }
      .group-head .count {
        margin-left: auto;
        font-size: 0.78rem;
        font-variant-numeric: tabular-nums;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(128px, 1fr));
        gap: ${Yt}px;
        justify-content: start;
      }
    `
];
N([
  f({ attribute: !1 })
], A.prototype, "t", 2);
N([
  f({ attribute: !1 })
], A.prototype, "fmt", 2);
N([
  f({ attribute: !1 })
], A.prototype, "machines", 2);
N([
  f({ type: Number })
], A.prototype, "now", 2);
N([
  f({ attribute: !1 })
], A.prototype, "updatedAt", 2);
N([
  f({ attribute: !1 })
], A.prototype, "tracker", 2);
N([
  F()
], A.prototype, "width", 2);
A = N([
  M("ev-machines")
], A);
function Fs(e) {
  if (e.length === 0) return "";
  if (e.length === 1) return `M${e[0].x},${e[0].y}`;
  const t = (n) => Math.round(n * 100) / 100;
  let s = `M${t(e[0].x)},${t(e[0].y)}`;
  for (let n = 0; n < e.length - 1; n++) {
    const r = e[n - 1] ?? e[n], i = e[n], a = e[n + 1], o = e[n + 2] ?? a, l = { x: i.x + (a.x - r.x) / 6, y: i.y + (a.y - r.y) / 6 }, d = { x: a.x - (o.x - i.x) / 6, y: a.y - (o.y - i.y) / 6 }, u = Math.min(i.y, a.y), h = Math.max(i.y, a.y), v = (y) => t(Math.min(h, Math.max(u, y)));
    s += `C${t(l.x)},${v(l.y)} ${t(d.x)},${v(d.y)} ${t(a.x)},${t(a.y)}`;
  }
  return s;
}
function Bs(e, t, s, n = 4) {
  if (e.length === 0) return { line: "", area: "", last: null };
  const r = Math.min(...e), i = Math.max(...e), a = i - r || 1, o = e.length > 1 ? (t - n * 2) / (e.length - 1) : 0, l = e.map((v, y) => ({
    x: e.length > 1 ? n + y * o : t / 2,
    y: i === r ? s / 2 : s - n - (v - r) / a * (s - n * 2)
  })), d = Fs(l), u = l[l.length - 1], h = `${d}L${u.x},${s}L${l[0].x},${s}Z`;
  return { line: d, area: h, last: u };
}
function Vs(e) {
  if (e <= 0) return 10;
  const t = 10 ** Math.floor(Math.log10(e)), s = e / t;
  return (s <= 1 ? 1 : s <= 2 ? 2 : s <= 2.5 ? 2.5 : s <= 5 ? 5 : 10) * t;
}
function Ws(e, t, s, n = 8, r = 22) {
  const i = e.slice(-12), a = Vs(Math.max(0, ...i.map((y) => y.washer_dkk + y.dryer_dkk))), o = s - n - r, l = n + o, d = i.length ? t / i.length : t, u = Math.max(4, Math.min(26, d * 0.62)), h = i.map((y, T) => {
    const V = y.washer_dkk / a * o, wt = y.dryer_dkk / a * o;
    return {
      month: y.month,
      x: d * T + (d - u) / 2,
      width: u,
      washerY: l - V,
      washerH: V,
      dryerY: l - V - wt,
      dryerH: wt,
      totalY: l - V - wt,
      stat: y
    };
  }), v = [0.5, 1].map((y) => ({ y: l - y * o, value: a * y }));
  return { bars: h, max: a, baseline: l, gridLines: v };
}
function Ys(e, t, s, n = 3) {
  const r = e + t;
  if (r <= 0) return [];
  const i = [
    ["washer", e],
    ["dryer", t]
  ];
  let a = 0;
  return i.filter(([, o]) => o > 0).map(([o, l], d, u) => {
    const h = l / r, v = u.length > 1 ? n : 0, y = { key: o, fraction: h, dash: Math.max(0, h * s - v), offset: -a };
    return a += h * s, y;
  });
}
function Zs(e) {
  return e.length ? [...e].sort((t, s) => s.count - t.count)[0].temperature_c : null;
}
var qs = Object.defineProperty, Ks = Object.getOwnPropertyDescriptor, bt = (e, t, s, n) => {
  for (var r = n > 1 ? void 0 : n ? Ks(t, s) : t, i = e.length - 1, a; i >= 0; i--)
    (a = e[i]) && (r = (n ? a(t, s, r) : a(r)) || r);
  return n && r && qs(t, s, r), r;
};
const ce = 160, he = 56;
let q = class extends x {
  sparkline() {
    const e = this.account.stats?.months.slice(-12) ?? [];
    if (e.length < 2) return p;
    const t = Bs(e.map((i) => i.total_dkk), ce, he), s = e[0].month, n = e[e.length - 1].month, r = (i) => be(this.fmt, i);
    return c`
      <div class="spark" role="img" aria-label="${this.t("monthlySpend")}">
        ${g`<svg viewBox="0 0 ${ce} ${he}" preserveAspectRatio="none">
          <defs><linearGradient id="ev-spark-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="var(--primary-color, #3b8cff)" stop-opacity=".28"/>
            <stop offset="1" stop-color="var(--primary-color, #3b8cff)" stop-opacity="0"/>
          </linearGradient></defs>
          <path class="area" d="${t.area}" fill="url(#ev-spark-fill)"/>
          <path class="line" d="${t.line}"/>
        </svg>`}
        <div class="cap"><span>${r(s)}</span><span>${this.t("monthlySpend")}</span><span>${r(n)}</span></div>
      </div>
    `;
  }
  render() {
    const { t: e, fmt: t, account: s } = this, n = s.balance ?? 0, r = Math.round(n * 100) / 100, i = r < 0 ? e("owed") : r > 0 ? e("credit") : e("settled"), a = s.previousPeriod != null ? Math.round((n - s.previousPeriod) * 100) / 100 : null, o = s.lastPayment, l = o?.description ? /husleje|rent/i.test(o.description) : !1;
    return c`
      <section class="panel" aria-label="${e("balance")}">
        <div class="panel-head"><span class="label">${e("balance")}</span></div>
        <div class="top">
          <div>
            <div class="amount ${r > 0 ? "pos" : ""}">${k(t, n)}</div>
            <div class="caption">${i}</div>
            ${a != null && a !== 0 ? c`<div class="delta ${a > 0 ? "up" : ""}">
                  <span aria-hidden="true">${a > 0 ? "▲" : "▼"}</span>
                  ${k(t, a, "never")} <small>${e("vsPrevious")}</small>
                </div>` : p}
          </div>
          ${this.sparkline()}
        </div>
        ${o ? c`<div class="payment" title="${o.description ?? ""}">
              ${l ? Ae : Me}
              <span class="txt">${e("lastPayment")} <b>${$e(t, o.date)}</b> · <b>${k(t, o.amount_dkk, "never")}</b>${o.description ? c` · ${o.description}` : p}</span>
            </div>` : p}
      </section>
    `;
  }
};
q.styles = [
  S,
  C,
  P,
  w`
      .top {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
      }
      .amount {
        font-size: 2.2rem;
        font-size: clamp(1.9rem, 9cqi, 2.6rem);
        font-weight: 700;
        letter-spacing: -0.03em;
        line-height: 1.05;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }
      .amount.pos {
        color: var(--ev-free);
      }
      .caption {
        margin-top: 4px;
        font-size: 0.85rem;
        color: var(--ev-text-2);
      }
      .delta {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        margin-top: 10px;
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 0.78rem;
        font-weight: 600;
        background: var(--ev-surface-2);
        color: var(--ev-text-2);
        font-variant-numeric: tabular-nums;
      }
      .delta.up {
        color: var(--ev-free);
        background: color-mix(in srgb, var(--ev-free) 14%, transparent);
      }
      .delta small {
        font-weight: 500;
        opacity: 0.85;
      }
      .spark {
        flex: 1 1 140px;
        max-width: 240px;
        min-width: 120px;
        margin-left: auto;
      }
      .spark svg {
        width: 100%;
        height: 64px;
        overflow: visible;
      }
      .spark .cap {
        display: flex;
        justify-content: space-between;
        font-size: 0.7rem;
        color: var(--ev-text-2);
        margin-top: 4px;
      }
      .spark .line {
        fill: none;
        stroke: var(--primary-color, var(--ev-washer));
        stroke-width: 2.4;
        stroke-linecap: round;
        stroke-linejoin: round;
        vector-effect: non-scaling-stroke;
        stroke-dasharray: 600;
        stroke-dashoffset: 0;
        animation: draw 1.4s ease-out both;
      }
      .spark circle {
        fill: var(--card-background-color, #fff);
        stroke: var(--primary-color, var(--ev-washer));
        stroke-width: 2.4;
      }
      @keyframes draw {
        from {
          stroke-dashoffset: 600;
        }
      }
      .payment {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 14px;
        padding-top: 12px;
        border-top: 1px dashed color-mix(in srgb, var(--ev-line) 80%, transparent);
        font-size: 0.82rem;
        color: var(--ev-text-2);
        min-width: 0;
      }
      .payment svg {
        width: 18px;
        height: 18px;
        flex: none;
        color: var(--ev-free);
      }
      .payment .txt {
        min-width: 0;
        line-height: 1.4;
      }
      .payment b {
        color: var(--ev-text);
        font-weight: 600;
      }
    `
];
bt([
  f({ attribute: !1 })
], q.prototype, "t", 2);
bt([
  f({ attribute: !1 })
], q.prototype, "fmt", 2);
bt([
  f({ attribute: !1 })
], q.prototype, "account", 2);
q = bt([
  M("ev-balance")
], q);
var Gs = Object.defineProperty, Xs = Object.getOwnPropertyDescriptor, J = (e, t, s, n) => {
  for (var r = n > 1 ? void 0 : n ? Xs(t, s) : t, i = e.length - 1, a; i >= 0; i--)
    (a = e[i]) && (r = (n ? a(t, s, r) : a(r)) || r);
  return n && r && Gs(t, s, r), r;
};
const tt = 176, Dt = 38, zt = 2 * Math.PI * Dt;
let z = class extends x {
  constructor() {
    super(...arguments), this.t = it("en"), this.width = 320, this.active = null;
  }
  connectedCallback() {
    super.connectedCallback(), typeof ResizeObserver < "u" && (this.observer = new ResizeObserver((e) => {
      const t = Math.round(e[0]?.contentRect.width ?? 0);
      t > 0 && Math.abs(t - this.width) > 1 && (this.width = t);
    }), this.observer.observe(this));
  }
  disconnectedCallback() {
    this.observer?.disconnect(), super.disconnectedCallback();
  }
  chartWidth() {
    const e = Math.max(220, this.width - 34);
    return e >= 560 ? Math.round(e - 224 - 24) : e;
  }
  select(e, t) {
    t && t.type === "pointerleave" && t.pointerType !== "mouse" || (this.active = e);
  }
  chart() {
    const e = this.account.stats?.months ?? [];
    if (!e.length) return p;
    const t = this.chartWidth(), { bars: s, gridLines: n, baseline: r } = Ws(e, t, tt), i = this.t, a = this.fmt, o = s.length ? t / s.length : t, l = o < 30, d = this.active != null ? s[this.active] : null, u = d ? Math.min(Math.max(d.x + d.width / 2, 70), t - 70) : 0;
    return c`
      <div class="chart" style="max-width:${t}px;flex-basis:${t}px">
        <svg viewBox="0 0 ${t} ${tt}" role="img" aria-label="${i("spend")} · ${i("last12")}"
          class="${d ? "dim" : ""}" @pointerleave=${(h) => this.select(null, h)}>
          ${n.map((h) => g`<line class="grid-line" x1="0" x2="${t}" y1="${h.y}" y2="${h.y}"/>`)}
          ${s.map((h, v) => {
      const y = v === s.length - 1, T = !l || (s.length - 1 - v) % 2 === 0;
      return g`
              ${this.active === v ? g`<rect class="sel" x="${v * o}" y="0" width="${o}" height="${r}" rx="8"/>` : p}
              <g class="bar ${this.active === v ? "on" : ""}" style="--i:${v}">
                ${h.dryerH > 0.5 ? g`<rect class="dryer" x="${h.x}" y="${h.dryerY}" width="${h.width}" height="${h.dryerH + 5}" rx="4"/>` : p}
                ${h.washerH > 0.5 ? g`<rect class="washer" x="${h.x}" y="${h.washerY}" width="${h.width}" height="${h.washerH}" rx="4"/>` : p}
              </g>
              ${T ? g`<text class="mlabel ${y ? "cur" : ""}" x="${v * o + o / 2}" y="${tt - 5}">${be(a, h.month)}</text>` : p}
              <rect class="hit" x="${v * o}" y="0" width="${o}" height="${tt}"
                @pointerenter=${(V) => V.pointerType === "mouse" && this.select(v)}
                @click=${() => this.select(this.active === v ? null : v)}/>`;
    })}
          ${n.map((h) => g`<text class="axis" x="0" y="${h.y - 4}">${pt(a, h.value, 0)} kr</text>`)}
        </svg>
        ${d ? c`<div class="tip" style="left:${u}px" role="status">
              <div class="m">${rs(a, d.month)}</div>
              <div class="r"><span><i style="background:var(--ev-washer)"></i>${i("washing")}</span><span>${k(a, d.stat.washer_dkk, "never")}</span></div>
              <div class="r"><span><i style="background:var(--ev-dryer)"></i>${i("drying")}</span><span>${k(a, d.stat.dryer_dkk, "never")}</span></div>
              <div class="r tot"><span>${i("total")}</span><span>${k(a, d.stat.total_dkk, "never")}</span></div>
            </div>` : p}
      </div>
    `;
  }
  donut() {
    const e = this.account.stats?.totals;
    if (!e) return p;
    const { t, fmt: s } = this, n = Ys(e.washer_dkk, e.dryer_dkk, zt), r = e.washer_dkk + e.dryer_dkk;
    return n.length ? c`
      <div class="donut">
        <div class="ring" role="img" aria-label="${t("washing")} ${ct(s, e.washer_dkk / r)}, ${t("drying")} ${ct(s, e.dryer_dkk / r)}">
          ${g`<svg viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="${Dt}" fill="none" stroke="var(--ev-line)" stroke-width="12" opacity=".35"/>
            ${n.map((i) => g`<circle class="seg ${i.key}" cx="50" cy="50" r="${Dt}" stroke-dasharray="${i.dash} ${zt}" stroke-dashoffset="${i.offset}"/>`)}
          </svg>`}
          <div class="mid"><b>${k(s, r, "never", 0)}</b><span>${t("total")}</span></div>
        </div>
        <div class="legend">
          <div><span class="k washer-c">${U("washer")}<span style="color:var(--ev-text-2)">${t("washing")}</span></span><b>${ct(s, e.washer_dkk / r)}</b></div>
          <div><span class="k dryer-c">${U("dryer")}<span style="color:var(--ev-text-2)">${t("drying")}</span></span><b>${ct(s, e.dryer_dkk / r)}</b></div>
        </div>
      </div>
    ` : p;
  }
  kpis() {
    const e = this.account.stats;
    if (!e) return p;
    const { t, fmt: s } = this, n = Zs(e.top_temperatures), r = [];
    return e.avg_cost_per_wash_dkk != null && r.push({ icon: U("washer"), tint: "var(--ev-washer)", value: k(s, e.avg_cost_per_wash_dkk), label: t("avgWash") }), e.avg_cost_per_dry_dkk != null && r.push({ icon: U("dryer"), tint: "var(--ev-dryer)", value: k(s, e.avg_cost_per_dry_dkk), label: t("avgDry") }), e.totals && (r.push({ icon: le, tint: "var(--ev-washer)", value: pt(s, e.totals.washes, 0), label: t("washes") }), r.push({ icon: le, tint: "var(--ev-dryer)", value: pt(s, e.totals.dries, 0), label: t("dries") })), e.favourite_machine && r.push({
      icon: Es,
      tint: "var(--ev-done)",
      value: _s(t, e.favourite_machine.name),
      label: `${t("favourite")} · ${t("uses", { n: e.favourite_machine.count })}`
    }), n != null && r.push({ icon: Ss, tint: "var(--ev-error)", value: `${n}°C`, label: t("topTemp") }), c`<div class="kpis">${r.map(
      (i) => c`<div class="kpi" style="--tint:${i.tint}"><div class="ic">${i.icon}</div><div><div class="v">${i.value}</div><div class="l">${i.label}</div></div></div>`
    )}</div>`;
  }
  render() {
    return this.account?.stats ? c`
      <section class="panel" aria-label="${this.t("spend")}">
        <div class="panel-head"><span class="label">${this.t("spend")}</span><span class="sub">${this.t("last12")}</span></div>
        <div class="body">${this.chart()}${this.donut()}</div>
        ${this.kpis()}
      </section>
    ` : p;
  }
};
z.styles = [
  S,
  C,
  P,
  w`
      .body {
        display: flex;
        flex-wrap: wrap;
        gap: 18px 24px;
        align-items: center;
      }
      .chart {
        position: relative;
        flex: 1 1 280px;
        min-width: 0;
      }
      .chart svg {
        width: 100%;
        height: ${tt}px;
        overflow: visible;
        touch-action: manipulation;
      }
      .grid-line {
        stroke: color-mix(in srgb, var(--ev-line) 70%, transparent);
        stroke-dasharray: 3 4;
      }
      .axis {
        font-size: 10px;
        fill: var(--ev-text-2);
        paint-order: stroke;
        stroke: var(--card-background-color, #fff);
        stroke-width: 3px;
        stroke-linejoin: round;
        font-variant-numeric: tabular-nums;
      }
      .mlabel {
        font-size: 10.5px;
        fill: var(--ev-text-2);
        text-anchor: middle;
        text-transform: capitalize;
      }
      .mlabel.cur {
        fill: var(--ev-text);
        font-weight: 650;
      }
      .bar {
        transform-box: fill-box;
        transform-origin: 50% 100%;
        animation: grow 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
        animation-delay: calc(var(--i) * 35ms);
        transition: opacity 0.2s;
      }
      .washer {
        fill: var(--ev-washer);
      }
      .dryer {
        fill: var(--ev-dryer);
      }
      .dim .bar:not(.on) {
        opacity: 0.45;
      }
      .hit {
        fill: transparent;
        cursor: pointer;
      }
      .sel {
        fill: color-mix(in srgb, var(--ev-text) 6%, transparent);
      }
      @keyframes grow {
        from {
          transform: scaleY(0);
          opacity: 0;
        }
      }
      .tip {
        position: absolute;
        top: 0;
        z-index: 2;
        transform: translate(-50%, -4px);
        pointer-events: none;
        padding: 8px 11px;
        border-radius: 12px;
        font-size: 0.76rem;
        line-height: 1.45;
        white-space: nowrap;
        color: var(--ev-text);
        background: var(--card-background-color, #fff);
        border: 1px solid var(--ev-line);
        box-shadow: 0 8px 24px -8px rgba(0, 0, 0, 0.35);
      }
      .tip .m {
        font-weight: 650;
        text-transform: capitalize;
        margin-bottom: 2px;
      }
      .tip .r {
        display: flex;
        align-items: center;
        gap: 6px;
        justify-content: space-between;
        font-variant-numeric: tabular-nums;
      }
      .tip i {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        display: inline-block;
      }
      .tip .r span:first-child {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--ev-text-2);
        margin-right: 12px;
      }
      .tip .tot {
        margin-top: 2px;
        padding-top: 3px;
        border-top: 1px solid var(--ev-line);
        font-weight: 650;
      }
      .donut {
        flex: 0 1 200px;
        display: flex;
        align-items: center;
        gap: 16px;
        margin: 0 auto;
      }
      .donut .ring {
        position: relative;
        width: 124px;
        height: 124px;
        flex: none;
      }
      .donut svg {
        width: 100%;
        height: 100%;
        transform: rotate(-90deg);
      }
      .seg {
        fill: none;
        stroke-width: 12;
        stroke-linecap: butt;
        animation: seg-in 1s cubic-bezier(0.22, 1, 0.36, 1) both;
      }
      .seg.washer {
        stroke: var(--ev-washer);
      }
      .seg.dryer {
        stroke: var(--ev-dryer);
      }
      @keyframes seg-in {
        from {
          stroke-dasharray: 0 ${zt};
        }
      }
      .donut .mid {
        position: absolute;
        inset: 0;
        display: grid;
        place-content: center;
        text-align: center;
        line-height: 1.15;
      }
      .mid b {
        font-size: 0.84rem;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
      }
      .mid span {
        font-size: 0.68rem;
        color: var(--ev-text-2);
      }
      .legend {
        display: grid;
        gap: 10px;
        font-size: 0.8rem;
        min-width: 0;
      }
      .legend .k {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--ev-text-2);
      }
      .legend .k svg {
        width: 14px;
        height: 14px;
      }
      .legend .washer-c {
        color: var(--ev-washer);
      }
      .legend .dryer-c {
        color: var(--ev-dryer);
      }
      .legend b {
        display: block;
        font-weight: 650;
        font-size: 0.9rem;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }
      .kpis {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 8px;
        margin-top: 16px;
      }
      .kpi {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-radius: var(--ev-radius-sm);
        background: var(--ev-surface);
        border: 1px solid color-mix(in srgb, var(--ev-line) 55%, transparent);
        min-width: 0;
      }
      .kpi .ic {
        flex: none;
        width: 30px;
        height: 30px;
        border-radius: 10px;
        display: grid;
        place-items: center;
        color: var(--tint, var(--ev-text-2));
        background: color-mix(in srgb, var(--tint, var(--ev-text-2)) 14%, transparent);
      }
      .kpi .ic svg {
        width: 17px;
        height: 17px;
      }
      .kpi .v {
        font-size: 0.95rem;
        font-weight: 650;
        line-height: 1.2;
        font-variant-numeric: tabular-nums;
        overflow-wrap: break-word;
      }
      .kpi .l {
        font-size: 0.7rem;
        color: var(--ev-text-2);
        line-height: 1.25;
      }
      .kpi > div:last-child {
        min-width: 0;
      }
    `
];
J([
  f({ attribute: !1 })
], z.prototype, "t", 2);
J([
  f({ attribute: !1 })
], z.prototype, "fmt", 2);
J([
  f({ attribute: !1 })
], z.prototype, "account", 2);
J([
  F()
], z.prototype, "width", 2);
J([
  F()
], z.prototype, "active", 2);
z = J([
  M("ev-spend")
], z);
function pe(e) {
  let t = -1, s = 0;
  if (e.forEach((a, o) => {
    const l = a.reduce((d, u) => d + u, 0);
    l > s && (s = l, t = o);
  }), t < 0) return null;
  const n = e[t];
  let r = 0, i = -1;
  for (let a = 0; a < Math.min(n.length, 24) - 1; a++) {
    const o = (n[a] ?? 0) + (n[a + 1] ?? 0);
    o > i && (i = o, r = a);
  }
  return { weekday: t, startHour: r, endHour: r + 2, total: s };
}
function Js(e) {
  return Array.from(
    { length: 7 },
    (t, s) => Array.from({ length: 24 }, (n, r) => Math.max(0, e?.[s]?.[r] ?? 0))
  );
}
function Qs(e) {
  return e.reduce((t, s) => Math.max(t, ...s), 0);
}
function tn(e, t) {
  return e <= 0 || t <= 0 ? 0 : Math.min(1, 0.18 + 0.82 * Math.sqrt(e / t));
}
var en = Object.defineProperty, sn = Object.getOwnPropertyDescriptor, lt = (e, t, s, n) => {
  for (var r = n > 1 ? void 0 : n ? sn(t, s) : t, i = e.length - 1, a; i >= 0; i--)
    (a = e[i]) && (r = (n ? a(t, s, r) : a(r)) || r);
  return n && r && en(t, s, r), r;
};
let I = class extends x {
  constructor() {
    super(...arguments), this.matrix = [], this.hover = null;
  }
  insightText(e) {
    const t = this.t, s = pe(e);
    if (!s) return t("insightNone");
    const n = ie(this.fmt, "long")[s.weekday], r = t("insight", { day: "\0", from: s.startHour, to: s.endHour }), [i, a] = r.split("\0");
    return c`${i}<em>${n}</em>${a}`;
  }
  render() {
    const e = Js(this.matrix), t = Qs(e), s = ie(this.fmt, "short"), n = pe(e), r = this.t, i = this.hover, a = [0.18, 0.4, 0.62, 0.82, 1];
    return c`
      <section class="panel" aria-label="${r("heatmap")}">
        <div class="panel-head"><span class="label">${r("heatmap")}</span></div>
        <div class="insight">${this.insightText(e)}</div>
        <div class="map" role="img" aria-label="${r("heatmap")}">
          ${e.map(
      (o, l) => c`<span class="dow">${s[l]}</span>${o.map((d, u) => {
        const h = n && n.weekday === l && u >= n.startHour && u < n.endHour, v = i && i.d === l && i.h === u;
        return c`<div class="cell ${h ? "top" : ""} ${v ? "hov" : ""}"
                title="${s[l]} ${String(u).padStart(2, "0")}:00 · ${r("uses_n", { n: d })}"
                @pointerenter=${() => this.hover = { d: l, h: u }}
                @pointerleave=${() => this.hover = null}>
                ${d > 0 ? c`<i style="--o:${tn(d, t).toFixed(3)};--c:${(l * 3 + u) % 24}"></i>` : p}
              </div>`;
      })}`
    )}
          <span></span>${[0, 3, 6, 9, 12, 15, 18, 21].map((o) => c`<span class="hl" aria-hidden="true">${String(o).padStart(2, "0")}</span>`)}
        </div>
        <div class="foot">
          <span>${i ? `${s[i.d]} ${String(i.h).padStart(2, "0")}–${String((i.h + 1) % 24).padStart(2, "0")} · ${r("uses_n", { n: e[i.d][i.h] })}` : ""}</span>
          <span class="legend">${r("less")}<span></span><i class="zero"></i>${a.map((o) => c`<i style="--o:${o}"></i>`)}<span></span>${r("more")}</span>
        </div>
      </section>
    `;
  }
};
I.styles = [
  S,
  C,
  P,
  w`
      .insight {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 14px;
        font-size: 0.92rem;
        font-weight: 550;
        line-height: 1.35;
      }
      .insight::before {
        content: '';
        flex: none;
        width: 4px;
        align-self: stretch;
        border-radius: 4px;
        background: var(--primary-color, var(--ev-washer));
      }
      .insight em {
        font-style: normal;
        color: var(--primary-color, var(--ev-washer));
      }
      .map {
        display: grid;
        grid-template-columns: auto repeat(24, minmax(0, 1fr));
        gap: 3px;
        align-items: center;
      }
      .dow {
        font-size: 0.68rem;
        color: var(--ev-text-2);
        padding-right: 6px;
        text-transform: capitalize;
        white-space: nowrap;
      }
      .cell {
        position: relative;
        aspect-ratio: 1;
        min-width: 0;
        border-radius: 25%;
        background: color-mix(in srgb, var(--ev-text) 6%, transparent);
        overflow: hidden;
        cursor: default;
      }
      .cell i {
        position: absolute;
        inset: 0;
        background: var(--primary-color, var(--ev-washer));
        opacity: var(--o);
        animation: fade 0.6s ease both;
        animation-delay: calc(var(--c) * 12ms);
      }
      .cell.top {
        outline: 1.5px solid color-mix(in srgb, var(--primary-color, var(--ev-washer)) 60%, var(--ev-text));
        outline-offset: -1.5px;
      }
      .cell.hov {
        outline: 1.5px solid var(--ev-text);
        outline-offset: -1.5px;
      }
      @keyframes fade {
        from {
          opacity: 0;
        }
      }
      .hl {
        grid-column: span 3;
        margin-top: 2px;
        font-size: 0.64rem;
        color: var(--ev-text-2);
        font-variant-numeric: tabular-nums;
        line-height: 1;
      }
      .foot {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-top: 12px;
        font-size: 0.72rem;
        color: var(--ev-text-2);
        min-height: 1.3em;
      }
      .legend {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .legend i {
        width: 12px;
        height: 12px;
        border-radius: 4px;
        background: var(--primary-color, var(--ev-washer));
        opacity: var(--o);
      }
      .legend i.zero {
        background: color-mix(in srgb, var(--ev-text) 10%, transparent);
        opacity: 1;
      }
      .legend span {
        margin: 0 4px;
      }
    `
];
lt([
  f({ attribute: !1 })
], I.prototype, "t", 2);
lt([
  f({ attribute: !1 })
], I.prototype, "fmt", 2);
lt([
  f({ attribute: !1 })
], I.prototype, "matrix", 2);
lt([
  F()
], I.prototype, "hover", 2);
I = lt([
  M("ev-heatmap")
], I);
var nn = Object.defineProperty, rn = Object.getOwnPropertyDescriptor, xt = (e, t, s, n) => {
  for (var r = n > 1 ? void 0 : n ? rn(t, s) : t, i = e.length - 1, a; i >= 0; i--)
    (a = e[i]) && (r = (n ? a(t, s, r) : a(r)) || r);
  return n && r && nn(t, s, r), r;
};
const an = 8;
let K = class extends x {
  constructor() {
    super(...arguments), this.entries = [];
  }
  row(e) {
    const { t, fmt: s } = this, n = e.kind === "payment" || e.amount_dkk < 0, r = e.unit_type === "dryer" ? "dryer" : e.unit_type === "mangle" ? "mangle" : "washer", i = !!e.description && /husleje|rent/i.test(e.description), a = n ? t("payment") : e.unit_id != null && e.unit_type ? `${t(`type_${r}`)} ${e.unit_id}` : e.unit_label ?? t("type_other"), o = [];
    n ? e.description && o.push(e.description) : (e.temperature_c != null && o.push(`${e.temperature_c}°C`), e.duration_min != null && o.push(t("min", { n: e.duration_min })), e.program != null && e.program !== "" && (r === "washer" || e.duration_min == null) && o.push(t("program", { n: e.program })));
    const l = [$e(s, e.date), e.time].filter(Boolean).join(" "), d = n ? k(s, Math.abs(e.amount_dkk), "always") : k(s, -Math.abs(e.amount_dkk));
    return c`
      <li title="${e.description ?? ""}" class="${n ? "pay" : `t-${r}`}">
        <span class="ic">${n ? i ? Ae : Me : U(r)}</span>
        <div class="main">
          <div class="title"><span>${a}</span>${o.length ? c`<span class="det">${o.join(" · ")}</span>` : p}</div>
          <div class="meta">${l}</div>
        </div>
        <div class="amt ${n ? "plus" : ""}">${d}</div>
      </li>
    `;
  }
  render() {
    const e = this.entries.slice(0, an);
    return c`
      <section class="panel" aria-label="${this.t("activity")}">
        <div class="panel-head"><span class="label">${this.t("activity")}</span></div>
        ${e.length ? c`<ol>${e.map((t) => this.row(t))}</ol>` : c`<div class="empty">${this.t("noActivity")}</div>`}
      </section>
    `;
  }
};
K.styles = [
  S,
  C,
  P,
  w`
      ol {
        list-style: none;
        margin: 0;
        padding: 0;
        position: relative;
      }
      li {
        position: relative;
        display: grid;
        grid-template-columns: 34px 1fr auto;
        align-items: center;
        gap: 12px;
        padding: 7px 0;
      }
      li:not(:last-child)::before {
        content: '';
        position: absolute;
        left: 16.5px;
        top: 41px;
        bottom: -7px;
        width: 1px;
        background: var(--ev-line);
        opacity: 0.8;
      }
      .ic {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        color: var(--accent);
        background: color-mix(in srgb, var(--accent) 15%, var(--card-background-color, transparent));
        border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
        position: relative;
        z-index: 1;
      }
      .ic svg {
        width: 18px;
        height: 18px;
      }
      .pay {
        --accent: var(--ev-free);
      }
      .main {
        min-width: 0;
      }
      .title {
        font-size: 0.9rem;
        font-weight: 600;
        line-height: 1.3;
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        column-gap: 8px;
      }
      .title .det {
        font-weight: 450;
        font-size: 0.82rem;
        color: var(--ev-text-2);
        white-space: nowrap;
      }
      .meta {
        font-size: 0.75rem;
        color: var(--ev-text-2);
        margin-top: 2px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
      }
      .amt {
        text-align: right;
        font-size: 0.92rem;
        font-weight: 650;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }
      .amt.plus {
        color: var(--ev-free);
      }
      .empty {
        font-size: 0.85rem;
        color: var(--ev-text-2);
      }
    `
];
xt([
  f({ attribute: !1 })
], K.prototype, "t", 2);
xt([
  f({ attribute: !1 })
], K.prototype, "fmt", 2);
xt([
  f({ attribute: !1 })
], K.prototype, "entries", 2);
K = xt([
  M("ev-activity")
], K);
var on = Object.defineProperty, ln = Object.getOwnPropertyDescriptor, _t = (e, t, s, n) => {
  for (var r = n > 1 ? void 0 : n ? ln(t, s) : t, i = e.length - 1, a; i >= 0; i--)
    (a = e[i]) && (r = (n ? a(t, s, r) : a(r)) || r);
  return n && r && on(t, s, r), r;
};
const cn = ["machines", "balance", "spend", "heatmap", "activity"], Mt = new Wt();
let G = class extends x {
  constructor() {
    super(...arguments), this.config = { type: "custom:e-vaskeri-card" }, this.now = Date.now(), this.machines = null, this.account = null, this.machinesEntity = null, this.accountEntity = null;
  }
  static getConfigElement() {
    return document.createElement("e-vaskeri-card-editor");
  }
  static getStubConfig() {
    return {};
  }
  setConfig(e) {
    if (!e || typeof e != "object") throw new Error("Invalid configuration");
    this.config = { ...e }, this.machinesRef = this.accountRef = void 0;
  }
  getCardSize() {
    const e = this.sections(), t = this.machines?.machines ?? [];
    let s = 2;
    return e.has("machines") && (s += 3 + vt(t).reduce((n, r) => n + 1 + Math.ceil(r.machines.length / 3) * 3, 0)), e.has("balance") && (s += 3), e.has("spend") && (s += 6), e.has("heatmap") && (s += 4), e.has("activity") && (s += 6), s;
  }
  getGridOptions() {
    return { columns: 12, rows: "auto", min_columns: 6, min_rows: 3 };
  }
  connectedCallback() {
    super.connectedCallback(), this.now = Date.now(), this.timer = window.setInterval(() => this.tick(), 1e3);
  }
  disconnectedCallback() {
    window.clearInterval(this.timer), super.disconnectedCallback();
  }
  tick() {
    this.now = Date.now(), this.machines && Mt.observe(this.machines.machines, this.now, this.machines.updatedAt);
  }
  willUpdate(e) {
    if (e.has("hass") || e.has("config")) {
      const t = as(this.hass, this.config);
      this.machinesEntity = t.machinesEntity, this.accountEntity = t.accountEntity;
      const s = t.machinesEntity ? this.hass?.states?.[t.machinesEntity] : void 0;
      (s !== this.machinesRef || e.has("config")) && (this.machinesRef = s, this.machines = ps(this.hass, t.machinesEntity), this.machines && Mt.observe(this.machines.machines, Date.now(), this.machines.updatedAt));
      const n = t.accountEntity ? this.hass?.states?.[t.accountEntity] : void 0;
      (n !== this.accountRef || e.has("config")) && (this.accountRef = n, this.account = ms(this.hass, t.accountEntity));
    }
  }
  sections() {
    return this.config.compact ? /* @__PURE__ */ new Set(["machines"]) : new Set(this.config.show ?? cn);
  }
  alert(e, t, s) {
    return c`<div class="alert ${e}" role="${e === "err" ? "alert" : "note"}">
      ${e === "info" ? Cs : ke}
      <div>${t ? c`<b>${t}</b>` : p}${s}</div>
    </div>`;
  }
  render() {
    if (!this.hass)
      return c`<ha-card><div class="root"><div class="skeleton"></div></div></ha-card>`;
    const e = es(this.hass, this.config.language), t = it(e.lang), s = this.sections(), n = this.machines;
    if (!(!!(this.machinesEntity || this.accountEntity) && !!(this.machinesEntity && this.hass.states[this.machinesEntity] || this.accountEntity && this.hass.states[this.accountEntity])))
      return c`<ha-card><div class="root">
        <ev-header .t=${t} .title=${this.config.title ?? ""} status="unavailable"></ev-header>
        ${this.alert("warn", t("setupTitle"), t("setupBody"))}
      </div></ha-card>`;
    const i = $s(n, this.now), a = n ? bs(n.machines, this.config.machine_types) : [], o = s.has("balance") || s.has("spend") || s.has("heatmap") || s.has("activity"), l = this.account?.available ? this.account : null, d = l?.stats, u = [], h = [];
    return s.has("balance") && l && u.push(c`<ev-balance .t=${t} .fmt=${e} .account=${l}></ev-balance>`), s.has("spend") && l && d?.months.length && u.push(c`<ev-spend .t=${t} .fmt=${e} .account=${l}></ev-spend>`), s.has("heatmap") && d?.heatmap.length && h.push(c`<ev-heatmap .t=${t} .fmt=${e} .matrix=${d.heatmap}></ev-heatmap>`), s.has("activity") && l && l.recent.length && h.push(c`<ev-activity .t=${t} .fmt=${e} .entries=${l.recent}></ev-activity>`), c`
      <ha-card class="${this.config.compact ? "compact" : ""}">
        <div class="root">
          <ev-header
            .t=${t}
            .title=${this.config.title || n?.location || ""}
            .status=${i}
            .upstream=${n?.upstreamUpdated ?? null}
            .ageMin=${gs(n?.updatedAt ?? null, this.now)}
          ></ev-header>
          ${i === "unavailable" && s.has("machines") ? this.alert("err", null, this.machinesEntity ? t("unavailableBody") : t("noMachines")) : p}
          ${s.has("machines") && n?.available ? c`
                <ev-rings .t=${t} .machines=${a} .now=${this.now} .updatedAt=${n.updatedAt}></ev-rings>
                <ev-machines
                  .t=${t}
                  .fmt=${e}
                  .machines=${a}
                  .now=${this.now}
                  .updatedAt=${n.updatedAt}
                  .tracker=${Mt}
                ></ev-machines>
              ` : p}
          ${o && !this.accountEntity ? this.alert("info", null, t("noAccount")) : p}
          ${o && this.accountEntity && !l ? this.alert("info", null, t("unavailableBody")) : p}
          ${u.length || h.length ? c`<div class="cols ${u.length && h.length ? "" : "single"}">
                ${u.length ? c`<div class="col">${u}</div>` : p}
                ${h.length ? c`<div class="col">${h}</div>` : p}
              </div>` : p}
        </div>
      </ha-card>
    `;
  }
};
G.styles = [
  S,
  C,
  P,
  w`
      :host {
        display: block;
      }
      ha-card {
        display: block;
        overflow: hidden;
      }
      .root {
        container-type: inline-size;
        padding: 18px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .cols {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 16px;
      }
      .col {
        display: flex;
        flex-direction: column;
        gap: 16px;
        min-width: 0;
      }
      @container (min-width: 880px) {
        .cols {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          align-items: start;
        }
        .cols.single {
          grid-template-columns: minmax(0, 1fr);
        }
      }
      @container (max-width: 380px) {
        .root {
          gap: 12px;
        }
      }
      .compact .root {
        gap: 14px;
      }
      .alert {
        display: flex;
        gap: 12px;
        padding: 12px 14px;
        border-radius: var(--ev-radius-sm);
        font-size: 0.86rem;
        line-height: 1.45;
        color: var(--ev-text);
        background: color-mix(in srgb, var(--tone, var(--ev-washer)) 12%, transparent);
        border: 1px solid color-mix(in srgb, var(--tone, var(--ev-washer)) 35%, transparent);
        border-left: 4px solid var(--tone, var(--ev-washer));
      }
      .alert svg {
        flex: none;
        width: 22px;
        height: 22px;
        color: var(--tone, var(--ev-washer));
      }
      .alert b {
        display: block;
        margin-bottom: 2px;
      }
      .alert.warn {
        --tone: var(--ev-done);
      }
      .alert.err {
        --tone: var(--ev-error);
      }
      .skeleton {
        height: 160px;
        border-radius: var(--ev-radius);
        background: linear-gradient(100deg, var(--ev-surface) 30%, var(--ev-surface-2) 50%, var(--ev-surface) 70%);
        background-size: 200% 100%;
        animation: shimmer 1.4s linear infinite;
      }
      @keyframes shimmer {
        to {
          background-position: -200% 0;
        }
      }
    `
];
_t([
  f({ attribute: !1 })
], G.prototype, "hass", 2);
_t([
  F()
], G.prototype, "config", 2);
_t([
  F()
], G.prototype, "now", 2);
G = _t([
  M("e-vaskeri-card")
], G);
var hn = Object.defineProperty, pn = Object.getOwnPropertyDescriptor, Zt = (e, t, s, n) => {
  for (var r = n > 1 ? void 0 : n ? pn(t, s) : t, i = e.length - 1, a; i >= 0; i--)
    (a = e[i]) && (r = (n ? a(t, s, r) : a(r)) || r);
  return n && r && hn(t, s, r), r;
};
const de = ["machines", "balance", "spend", "heatmap", "activity"], Et = ["washer", "dryer", "mangle"];
let gt = class extends x {
  constructor() {
    super(...arguments), this.label = (e) => it(Ct(this.hass, this.config?.language))(`editor_${e.name}`), this.changed = (e) => {
      e.stopPropagation();
      const t = { ...e.detail.value };
      for (const n of Object.keys(t)) {
        const r = t[n], i = n === "show" && Array.isArray(r) && r.length === de.length || n === "machine_types" && Array.isArray(r) && r.length === Et.length;
        (r === "" || r === void 0 || r === null || r === !1 || i || n === "language" && r === "auto") && delete t[n];
      }
      const s = { ...t, type: this.config?.type ?? "custom:e-vaskeri-card" };
      this.config = s, this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: s }, bubbles: !0, composed: !0 }));
    };
  }
  setConfig(e) {
    this.config = e;
  }
  schema() {
    const e = it(Ct(this.hass, this.config?.language));
    return [
      { name: "title", selector: { text: {} } },
      {
        name: "show",
        selector: {
          select: {
            multiple: !0,
            mode: "list",
            options: de.map((t) => ({ value: t, label: e(`sec_${t}`) }))
          }
        }
      },
      { name: "compact", selector: { boolean: {} } },
      {
        name: "machine_types",
        selector: {
          select: {
            multiple: !0,
            mode: "list",
            options: Et.map((t) => ({ value: t, label: e(`types_${t}`) }))
          }
        }
      },
      {
        name: "language",
        selector: {
          select: {
            mode: "dropdown",
            options: [
              { value: "auto", label: e("editor_auto") },
              { value: "da", label: "Dansk" },
              { value: "en", label: "English" }
            ]
          }
        }
      },
      { name: "machines_entity", selector: { entity: { domain: "sensor", integration: "e_vaskeri" } } },
      { name: "account_entity", selector: { entity: { domain: "sensor", integration: "e_vaskeri" } } }
    ];
  }
  render() {
    if (!this.config) return p;
    const e = {
      show: ["machines", "balance", "spend", "heatmap", "activity"],
      machine_types: [...Et],
      language: "auto",
      compact: !1,
      ...this.config
    };
    return c`<ha-form
      .hass=${this.hass}
      .data=${e}
      .schema=${this.schema()}
      .computeLabel=${this.label}
      @value-changed=${this.changed}
    ></ha-form>`;
  }
};
Zt([
  f({ attribute: !1 })
], gt.prototype, "hass", 2);
Zt([
  F()
], gt.prototype, "config", 2);
gt = Zt([
  M("e-vaskeri-card-editor")
], gt);
window.customCards = window.customCards || [];
window.customCards.some((e) => e.type === "e-vaskeri-card") || window.customCards.push({
  type: "e-vaskeri-card",
  name: "E-Vaskeri",
  description: it("en")("cardDescription"),
  preview: !0
});
export {
  G as EVaskeriCard
};
