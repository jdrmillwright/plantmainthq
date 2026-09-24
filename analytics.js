/**
 * PlantMaintHQ Zero-Cookie Analytics & Conversion Engine
 * Lightweight (<2KB), privacy-compliant, zero-cookie event tracker.
 * Tracks: Outbound CMMS vendor visits, demo requests, review pageviews, and comparison engagements.
 */
(function() {
    'use strict';

    var STORAGE_KEY = 'pmhq_analytics_v1';

    function getStore() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : { events: [], totals: { demos: 0, visits: 0, reviews: 0, comparisons: 0 }, platforms: {} };
        } catch(e) {
            return { events: [], totals: { demos: 0, visits: 0, reviews: 0, comparisons: 0 }, platforms: {} };
        }
    }

    function saveStore(store) {
        try {
            if (store.events.length > 500) {
                store.events = store.events.slice(-500);
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
        } catch(e) {}
    }

    function trackEvent(type, data) {
        var store = getStore();
        var ts = new Date().toISOString();
        var entry = {
            type: type,
            platform: data.platform || 'Unknown',
            slug: data.slug || '',
            href: data.href || '',
            path: window.location.pathname,
            ts: ts
        };

        store.events.push(entry);

        var key = data.slug || data.platform || 'general';
        if (!store.platforms[key]) {
            store.platforms[key] = { name: data.platform || key, demos: 0, visits: 0, reviews: 0, comparisons: 0 };
        }

        if (type === 'demo_click') {
            store.totals.demos = (store.totals.demos || 0) + 1;
            store.platforms[key].demos = (store.platforms[key].demos || 0) + 1;
        } else if (type === 'visit_site') {
            store.totals.visits = (store.totals.visits || 0) + 1;
            store.platforms[key].visits = (store.platforms[key].visits || 0) + 1;
        } else if (type === 'review_view') {
            store.totals.reviews = (store.totals.reviews || 0) + 1;
            store.platforms[key].reviews = (store.platforms[key].reviews || 0) + 1;
        } else if (type === 'vs_view') {
            store.totals.comparisons = (store.totals.comparisons || 0) + 1;
            store.platforms[key].comparisons = (store.platforms[key].comparisons || 0) + 1;
        }

        saveStore(store);
    }

    document.addEventListener('click', function(e) {
        var target = e.target.closest('[data-track]');
        if (!target) return;

        var trackType = target.getAttribute('data-track');
        var platform = target.getAttribute('data-platform') || target.innerText.trim();
        var slug = target.getAttribute('data-slug') || '';
        var href = target.getAttribute('href') || '';

        trackEvent(trackType, { platform: platform, slug: slug, href: href });
    }, true);

    document.addEventListener('DOMContentLoaded', function() {
        var path = window.location.pathname;
        if (path.indexOf('/cmms/') !== -1) {
            var parts = path.split('/').filter(Boolean);
            var slug = parts[1] || 'unknown';
            trackEvent('review_view', { platform: slug, slug: slug });
        } else if (path.indexOf('/vs/') !== -1) {
            var parts = path.split('/').filter(Boolean);
            var matchup = parts[1] || 'unknown';
            trackEvent('vs_view', { platform: matchup, slug: matchup });
        }
    });

    window.pmhqAnalytics = {
        track: trackEvent,
        getStats: function() {
            var s = getStore();
            console.group('🏭 PlantMaintHQ Analytics Overview');
            console.log('Total Platform Visits:', s.totals.visits);
            console.log('Total Demo Inquiries:', s.totals.demos);
            console.log('Total Review Views:', s.totals.reviews);
            console.log('Total Comparisons:', s.totals.comparisons);
            var sorted = Object.entries(s.platforms).map(function(pair) {
                var p = pair[1];
                var score = (p.demos * 3) + (p.visits * 2) + p.reviews + p.comparisons;
                return {
                    Platform: p.name || pair[0],
                    'Demo Inquiries (x3)': p.demos,
                    'Outbound Visits (x2)': p.visits,
                    'Review Views': p.reviews,
                    'Comparison Views': p.comparisons,
                    'Engagement Score': score
                };
            }).sort(function(a, b) {
                return b['Engagement Score'] - a['Engagement Score'];
            });
            console.table(sorted);
            console.groupEnd();
            return sorted;
        },
        clear: function() {
            localStorage.removeItem(STORAGE_KEY);
            console.log('Analytics data reset.');
        }
    };

    if (window.location.search.indexOf('analytics=1') !== -1) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', showAnalyticsDashboard);
        } else {
            showAnalyticsDashboard();
        }
    }

    function showAnalyticsDashboard() {
        var store = getStore();
        var modal = document.createElement('div');
        modal.id = 'pmhq-analytics-modal';
        modal.style.cssText = 'position:fixed;bottom:20px;right:20px;width:360px;max-height:500px;background:#111827;border:2px solid #f59e0b;border-radius:12px;box-shadow:0 20px 40px rgba(0,0,0,0.8);z-index:99999;font-family:sans-serif;color:#f8fafc;padding:16px;overflow-y:auto;font-size:13px;';
        
        var sorted = Object.values(store.platforms).sort(function(a,b) { 
            return (b.demos*3 + b.visits*2 + b.reviews + b.comparisons) - (a.demos*3 + a.visits*2 + a.reviews + a.comparisons); 
        });
        
        var rowsHtml = sorted.slice(0, 10).map(function(p, i) {
            return '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.06);">' +
                   '<span><strong>#' + (i+1) + ' ' + (p.name || 'Unknown') + '</strong></span>' +
                   '<span style="color:#f59e0b;">' + p.visits + ' visits / ' + p.demos + ' demos</span></div>';
        }).join('') || '<div style="padding:10px 0;color:#94a3b8;">No interaction clicks recorded yet. Click outbound or review links to test!</div>';

        modal.innerHTML = 
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">' +
            '<span style="font-weight:800;color:#f59e0b;font-size:14px;">📊 PlantMaintHQ Live Tracker</span>' +
            '<button onclick="document.getElementById(\\'pmhq-analytics-modal\\').remove()" style="background:none;border:none;color:#94a3b8;font-size:16px;cursor:pointer;">&times;</button>' +
            '</div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px;margin-bottom:12px;text-align:center;">' +
            '<div style="background:#0a0e17;padding:6px;border-radius:6px;"><div style="font-size:15px;font-weight:800;color:#10b981;">' + store.totals.visits + '</div><div style="font-size:9px;color:#94a3b8;">VISITS</div></div>' +
            '<div style="background:#0a0e17;padding:6px;border-radius:6px;"><div style="font-size:15px;font-weight:800;color:#f59e0b;">' + store.totals.demos + '</div><div style="font-size:9px;color:#94a3b8;">DEMOS</div></div>' +
            '<div style="background:#0a0e17;padding:6px;border-radius:6px;"><div style="font-size:15px;font-weight:800;color:#38bdf8;">' + store.totals.reviews + '</div><div style="font-size:9px;color:#94a3b8;">REVIEWS</div></div>' +
            '<div style="background:#0a0e17;padding:6px;border-radius:6px;"><div style="font-size:15px;font-weight:800;color:#a855f7;">' + store.totals.comparisons + '</div><div style="font-size:9px;color:#94a3b8;">VS</div></div>' +
            '</div>' +
            '<div style="font-weight:700;margin-bottom:6px;font-size:11px;text-transform:uppercase;color:#94a3b8;">Top Engaging CMMS Platforms</div>' +
            rowsHtml +
            '<div style="margin-top:12px;text-align:center;"><button onclick="window.pmhqAnalytics.clear();location.reload();" style="background:rgba(239,68,68,0.15);border:1px solid #ef4444;color:#ef4444;padding:4px 8px;border-radius:4px;font-size:11px;cursor:pointer;">Reset Stats</button></div>';

        document.body.appendChild(modal);
    }
})();
