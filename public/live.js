/* «حِصن» — اتصال حي يعمل عبر أي رابط
   بعض الوسطاء (مثل رابط Cloudflare السريع) يحجزون البث المتدفق (SSE) فلا تصل الأحداث للهاتف.
   عند فتح النظام من غير الكمبيوتر نفسه نستبدل EventSource باستطلاع طويل (long polling) بنفس الواجهة. */
(function () {
  const h = location.hostname;
  const local = h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || /^(10|192\.168|172\.(1[6-9]|2\d|3[01]))\./.test(h);
  if (local && !/[?&]poll=1/.test(location.search)) return;
  const Native = window.EventSource;
  class PollSource {
    constructor(url) {
      this.url = String(url).replace('/api/events', '/api/poll');
      this.readyState = 0; this.onopen = null; this.onerror = null; this.onmessage = null;
      this._l = {}; this._after = 0; this._closed = false; this._ctl = null;
      this._cid = Math.random().toString(36).slice(2) + Date.now().toString(36);
      setTimeout(() => this._loop(), 0);
    }
    addEventListener(t, fn) { (this._l[t] = this._l[t] || []).push(fn); }
    removeEventListener(t, fn) { this._l[t] = (this._l[t] || []).filter((f) => f !== fn); }
    close() { this._closed = true; this.readyState = 2; try { this._ctl && this._ctl.abort(); } catch {} }
    _emit(type, data) {
      const ev = { type, data };
      if (type === 'message' && this.onmessage) try { this.onmessage(ev); } catch (e) { console.error(e); }
      for (const fn of this._l[type] || []) try { fn(ev); } catch (e) { console.error(e); }
    }
    _err() { if (this.onerror) try { this.onerror({ type: 'error' }); } catch (e) { console.error(e); } }
    async _loop() {
      while (!this._closed) {
        let r = null;
        try {
          this._ctl = new AbortController();
          const sep = this.url.includes('?') ? '&' : '?';
          r = await fetch(`${this.url}${sep}cid=${this._cid}&after=${this._after}&_=${Date.now()}`, { cache: 'no-store', signal: this._ctl.signal });
        } catch {
          if (this._closed) return;
          this.readyState = 0; this._err();
          await new Promise((res) => setTimeout(res, 1500)); continue;
        }
        if (this._closed) return;
        if (r.status === 404) { this.readyState = 2; this._err(); return; }
        let j = null; try { j = await r.json(); } catch {}
        if (!j) { await new Promise((res) => setTimeout(res, 1000)); continue; }
        if (this.readyState !== 1) { this.readyState = 1; if (this.onopen) try { this.onopen({ type: 'open' }); } catch {} }
        for (const e of j.events || []) { this._after = Math.max(this._after, e.seq); this._emit(e.type, e.data); }
        if (j.gone) { this.readyState = 2; this._err(); return; } // استُبدل باتصال آخر لنفس الدور
      }
    }
  }
  PollSource.CONNECTING = 0; PollSource.OPEN = 1; PollSource.CLOSED = 2;
  PollSource.Native = Native;
  window.EventSource = PollSource;
})();
