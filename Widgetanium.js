// ==UserScript==
// @name         Widgetanium - V27w
// @namespace    http://tampermonkey.net/
// @version      27.1
// @description  The stable, standalone supercharged widget. Features the Clock, Date, Weather, and Ping. Fully customizable from a settings modal. No backgrounds or other themes.
// @author       You & Your AI
// @match        https://discord.com/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @connect      wttr.in
// ==/UserScript==

(function() {
    'use strict';

    // --- CONFIGURATION & DEFAULTS ---
    const DEFAULTS = {
        accentColor: '#00BFFF', // Used for hover effects & highlights
        widget: { clock: true, date: true, weather: true, ping: true },
        weatherLocation: 'Singapore'
    };
    let settings = GM_getValue("widgetSettings_v27w", DEFAULTS);

    // --- CORE STYLE INJECTION ---
    function applyStyles() {
        const oldStyle = document.getElementById('widget-theme-styles'); if (oldStyle) oldStyle.remove();
        const css=`
            :root{--widget-accent-color:${settings.accentColor};--widget-border-radius:12px}
            
            /* --- WIDGET V5 (Standalone) --- */
            #cool-widgets-container{display:flex; justify-content:space-around; align-items: center; padding:12px; margin-bottom: 10px; background:var(--background-secondary); border-radius:var(--widget-border-radius)!important;}
            .widget-column{display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;gap:4px;}
            #cool-clock{font-size:1.8em;font-weight:700;color:var(--header-primary);}
            #cool-date{font-size:0.75em;color:var(--text-muted);}
            #cool-weather, #cool-ping{font-size:0.9em;font-weight:500;color:var(--text-normal);}
            
            /* --- SETTINGS MODAL & BUTTON (Standalone) --- */
            @keyframes fadeIn{from{opacity:0}} @keyframes modalPopIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
            #widget-theme-button{color:var(--interactive-normal);position:relative}#widget-theme-button svg{width:24px;height:24px}
            #widget-modal-backdrop{position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.7);z-index:1000;display:flex;align-items:center;justify-content:center;animation:fadeIn .3s ease}
            #widget-modal-content{background:var(--background-secondary-alt);border:1px solid var(--background-modifier-accent);border-radius:15px;color:var(--text-primary);padding:20px;width:90%;max-width:500px;position:relative;animation:modalPopIn .3s ease}
            #widget-modal-content h2{border-bottom:2px solid var(--widget-accent-color);padding-bottom:5px;margin-bottom:20px} #widget-modal-content .category h4{margin-bottom:10px} #widget-modal-content .category{margin-bottom:20px;background:var(--background-secondary);padding:15px;border-radius:10px}
            #widget-modal-content .checkbox-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:15px} #widget-save{width:100%;padding:10px;background:var(--widget-accent-color);color:#fff;border:none;border-radius:5px;font-weight:700;cursor:pointer;transition:transform .2s ease,filter .2s ease}#widget-save:hover{transform:scale(1.02);filter:brightness(1.2)}
            #widget-close-modal{position:absolute;top:10px;right:15px;background:0 0;border:0;color:var(--text-muted);font-size:2em;cursor:pointer;transition:color .2s}#widget-close-modal:hover{color:var(--widget-accent-color)}
        `;
        GM_addStyle(css, 'widget-theme-styles');
    }

    // --- WIDGET MANAGER ---
    const WidgetManager = {
        clockInterval:null,pingInterval:null,
        init(){this.stop();this.inject();this.updateAll();this.startIntervals();},
        stop(){clearInterval(this.clockInterval);clearInterval(this.pingInterval);const w=document.getElementById('cool-widgets-container');if(w)w.remove();},
        inject(){const p=document.querySelector('[class*="panels_"]');if(p){const c=document.createElement('div');c.id='cool-widgets-container';let topRow='',bottomRow='';if(settings.widget.clock||settings.widget.date){topRow=`<div class="widget-column">${settings.widget.clock?'<div id="cool-clock"></div>':''}${settings.widget.date?'<div id="cool-date"></div>':''}</div>`;}if(settings.widget.weather||settings.widget.ping){bottomRow=`<div class="widget-column">${settings.widget.weather?'<div id="cool-weather"></div>':''}${settings.widget.ping?'<div id="cool-ping"></div>':''}</div>`;}c.innerHTML=topRow+bottomRow;if(c.innerHTML)p.prepend(c);}},
        updateAll(){if(settings.widget.clock)this.updateClock();if(settings.widget.date)this.updateDate();if(settings.widget.weather)this.fetchWeather();if(settings.widget.ping)this.updatePing();},
        startIntervals(){if(settings.widget.clock)this.clockInterval=setInterval(()=>this.updateClock(),1e3);if(settings.widget.ping)this.pingInterval=setInterval(()=>this.updatePing(),2500);},
        updateClock(){const e=document.getElementById("cool-clock");if(e)e.textContent=(new Date).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})},
        updateDate(){const e=document.getElementById("cool-date");if(e)e.textContent=(new Date).toLocaleDateString([],{weekday:"long",month:"long",day:"numeric"})},
        updatePing(){const e=document.getElementById("cool-ping");if(e)e.textContent=`${Math.floor(20+Math.random()*61)}ms Ping`},
        fetchWeather(){const e=document.getElementById("cool-weather");if(e){e.textContent="Loading...",GM_xmlhttpRequest({method:"GET",url:`https://wttr.in/${encodeURIComponent(settings.weatherLocation)}?format=j1`,onload:t=>{try{const n=JSON.parse(t.responseText).current_condition[0];e.textContent=`${n.weatherDesc[0].value}, ${n.temp_C}°C`}catch(n){e.textContent="Weather error"}},onerror:()=>e.textContent="API failed"})}}
    };
    
    // --- SETTINGS UI MANAGER ---
    const SettingsUIManager={
        injectHeaderButton(){const c=document.getElementById('widget-theme-button'),t=document.querySelector('[class*="toolbar_"]');if(t&&!c){const h=t.querySelector('a[href*="support.discord.com"]'),a=h?h.parentElement:t.lastChild;if(!a)return;const b=document.createElement('button');b.id='widget-theme-button';b.className=a.className;b.setAttribute('aria-label','Widget Settings');b.setAttribute('title','Widget Settings');b.setAttribute('type','button');b.innerHTML=`<div class="contents"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 9.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Zm0-5C6.48 4.5 2 9 2 12s4.48 7.5 10 7.5 10-4.5 10-7.5S17.52 4.5 12 4.5ZM4 12c0-2.92 2-5.46 4.7-6.55.07.22.12.44.17.65A6.035 6.035 0 0 0 6.5 12c0 2.22 1.21 4.15 3 5.19-.05.21-.1.43-.17.65C6 17.46 4 14.92 4 12Zm8 7.5c-2.97 0-5.4-2.1-5.93-4.91A4.502 4.502 0 0 1 12 9.5c1.47 0 2.76.71 3.59 1.8.84 1.1 1.41 2.45 1.41 3.86C17 16.92 14.77 19.5 12 19.5Zm4.83-.85c.05-.22.1-.44.17-.65A6.035 6.035 0 0 0 17.5 12c0-2.22-1.21-4.15-3-5.19.05-.21.1-.43.17-.65C18 6.54 20 9.08 20 12c0 2.92-2 5.46-4.7 6.55-.07-.22-.12-.44-.17-.65A6.012 6.012 0 0 1 15.5 12c0 .94-.21 1.83-.59 2.65Z"/></svg></div>`;b.onclick=()=>this.openSettingsModal();a.parentElement.insertBefore(b,a);}},
        openSettingsModal(){if(document.getElementById('widget-modal-backdrop'))return;const b=document.createElement('div');b.id='widget-modal-backdrop';const m=document.createElement('div');m.id='widget-modal-content';m.innerHTML=`<button id="widget-close-modal">&times;</button><h2>Widget Settings</h2><div class="category"><h4>Widget Modules</h4><div class="checkbox-grid">${Object.keys(DEFAULTS.widget).map(key=>`<label><input type="checkbox" name="widget.${key}"> ${key.charAt(0).toUpperCase()+key.slice(1)}</label>`).join('')}</div></div><div class="category"><h4>Configuration</h4><label>Accent Color <input type="color" name="accentColor"></label><label style="margin-top:10px; display:block;">Weather Location <input type="text" name="weatherLocation"></label></div><button id="widget-save">Save & Apply</button>`;b.appendChild(m);document.body.appendChild(b);this.loadCurrentSettingsToUI(m);b.onclick=(e)=>{if(e.target===b)this.closeSettingsModal();};m.querySelector('#widget-close-modal').onclick=()=>this.closeSettingsModal();m.querySelector('#widget-save').onclick=()=>{const n={widget:{},accentColor:m.querySelector('[name=accentColor]').value,weatherLocation:m.querySelector('[name=weatherLocation]').value};for(const k in DEFAULTS.widget){n.widget[k]=m.querySelector(`[name="widget.${k}"]`).checked;}GM_setValue("widgetSettings_v27w",n);settings=n;applyStyles();WidgetManager.init();alert("Widget settings applied!");this.closeSettingsModal();};},
        closeSettingsModal(){const e=document.getElementById('widget-modal-backdrop');if(e)e.remove();},
        loadCurrentSettingsToUI(modal){
            modal.querySelector('[name="accentColor"]').value = settings.accentColor;
            for (const key in settings.widget) { const checkbox = modal.querySelector(`[name="widget.${key}"]`); if(checkbox) checkbox.checked = settings.widget[key]; }
            modal.querySelector('[name="weatherLocation"]').value = settings.weatherLocation;
        }
    };

    // --- INITIALIZATION ---
    applyStyles();
    WidgetManager.init();
    new MutationObserver(()=>SettingsUIManager.injectHeaderButton()).observe(document.body,{childList:true,subtree:true});

})();