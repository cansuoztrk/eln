/* Kale 2.0 — Eğ ve Bak: telefonu eğince ana salonun katmanları (ay, bulutlar, adacıklar, iki kule, yıldızlar ve yol
   panoraması) farklı derinliklerde kayar. iPhone ilk açışta izin ister; Tema Atölyesi'nden açılıp kapanır. */
(function () {
  'use strict';
  const K = window.K;

  let on = false, base = null, tx = 0, ty = 0, gx = 0, gy = 0, raf = 0;
  const hero = () => K.$('#hero');
  function onTilt(e) {
    if (e.beta == null || e.gamma == null) return;
    if (!base) base = { b: e.beta, g: e.gamma };
    gx = K.clamp((e.gamma - base.g) / 22, -1, 1);
    gy = K.clamp((e.beta - base.b) / 22, -1, 1);
    if (!raf) raf = requestAnimationFrame(step);
  }
  function step() {
    raf = 0;
    tx += (gx - tx) * 0.18;
    ty += (gy - ty) * 0.18;
    const h = hero();
    if (h) {
      h.style.setProperty('--tx', tx.toFixed(3));
      h.style.setProperty('--ty', ty.toFixed(3));
    }
    const p = K.$('.pn-strip');
    p && p.style.setProperty('--tx', tx.toFixed(3));
    if (Math.abs(gx - tx) > 0.002 || Math.abs(gy - ty) > 0.002) raf = requestAnimationFrame(step);
  }
  function start() {
    if (on) return;
    on = true;
    base = null;
    window.addEventListener('deviceorientation', onTilt);
    document.body.classList.add('egbak');
  }
  function stop() {
    on = false;
    window.removeEventListener('deviceorientation', onTilt);
    document.body.classList.remove('egbak');
    const h = hero();
    h && (h.style.removeProperty('--tx'), h.style.removeProperty('--ty'));
  }
  // İzin (iPhone): yalnız bir dokunuşun içinden istenebilir
  async function ask() {
    const DO = window.DeviceOrientationEvent;
    if (!DO) return false;
    if (typeof DO.requestPermission === 'function') {
      try {
        return (await DO.requestPermission()) === 'granted';
      } catch (e) {
        return false;
      }
    }
    return true;
  }
  K.on('atolyeTg', async ({ k, v }) => {
    if (k !== 'egbak') return;
    if (!v) return stop();
    if (await ask()) {
      start();
      K.stickers.award('egbak');
      K.fx.toast('📱 Telefonu hafifçe eğ: kale derinleşiyor.', { duration: 2600, log: false });
    } else {
      K.atolye.save({ egbak: false });
      const c = K.$('[data-tg="egbak"]');
      c && (c.checked = false);
      K.fx.toast('Hareket izni verilmedi. Ayarlar → Safari → Hareket ve Yönelim Erişimi açık olmalı.', { duration: 4200 });
    }
  });
  // Daha önce açıldıysa: Android'de hemen, iPhone'da ilk dokunuşta (izin bir kez verildiyse sormadan döner)
  K.on('built', () => {
    if (!K.atolye || !K.atolye.get().egbak) return;
    const DO = window.DeviceOrientationEvent;
    if (DO && typeof DO.requestPermission === 'function') {
      const once = async () => {
        document.removeEventListener('pointerup', once);
        (await ask()) && start();
      };
      document.addEventListener('pointerup', once);
    } else start();
  });
  // Ekran yeniden açılınca yeni "düz" duruş
  document.addEventListener('visibilitychange', () => !document.hidden && (base = null));
  K.egbak = { start, stop, on: () => on };
})();
