// Hühnerlicht: verlängert im Winterhalbjahr (1. Oktober bis 31. März) den Tag im Hühnerstall.
//   Morgen: 30 min vor Sonnenaufgang EIN, 60 min nach Sonnenaufgang AUS
//   Abend:  60 min vor Sonnenuntergang EIN, 60 min nach Sonnenuntergang AUS
// Die Zeiten werden jeden Tag aus Sonnenauf-/-untergang (Koordinaten aus system.config) neu berechnet.
// Geschaltet wird nur an den Fenstergrenzen: wer zwischendurch von Hand (Homescreen, Admin) schaltet,
// behält diesen Zustand bis zur nächsten Grenze.
// MAC des eigenen Shelly 1PM Mini (Kleinbuchstaben, ohne Doppelpunkte), siehe Objekt-ID unter shelly.0
const SHELLY_MAC = 'xxxxxxxxxxxx';
const relaisId = `shelly.0.shelly1pmmini#${SHELLY_MAC}#1.Relay0.Switch`;
const base = '0_userdata.0.Huehnerlicht.';
const automatikId = base + 'automatik';
const saisonId = base + 'saison';

const MORGEN_EIN_MIN = -30;
const MORGEN_AUS_MIN = 60;
const ABEND_EIN_MIN = -60;
const ABEND_AUS_MIN = 60;

const zeitStates = {
    morgen_ein: 'Morgen EIN',
    morgen_aus: 'Morgen AUS',
    abend_ein: 'Abend EIN',
    abend_aus: 'Abend AUS',
};

let letzterSollwert = null;

function istSaison(date) {
    const monat = date.getMonth() + 1;
    return monat >= 10 || monat <= 3;
}

function plusMinuten(date, minuten) {
    return new Date(date.getTime() + minuten * 60000);
}

function hhmm(date) {
    return formatDate(date, 'hh:mm');
}

function tagesplan(now) {
    // Mittag als Bezug, damit getAstroDate sicher die Zeiten dieses Kalendertags liefert.
    const mittag = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    const aufgang = getAstroDate('sunrise', mittag);
    const untergang = getAstroDate('sunset', mittag);
    return {
        morgen_ein: plusMinuten(aufgang, MORGEN_EIN_MIN),
        morgen_aus: plusMinuten(aufgang, MORGEN_AUS_MIN),
        abend_ein: plusMinuten(untergang, ABEND_EIN_MIN),
        abend_aus: plusMinuten(untergang, ABEND_AUS_MIN),
    };
}

function sollwert(now, plan) {
    if (!istSaison(now)) {
        return false;
    }
    return (now >= plan.morgen_ein && now < plan.morgen_aus) || (now >= plan.abend_ein && now < plan.abend_aus);
}

function aktualisieren(erzwingen) {
    const now = new Date();
    const plan = tagesplan(now);
    const saison = istSaison(now);

    setState(saisonId, saison, true);
    for (const key of Object.keys(zeitStates)) {
        setState(base + key, hhmm(plan[key]), true);
    }

    const soll = sollwert(now, plan);
    const wechsel = letzterSollwert !== null && soll !== letzterSollwert;
    letzterSollwert = soll;

    if (!getState(automatikId).val) {
        return;
    }
    // Ausserhalb der Saison nichts anfassen (das letzte Fenster am 31. März endet vor Mitternacht).
    if (!saison) {
        return;
    }
    if ((wechsel || erzwingen) && getState(relaisId).val !== soll) {
        log(`Hühnerlicht ${soll ? 'EIN' : 'AUS'} (Plan ${hhmm(plan.morgen_ein)}–${hhmm(plan.morgen_aus)}, ${hhmm(plan.abend_ein)}–${hhmm(plan.abend_aus)})`);
        setState(relaisId, soll);
    }
}

async function init() {
    await createStateAsync(automatikId, true, { name: 'Hühnerlicht Automatik', type: 'boolean', role: 'switch', read: true, write: true });
    await createStateAsync(saisonId, false, { name: 'Hühnerlicht Saison aktiv (1.10.–31.3.)', type: 'boolean', role: 'indicator', read: true, write: false });
    for (const [key, name] of Object.entries(zeitStates)) {
        await createStateAsync(base + key, '', { name: 'Hühnerlicht ' + name, type: 'string', role: 'text', read: true, write: false });
    }

    aktualisieren(true);
    schedule('* * * * *', () => aktualisieren(false));
    // Automatik wieder eingeschaltet -> sofort auf den Plan setzen.
    on({ id: automatikId, change: 'ne', val: true }, () => aktualisieren(true));
}

init();
